"""
Admin API Routes
================
Admin-only endpoints for contest management and platform administration.
"""

from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from bson.errors import InvalidId
from bson import ObjectId

from app.core.security import get_current_user
from app.models.user import User
from app.models.contest import Contest, ContestProblem
from app.models.notification import Notification, NotificationType

router = APIRouter()


# ============ Schemas ============

class SimpleProblemInput(BaseModel):
    """Simple problem reference for contest."""
    problem_id: str
    name: str
    difficulty: str


class CreateContestRequest(BaseModel):
    """Contest creation request."""
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10)
    start_time: datetime
    duration_minutes: int = Field(..., ge=30, le=480)  # 30 min to 8 hours
    difficulty: str = "mixed"  # easy, medium, hard, mixed
    contest_type: str = "rated"  # rated, unrated, practice
    is_public: bool = True
    max_participants: Optional[int] = None
    # Problems will be auto-selected from DSA problems  # Codeforces problems


class ContestResponse(BaseModel):
    """Contest response."""
    id: str
    title: str
    description: str
    start_time: datetime
    end_time: datetime
    duration_minutes: int
    difficulty: str
    status: str
    registered_count: int


class AdminStatsResponse(BaseModel):
    """Admin dashboard statistics."""
    total_users: int
    total_contests: int
    active_users_today: int
    pending_contests: int


# ============ Admin Check ============

async def check_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Check if current user is admin."""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


# ============ Routes ============

@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(admin: dict = Depends(check_admin)):
    """Get admin dashboard statistics."""
    total_users = await User.count()
    total_contests = await Contest.count()
    
    # Active users today (simplified - users who logged in today)
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    active_today = await User.find(User.last_login >= today_start).count()
    
    # Pending/upcoming contests
    pending_contests = await Contest.find(Contest.status == "upcoming").count()
    
    return AdminStatsResponse(
        total_users=total_users,
        total_contests=total_contests,
        active_users_today=active_today,
        pending_contests=pending_contests
    )


@router.post("/contests", response_model=ContestResponse, status_code=status.HTTP_201_CREATED)
async def create_contest(request: CreateContestRequest, admin: dict = Depends(check_admin)):
    """
    Create a new contest.
    
    - Only accessible by admin users
    - Automatically creates notification for all users
    """
    # Calculate end time
    from datetime import timedelta
    end_time = request.start_time + timedelta(minutes=request.duration_minutes)
    
    # Generate slug from title
    import re
    slug = re.sub(r'[^a-z0-9]+', '-', request.title.lower()).strip('-')
    slug = f"{slug}-{datetime.now(timezone.utc).strftime('%Y%m%d')}"
    
    # Determine initial status
    now = datetime.now(timezone.utc)
    if request.start_time > now:
        status_val = "upcoming"
    elif request.start_time <= now <= end_time:
        status_val = "ongoing"
    else:
        status_val = "completed"
    
    # Get random Competitive Programming problems
    import random
    from app.data.cp_problems import CP_PROBLEMS
    
    # Select 5 random problems from CP section
    selected_problems = random.sample(CP_PROBLEMS, min(5, len(CP_PROBLEMS)))
    
    # Convert to ContestProblem format - store problem ID for dynamic loading
    contest_problems = [
        ContestProblem(
            challenge_id=prob['id'],  # Store CP problem ID
            title=prob['name'],
            description=prob['description'],
            difficulty=prob['difficulty'],
            input_format=prob.get('input_format', ''),
            output_format=prob.get('output_format', ''),
            examples=prob.get('examples', []),
            test_cases=prob.get('test_cases', []),
            points=100,
            order=i
        )
        for i, prob in enumerate(selected_problems)
    ]
    
    # Create contest
    contest = Contest(
        title=request.title,
        slug=slug,
        description=request.description,
        start_time=request.start_time,
        end_time=end_time,
        duration_minutes=request.duration_minutes,
        difficulty=request.difficulty,
        contest_type=request.contest_type,
        is_public=request.is_public,
        max_participants=request.max_participants,
        status=status_val,
        created_by=admin.get("user_id"),
        problems=contest_problems,
        tags=[]
    )
    await contest.insert()
    
    # Create notification for all users
    problem_count = len(contest_problems)
    notification = Notification(
        user_id="all",  # Broadcast to all users
        title=f"🏆 New Contest: {request.title}",
        message=f"A new {request.difficulty} level contest '{request.title}' is scheduled for {request.start_time.strftime('%B %d, %Y at %I:%M %p')}. Duration: {request.duration_minutes} minutes. {problem_count} problem{'s' if problem_count != 1 else ''} to solve. Don't miss it!",
        notification_type=NotificationType.CONTEST_CREATED,
        related_type="contest",
        related_id=str(contest.id),
        action_url=f"/compete/contest/{contest.id}"
    )
    await notification.insert()
    
    return ContestResponse(
        id=str(contest.id),
        title=contest.title,
        description=contest.description,
        start_time=contest.start_time,
        end_time=contest.end_time,
        duration_minutes=contest.duration_minutes,
        difficulty=contest.difficulty,
        status=contest.status,
        registered_count=contest.registered_count
    )


@router.get("/contests", response_model=List[ContestResponse])
async def list_admin_contests(
    status: Optional[str] = None,
    limit: int = 20,
    admin: dict = Depends(check_admin)
):
    """List all contests for admin management."""
    query = Contest.find()
    
    if status:
        query = query.find(Contest.status == status)
    
    contests = await query.sort(-Contest.created_at).limit(limit).to_list()
    
    return [
        ContestResponse(
            id=str(c.id),
            title=c.title,
            description=c.description,
            start_time=c.start_time,
            end_time=c.end_time,
            duration_minutes=c.duration_minutes,
            difficulty=c.difficulty,
            status=c.status,
            registered_count=c.registered_count
        )
        for c in contests
    ]


@router.put("/contests/{contest_id}")
async def update_contest(
    contest_id: str,
    request: CreateContestRequest,
    admin: dict = Depends(check_admin)
):
    """Update an existing contest."""
    try:
        contest = await Contest.get(contest_id)
    except (InvalidId, Exception):
        contest = None
    if not contest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contest not found"
        )
    
    # Calculate end time
    from datetime import timedelta
    end_time = request.start_time + timedelta(minutes=request.duration_minutes)
    
    # Update fields
    contest.title = request.title
    contest.description = request.description
    contest.start_time = request.start_time
    contest.end_time = end_time
    contest.duration_minutes = request.duration_minutes
    contest.difficulty = request.difficulty
    contest.contest_type = request.contest_type
    contest.is_public = request.is_public
    contest.max_participants = request.max_participants
    contest.updated_at = datetime.utcnow()
    
    await contest.save()
    
    return {"message": "Contest updated successfully"}


@router.delete("/contests/{contest_id}")
async def delete_contest(contest_id: str, admin: dict = Depends(check_admin)):
    """Delete a contest (soft delete by changing status)."""
    try:
        contest = await Contest.get(contest_id)
    except (InvalidId, Exception):
        contest = None
    if not contest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contest not found"
        )
    
    await contest.delete()
    
    return {"message": "Contest deleted successfully"}


@router.get("/users")
async def list_users(
    role: Optional[str] = None,
    limit: int = 50,
    skip: int = 0,
    admin: dict = Depends(check_admin)
):
    """List all users for admin management."""
    query = User.find()
    
    if role:
        query = query.find(User.role == role)
    
    users = await query.skip(skip).limit(limit).to_list()
    
    return {
        "users": [
            {
                "id": str(u.id),
                "email": u.email,
                "username": u.username,
                "full_name": u.full_name,
                "role": u.role,
                "is_active": u.is_active,
                "created_at": u.created_at,
                "last_login": u.last_login
            }
            for u in users
        ],
        "total": await User.count()
    }


@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    role: str,
    admin: dict = Depends(check_admin)
):
    """Update user role (admin/user)."""
    if role not in ["admin", "user"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be 'admin' or 'user'"
        )
    
    user = await User.get(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.role = role
    user.updated_at = datetime.utcnow()
    await user.save()
    
    return {"message": f"User role updated to {role}"}


@router.post("/notifications/broadcast")
async def broadcast_notification(
    title: str,
    message: str,
    title_ur: Optional[str] = None,
    message_ur: Optional[str] = None,
    admin: dict = Depends(check_admin)
):
    """Send a broadcast notification to all users."""
    notification = Notification(
        user_id="all",
        title=title,
        title_ur=title_ur,
        message=message,
        message_ur=message_ur,
        notification_type=NotificationType.ANNOUNCEMENT
    )
    await notification.insert()
    
    return {"message": "Notification broadcast successfully"}
