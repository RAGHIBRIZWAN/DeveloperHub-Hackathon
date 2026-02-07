"""
Competitive Programming API Routes
==================================
Contests, leaderboards, and ratings.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, List
from fastapi import APIRouter, HTTPException, status, Depends, Query, Body
from pydantic import BaseModel
from bson import ObjectId
from bson.errors import InvalidId

from app.core.security import get_current_user, get_current_admin
from app.models.contest import Contest, ContestParticipation, ContestProblem
from app.models.challenge import Submission
from app.models.user import User
from app.models.gamification import UserRewards

router = APIRouter()


def _to_naive_utc(dt):
    """Convert any datetime to naive UTC for safe comparison.
    Handles both timezone-aware and naive datetimes consistently."""
    if dt is None:
        return None
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt  # assume already UTC


def _utcnow():
    """Get current UTC time as naive datetime."""
    return datetime.utcnow()


# ============ Helpers ============

async def get_contest_safe(contest_id: str) -> Contest:
    """Safely retrieve a contest by ID, handling invalid ObjectId and auto-updating status."""
    try:
        contest = await Contest.get(contest_id)
    except (InvalidId, Exception):
        raise HTTPException(status_code=404, detail="Contest not found")
    
    if not contest:
        raise HTTPException(status_code=404, detail="Contest not found")
    
    # Auto-update contest status based on current time
    # Normalize all datetimes to naive UTC for safe comparison
    now = _utcnow()
    start_time = _to_naive_utc(contest.start_time)
    end_time = _to_naive_utc(contest.end_time)
    
    new_status = None
    if contest.status == "upcoming" and now >= start_time:
        new_status = "ongoing" if now < end_time else "completed"
    elif contest.status == "ongoing" and now >= end_time:
        new_status = "completed"
    
    if new_status:
        contest.status = new_status
        contest.updated_at = now
        try:
            await contest.save()
        except Exception:
            pass  # Non-critical, still return the contest with corrected status
    
    return contest


# ============ Schemas ============

class CreateContestRequest(BaseModel):
    """Request to create a contest."""
    title: str
    title_ur: Optional[str] = None
    description: str
    description_ur: Optional[str] = None
    problem_ids: List[str]
    start_time: datetime
    duration_minutes: int
    contest_type: str = "rated"
    is_public: bool = True
    max_participants: Optional[int] = None


class RegisterContestRequest(BaseModel):
    """Request to register for a contest."""
    contest_id: str


# ============ ELO Rating System ============

def calculate_elo_change(
    current_rating: int,
    opponent_rating: int,
    score: float,  # 1 for win, 0.5 for draw, 0 for loss
    k_factor: int = 32
) -> int:
    """Calculate ELO rating change."""
    expected = 1 / (1 + 10 ** ((opponent_rating - current_rating) / 400))
    change = k_factor * (score - expected)
    return int(round(change))


def calculate_contest_rating_change(
    current_rating: int,
    rank: int,
    total_participants: int,
    avg_rating: int
) -> int:
    """Calculate rating change based on contest performance."""
    # Expected rank based on rating difference
    expected_rank = total_participants * (1 / (1 + 10 ** ((current_rating - avg_rating) / 400)))
    
    # Performance score (0-1 based on rank)
    actual_score = 1 - (rank - 1) / max(total_participants - 1, 1)
    expected_score = 1 - (expected_rank - 1) / max(total_participants - 1, 1)
    
    # K-factor based on current rating
    if current_rating < 1200:
        k = 40
    elif current_rating < 1600:
        k = 32
    else:
        k = 24
    
    change = int(k * (actual_score - expected_score) * 2)
    return change


async def _auto_finalize_contest(contest):
    """Auto-finalize a completed contest — rank participants, award XP/coins/rating."""
    all_participations = await ContestParticipation.find(
        {"contest_id": str(contest.id)}
    ).to_list()
    
    if not all_participations:
        contest.is_results_published = True
        await contest.save()
        return
    
    qualified = [p for p in all_participations if not getattr(p, 'is_disqualified', False)]
    disqualified = [p for p in all_participations if getattr(p, 'is_disqualified', False)]
    
    qualified.sort(key=lambda p: (-p.total_points, p.total_penalty))
    
    total_rating = sum(p.old_rating or 1000 for p in qualified)
    avg_rating = total_rating // max(len(qualified), 1)
    
    for rank, p in enumerate(qualified, 1):
        p.rank = rank
        participant_user = await User.get(p.user_id)
        if not participant_user:
            await p.save()
            continue
        
        if rank == 1:
            xp_award, coins_award = 150, 75
        elif rank == 2:
            xp_award, coins_award = 100, 50
        elif rank == 3:
            xp_award, coins_award = 75, 35
        elif rank <= 10:
            xp_award, coins_award = 40, 20
        else:
            xp_award, coins_award = 15, 10
        
        participant_user.add_xp(xp_award)
        participant_user.add_coins(coins_award)
        participant_user.stats.total_contests_participated += 1
        if rank == 1:
            participant_user.stats.total_contests_won += 1
        
        if contest.contest_type == "rated":
            rating_change = calculate_contest_rating_change(
                p.old_rating or 1000, rank, len(qualified), avg_rating
            )
            p.rating_change = rating_change
            p.new_rating = (p.old_rating or 1000) + rating_change
            participant_user.rating = max(0, p.new_rating)
            participant_user.max_rating = max(participant_user.max_rating, participant_user.rating)
        
        participant_user.updated_at = _utcnow()
        await participant_user.save()
        
        try:
            rewards = await UserRewards.find_one({"user_id": p.user_id})
            if not rewards:
                rewards = UserRewards(user_id=p.user_id)
                await rewards.insert()
            rewards.total_xp_earned += xp_award
            rewards.add_coins(coins_award, "contest", f"Contest rank #{rank} - {contest.title}")
            await rewards.save()
        except Exception:
            pass
        
        await p.save()
    
    for p in disqualified:
        p.rank = None
        p.total_points = 0
        p.problems_solved = 0
        participant_user = await User.get(p.user_id)
        if participant_user:
            participant_user.stats.total_contests_participated += 1
            participant_user.updated_at = _utcnow()
            await participant_user.save()
        await p.save()
    
    contest.is_results_published = True
    await contest.save()
    print(f"Auto-finalized contest {contest.id}: {len(qualified)} ranked, {len(disqualified)} disqualified")


# ============ Routes ============

@router.get("/contests")
async def get_contests(
    status: Optional[str] = Query(None, description="Filter by status: upcoming, ongoing, completed"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """
    Get list of contests.
    """
    # Auto-update contest statuses before querying
    # Use naive UTC - PyMongo treats naive datetimes as UTC for queries
    now = _utcnow()
    await Contest.find({"status": "upcoming", "start_time": {"$lte": now}, "end_time": {"$gt": now}}).update_many({"$set": {"status": "ongoing", "updated_at": now}})
    await Contest.find({"status": {"$in": ["upcoming", "ongoing"]}, "end_time": {"$lte": now}}).update_many({"$set": {"status": "completed", "updated_at": now}})
    
    # Auto-finalize completed contests that haven't been finalized yet
    unfinalized = await Contest.find({"status": "completed", "is_results_published": False}).to_list()
    for uf_contest in unfinalized:
        try:
            await _auto_finalize_contest(uf_contest)
        except Exception as e:
            print(f"Auto-finalize failed for contest {uf_contest.id}: {e}")
    
    query = {}
    
    if status:
        query["status"] = status
    
    skip = (page - 1) * limit
    contests = await Contest.find(query).sort("-start_time").skip(skip).limit(limit).to_list()
    total = await Contest.find(query).count()
    
    # Fetch problem details from CP_PROBLEMS for display
    from app.data.cp_problems import get_problem_by_id
    
    return {
        "contests": [
            {
                "id": str(c.id),
                "title": c.title,
                "description": c.description,
                "start_time": _to_naive_utc(c.start_time).isoformat() + "Z",
                "end_time": _to_naive_utc(c.end_time).isoformat() + "Z",
                "duration_minutes": c.duration_minutes,
                "contest_type": c.contest_type,
                "difficulty": c.difficulty,
                "status": c.status,
                "registered_count": c.registered_count,
                "num_problems": len(c.problems),
                "problems": [
                    {
                        "order": p.order,
                        "title": p.title or (get_problem_by_id(p.challenge_id)['name'] if p.challenge_id and get_problem_by_id(p.challenge_id) else f"Problem {chr(65 + p.order)}"),
                        "challenge_id": p.challenge_id,
                        "codeforces_id": p.codeforces_id,
                        "rating": p.codeforces_rating or (get_problem_by_id(p.challenge_id).get('rating') if p.challenge_id and get_problem_by_id(p.challenge_id) else None)
                    }
                    for p in c.problems
                ] if c.problems else []
            }
            for c in contests
        ],
        "total": total,
        "page": page,
        "limit": limit
    }


@router.get("/contests/{contest_id}")
async def get_contest(
    contest_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get contest details.
    """
    contest = await get_contest_safe(contest_id)
    
    # Check if user is registered
    participation = await ContestParticipation.find_one({
        "user_id": current_user["user_id"],
        "contest_id": contest_id
    })
    
    # Block unregistered users from ongoing contests - do NOT auto-register
    if not participation and contest.status == "ongoing":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must register for this contest before it starts. Unregistered users cannot enter."
        )
    
    # Block disqualified users from re-entering
    if participation and getattr(participation, 'is_disqualified', False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You have been disqualified from this contest and cannot rejoin."
        )
    
    # Only show problems if contest has started and user is registered
    now = _utcnow()
    show_problems = (_to_naive_utc(contest.start_time) <= now) and (participation is not None)
    
    # Mark start time on first access during ongoing contest
    if participation and contest.status == "ongoing" and not participation.started_at:
        participation.started_at = _utcnow()
        await participation.save()
    
    response = {
        "id": str(contest.id),
        "title": contest.title,
        "title_ur": getattr(contest, 'title_ur', None),
        "description": contest.description,
        "description_ur": getattr(contest, 'description_ur', None),
        "start_time": _to_naive_utc(contest.start_time).isoformat() + "Z",
        "end_time": _to_naive_utc(contest.end_time).isoformat() + "Z",
        "duration_minutes": contest.duration_minutes,
        "contest_type": contest.contest_type,
        "difficulty": contest.difficulty,
        "status": contest.status,
        "scoring_type": contest.scoring_type,
        "registered_count": contest.registered_count,
        "is_registered": participation is not None,
        "is_disqualified": getattr(participation, 'is_disqualified', False) if participation else False,
        "user_rank": participation.rank if participation else None,
        "total_points": participation.total_points if participation else 0,
        "problems_solved": participation.problems_solved if participation else 0
    }
    
    if show_problems:
        # Fetch from CP_PROBLEMS if inline data is missing
        from app.data.cp_problems import get_problem_by_id
        
        problems_data = []
        for p in contest.problems:
            # If no inline data but has challenge_id, fetch from CP_PROBLEMS
            if not p.title and p.challenge_id:
                cp_problem = get_problem_by_id(p.challenge_id)
                if cp_problem:
                    problems_data.append({
                        "order": chr(65 + p.order),
                        "challenge_id": p.challenge_id,
                        "title": cp_problem['name'],
                        "description": cp_problem['description'],
                        "difficulty": cp_problem['difficulty'],
                        "input_format": cp_problem.get('input_format', ''),
                        "output_format": cp_problem.get('output_format', ''),
                        "examples": cp_problem.get('examples', []),
                        "test_cases": cp_problem.get('test_cases', []),
                        "points": p.points
                    })
                else:
                    # Fallback if problem not found
                    problems_data.append({
                        "order": chr(65 + p.order),
                        "challenge_id": p.challenge_id,
                        "title": f"Problem {chr(65 + p.order)}",
                        "description": "Problem data not found",
                        "difficulty": "medium",
                        "input_format": "",
                        "output_format": "",
                        "examples": [],
                        "test_cases": [],
                        "points": p.points
                    })
            else:
                # Use inline data
                problems_data.append({
                    "order": chr(65 + p.order),
                    "challenge_id": p.challenge_id,
                    "title": p.title or f"Problem {chr(65 + p.order)}",
                    "description": p.description or "",
                    "difficulty": p.difficulty or "medium",
                    "input_format": p.input_format or "",
                    "output_format": p.output_format or "",
                    "examples": p.examples or [],
                    "test_cases": p.test_cases or [],
                    "points": p.points
                })
        
        response["problems"] = problems_data
    
    return response


@router.get("/my-registrations")
async def get_my_registrations(
    current_user: dict = Depends(get_current_user)
):
    """
    Get current user's contest registrations.
    """
    participations = await ContestParticipation.find({
        "user_id": current_user["user_id"]
    }).to_list()
    
    return {
        "registrations": [
            {
                "contest_id": p.contest_id,
                "registered_at": p.registered_at
            }
            for p in participations
        ]
    }


@router.post("/contests/{contest_id}/register")
async def register_for_contest(
    contest_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Register for a contest.
    """
    contest = await get_contest_safe(contest_id)
    
    # Check if already registered
    existing = await ContestParticipation.find_one({
        "user_id": current_user["user_id"],
        "contest_id": contest_id
    })
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already registered"
        )
    
    # Check if registration is open (only allow upcoming)
    if contest.status != "upcoming":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration is only allowed before the contest starts"
        )
    
    # Check max participants
    if contest.max_participants and contest.registered_count >= contest.max_participants:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contest is full"
        )
    
    # Get user for rating
    user = await User.get(current_user["user_id"])
    
    # Create participation
    participation = ContestParticipation(
        user_id=current_user["user_id"],
        contest_id=contest_id,
        old_rating=user.rating
    )
    await participation.insert()
    
    # Update contest count
    contest.registered_count += 1
    await contest.save()
    
    return {"message": "Registered successfully"}


@router.get("/contests/{contest_id}/leaderboard")
async def get_contest_leaderboard(
    contest_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100)
):
    """
    Get contest leaderboard.
    """
    contest = await get_contest_safe(contest_id)
    
    # Get participations sorted by score, excluding disqualified
    skip = (page - 1) * limit
    participations = await ContestParticipation.find(
        {"contest_id": contest_id, "is_disqualified": {"$ne": True}}
    ).sort([
        ("total_points", -1),
        ("total_penalty", 1)
    ]).skip(skip).limit(limit).to_list()
    
    total = await ContestParticipation.find({"contest_id": contest_id, "is_disqualified": {"$ne": True}}).count()
    
    # Get user details
    leaderboard = []
    for i, p in enumerate(participations):
        user = await User.get(p.user_id)
        leaderboard.append({
            "rank": skip + i + 1,
            "user_id": p.user_id,
            "username": user.username if user else "Unknown",
            "total_points": p.total_points,
            "total_penalty": p.total_penalty,
            "problems_solved": p.problems_solved,
            "rating": user.rating if user else 0,
            "rating_change": p.rating_change
        })
    
    return {
        "leaderboard": leaderboard,
        "total": total,
        "page": page,
        "limit": limit
    }


@router.get("/leaderboard")
async def get_global_leaderboard(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100)
):
    """
    Get global rating leaderboard.
    """
    skip = (page - 1) * limit
    users = await User.find(
        {"is_active": True}
    ).sort("-rating").skip(skip).limit(limit).to_list()
    
    total = await User.find({"is_active": True}).count()
    
    return {
        "leaderboard": [
            {
                "rank": skip + i + 1,
                "user_id": str(u.id),
                "username": u.username,
                "full_name": u.full_name,
                "rating": u.rating,
                "max_rating": u.max_rating,
                "level": u.level,
                "country": u.country,
                "institution": u.institution,
                "contests_participated": u.stats.total_contests_participated if u.stats else 0
            }
            for i, u in enumerate(users)
        ],
        "total": total,
        "page": page,
        "limit": limit
    }


@router.get("/user/{user_id}/contests")
async def get_user_contest_history(
    user_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """
    Get user's contest participation history.
    """
    skip = (page - 1) * limit
    participations = await ContestParticipation.find(
        {"user_id": user_id}
    ).sort("-registered_at").skip(skip).limit(limit).to_list()
    
    history = []
    for p in participations:
        try:
            contest = await Contest.get(p.contest_id)
        except Exception:
            continue
        if contest:
            history.append({
                "contest_id": p.contest_id,
                "contest_title": contest.title,
                "rank": p.rank,
                "problems_solved": p.problems_solved,
                "total_points": p.total_points,
                "old_rating": p.old_rating,
                "new_rating": p.new_rating,
                "rating_change": p.rating_change,
                "participated_at": p.started_at or p.registered_at
            })
    
    return {"history": history}


@router.post("/contests")
async def create_contest(
    request: CreateContestRequest,
    current_user: dict = Depends(get_current_admin)
):
    """
    Create a new contest (Admin only).
    """
    # Create problems list
    problems = [
        ContestProblem(
            challenge_id=pid,
            order=i,
            points=100
        )
        for i, pid in enumerate(request.problem_ids)
    ]
    
    # Create slug
    slug = request.title.lower().replace(" ", "-")
    
    # Normalize start_time to naive UTC for consistent storage
    start_time = _to_naive_utc(request.start_time)
    end_time = start_time + timedelta(minutes=request.duration_minutes)
    
    contest = Contest(
        title=request.title,
        title_ur=request.title_ur,
        slug=slug,
        description=request.description,
        description_ur=request.description_ur,
        problems=problems,
        start_time=start_time,
        end_time=end_time,
        duration_minutes=request.duration_minutes,
        contest_type=request.contest_type,
        is_public=request.is_public,
        max_participants=request.max_participants,
        created_by=current_user["user_id"]
    )
    await contest.insert()
    
    return {
        "message": "Contest created",
        "contest_id": str(contest.id)
    }


@router.post("/contests/{contest_id}/disqualify")
async def disqualify_user(
    contest_id: str,
    request: dict = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Disqualify a user from a contest (e.g., for tab switching).
    Can be called by the user themselves (self-report) or by admin.
    """
    contest = await get_contest_safe(contest_id)
    
    # Determine target user
    target_user_id = request.get("user_id", current_user["user_id"])
    reason = request.get("reason", "Tab switch violation")
    
    # Only allow self-disqualification or admin disqualification
    if target_user_id != current_user["user_id"]:
        user = await User.get(current_user["user_id"])
        if not user or user.role != "admin":
            raise HTTPException(status_code=403, detail="Only admins can disqualify other users")
    
    participation = await ContestParticipation.find_one({
        "user_id": target_user_id,
        "contest_id": contest_id
    })
    
    if not participation:
        raise HTTPException(status_code=404, detail="Participation not found")
    
    if getattr(participation, 'is_disqualified', False):
        return {"message": "User already disqualified", "already_disqualified": True}
    
    # Disqualify
    participation.is_disqualified = True
    participation.disqualified_at = _utcnow()
    participation.disqualification_reason = reason
    participation.total_points = 0  # Zero out points
    participation.problems_solved = 0
    participation.finished_at = _utcnow()
    await participation.save()
    
    return {
        "message": "User disqualified",
        "disqualified": True,
        "reason": reason
    }


@router.post("/contests/{contest_id}/submit")
async def submit_contest_solution(
    contest_id: str,
    request: dict = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Submit a solution for a contest problem.
    Executes code against the problem's test cases and updates participation.
    """
    from pydantic import BaseModel
    import subprocess, tempfile, os, time
    
    contest = await get_contest_safe(contest_id)
    
    if contest.status != "ongoing":
        raise HTTPException(status_code=400, detail="Contest is not currently active")
    
    # Verify contest hasn't actually ended (double-check timing)
    now = _utcnow()
    if now >= _to_naive_utc(contest.end_time):
        raise HTTPException(status_code=400, detail="Contest time has expired")
    
    # Check registration
    participation = await ContestParticipation.find_one({
        "user_id": current_user["user_id"],
        "contest_id": contest_id
    })
    if not participation:
        raise HTTPException(status_code=403, detail="You are not registered for this contest")
    
    # Check disqualification
    if getattr(participation, 'is_disqualified', False):
        raise HTTPException(status_code=403, detail="You have been disqualified from this contest")
    
    problem_index = request.get("problem_index", 0)
    code = request.get("code", "")
    language = request.get("language", "python")
    
    # Validate language
    if language not in ("python", "cpp", "javascript"):
        raise HTTPException(status_code=400, detail="Unsupported language. Use python, cpp, or javascript.")
    
    if problem_index < 0 or problem_index >= len(contest.problems):
        raise HTTPException(status_code=400, detail="Invalid problem index")
    
    problem = contest.problems[problem_index]
    test_cases = problem.test_cases or []
    
    # If no test cases in inline data, fetch from CP_PROBLEMS
    if not test_cases and problem.challenge_id:
        from app.data.cp_problems import get_problem_by_id
        cp_problem = get_problem_by_id(problem.challenge_id)
        if cp_problem:
            test_cases = cp_problem.get('test_cases', [])
    
    if not test_cases:
        raise HTTPException(status_code=400, detail="No test cases for this problem")
    
    # Execute code against test cases
    passed = 0
    total = len(test_cases)
    errors = []
    
    for tc in test_cases:
        tc_input = tc.get("input", "") if isinstance(tc, dict) else ""
        tc_output = tc.get("output", "") if isinstance(tc, dict) else ""
        
        try:
            if language == "python":
                with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, encoding='utf-8') as f:
                    f.write(code)
                    code_file = f.name
                try:
                    proc = subprocess.run(
                        ["python", code_file],
                        input=tc_input, capture_output=True, text=True, timeout=10
                    )
                    if proc.returncode == 0 and proc.stdout.strip() == tc_output.strip():
                        passed += 1
                    elif proc.returncode != 0:
                        errors.append(proc.stderr[:200] if proc.stderr else "Runtime error")
                finally:
                    try: os.unlink(code_file)
                    except: pass
                    
            elif language == "cpp":
                with tempfile.NamedTemporaryFile(mode='w', suffix='.cpp', delete=False, encoding='utf-8') as f:
                    f.write(code)
                    code_file = f.name
                exe_file = code_file.replace('.cpp', '.exe' if os.name == 'nt' else '.out')
                try:
                    compile_res = subprocess.run(
                        ["g++", code_file, "-o", exe_file, "-std=c++17", "-O2"],
                        capture_output=True, text=True, timeout=30
                    )
                    if compile_res.returncode != 0:
                        errors.append(f"Compilation error: {compile_res.stderr[:200]}")
                    else:
                        proc = subprocess.run(
                            [exe_file], input=tc_input, capture_output=True, text=True, timeout=10
                        )
                        if proc.returncode == 0 and proc.stdout.strip() == tc_output.strip():
                            passed += 1
                        elif proc.returncode != 0:
                            errors.append(proc.stderr[:200] if proc.stderr else "Runtime error")
                finally:
                    try: os.unlink(code_file)
                    except: pass
                    try: os.unlink(exe_file)
                    except: pass
                    
            elif language == "javascript":
                with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False, encoding='utf-8') as f:
                    # Proper stdin handling for Node.js
                    wrapper = (
                        "const fs = require('fs');\n"
                        "const inputData = fs.readFileSync('/dev/stdin', 'utf8').trim();\n"
                        "const inputLines = inputData.split('\\n');\n"
                        "let lineIndex = 0;\n"
                        "function readLine() { return inputLines[lineIndex++] || ''; }\n"
                        "const readline = { question: (q, cb) => cb(readLine()) };\n"
                    )
                    # On Windows, use a different stdin approach
                    if os.name == 'nt':
                        wrapper = (
                            "const inputData = require('fs').readFileSync(0, 'utf8').trim();\n"
                            "const inputLines = inputData.split('\\n');\n"
                            "let lineIndex = 0;\n"
                            "function readLine() { return inputLines[lineIndex++] || ''; }\n"
                            "const readline = { question: (q, cb) => cb(readLine()) };\n"
                        )
                    f.write(wrapper + code)
                    code_file = f.name
                try:
                    proc = subprocess.run(
                        ["node", code_file],
                        input=tc_input, capture_output=True, text=True, timeout=10
                    )
                    if proc.returncode == 0 and proc.stdout.strip() == tc_output.strip():
                        passed += 1
                    elif proc.returncode != 0:
                        errors.append(proc.stderr[:200] if proc.stderr else "Runtime error")
                finally:
                    try: os.unlink(code_file)
                    except: pass
        except subprocess.TimeoutExpired:
            errors.append("Time limit exceeded")
        except Exception as e:
            errors.append(str(e)[:100])
    
    is_accepted = passed == total and total > 0
    points = problem.points if is_accepted else 0
    
    # Update participation timing
    if not participation.started_at:
        participation.started_at = _utcnow()
    
    # Calculate penalty (minutes from contest start to submission)
    contest_start = _to_naive_utc(contest.start_time)
    submission_time = _utcnow()
    time_from_start = int((submission_time - contest_start).total_seconds() / 60)
    
    # Record submission for this problem
    sub_record = {
        "problem_order": problem_index,
        "language": language,
        "passed": passed,
        "total": total,
        "accepted": is_accepted,
        "points": points,
        "penalty_minutes": time_from_start,
        "submitted_at": submission_time.isoformat() + "Z"
    }
    
    # Check if already solved this problem (don't add duplicate points)
    existing_accepted = next(
        (s for s in participation.problem_submissions 
         if s.get("problem_order") == problem_index and s.get("accepted")),
        None
    )
    
    # Count previous wrong attempts for this problem (for penalty calculation)
    wrong_attempts = sum(
        1 for s in participation.problem_submissions 
        if s.get("problem_order") == problem_index and not s.get("accepted")
    )
    
    # Always record the submission
    participation.problem_submissions.append(sub_record)
    
    if not existing_accepted and is_accepted:
        # First time solving this problem
        participation.total_points += points
        participation.problems_solved += 1
        # Add penalty: time of acceptance + 20 min per wrong attempt
        participation.total_penalty += time_from_start + (wrong_attempts * 20)
    
    await participation.save()
    
    return {
        "passed": is_accepted,
        "passed_tests": passed,
        "total_tests": total,
        "points": points,
        "total_points": participation.total_points,
        "problems_solved": participation.problems_solved,
        "errors": errors[:1] if errors and not is_accepted else [],
        "language": language
    }


@router.post("/contests/{contest_id}/finalize")
async def finalize_contest(
    contest_id: str,
    current_user: dict = Depends(get_current_admin)
):
    """
    Finalize contest and calculate ratings (Admin only).
    """
    contest = await get_contest_safe(contest_id)
    
    if contest.is_results_published:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Results already published"
        )
    
    # Get all participations, exclude disqualified users from ranking
    all_participations = await ContestParticipation.find(
        {"contest_id": contest_id}
    ).to_list()
    
    if not all_participations:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No participants"
        )
    
    # Separate qualified and disqualified
    qualified = [p for p in all_participations if not getattr(p, 'is_disqualified', False)]
    disqualified = [p for p in all_participations if getattr(p, 'is_disqualified', False)]
    
    # Sort qualified by points (desc) then penalty (asc)
    qualified.sort(key=lambda p: (-p.total_points, p.total_penalty))
    
    # Calculate average rating of qualified participants
    total_rating = sum(p.old_rating or 1000 for p in qualified)
    avg_rating = total_rating // max(len(qualified), 1)
    
    # Process qualified participants
    for rank, p in enumerate(qualified, 1):
        p.rank = rank
        
        participant_user = await User.get(p.user_id)
        if not participant_user:
            await p.save()
            continue
        
        # Award XP and coins based on position
        if rank == 1:
            xp_award = 150
            coins_award = 75
        elif rank == 2:
            xp_award = 100
            coins_award = 50
        elif rank == 3:
            xp_award = 75
            coins_award = 35
        elif rank <= 10:
            xp_award = 40
            coins_award = 20
        else:
            xp_award = 15  # Participation XP
            coins_award = 10
        
        # Apply XP and coins
        participant_user.add_xp(xp_award)
        participant_user.add_coins(coins_award)
        participant_user.stats.total_contests_participated += 1
        if rank == 1:
            participant_user.stats.total_contests_won += 1
        
        if contest.contest_type == "rated":
            rating_change = calculate_contest_rating_change(
                p.old_rating or 1000,
                rank,
                len(qualified),
                avg_rating
            )
            p.rating_change = rating_change
            p.new_rating = (p.old_rating or 1000) + rating_change
            
            participant_user.rating = max(0, p.new_rating)  # Don't go below 0
            participant_user.max_rating = max(participant_user.max_rating, participant_user.rating)
        
        participant_user.updated_at = _utcnow()
        await participant_user.save()
        
        # Sync UserRewards
        try:
            rewards = await UserRewards.find_one({"user_id": p.user_id})
            if not rewards:
                rewards = UserRewards(user_id=p.user_id)
                await rewards.insert()
            rewards.total_xp_earned += xp_award
            rewards.add_coins(coins_award, "contest", f"Contest rank #{rank} - {contest.title}")
            await rewards.save()
        except Exception as e:
            print(f"Failed to sync rewards for user {p.user_id}: {e}")
        
        await p.save()
    
    # Process disqualified - give rank None, 0 points, mark participated
    for p in disqualified:
        p.rank = None
        p.total_points = 0
        p.problems_solved = 0
        participant_user = await User.get(p.user_id)
        if participant_user:
            participant_user.stats.total_contests_participated += 1
            participant_user.updated_at = _utcnow()
            await participant_user.save()
        await p.save()
    
    # Update contest status
    contest.status = "completed"
    contest.is_results_published = True
    await contest.save()
    
    return {
        "message": "Contest finalized",
        "participants": len(qualified),
        "disqualified": len(disqualified)
    }


@router.delete("/contests/{contest_id}")
async def delete_contest(
    contest_id: str,
    current_user: dict = Depends(get_current_admin)
):
    """
    Delete a contest (Admin only). Cannot delete ongoing contests.
    """
    contest = await get_contest_safe(contest_id)
    
    if contest.status == "ongoing":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete an ongoing contest. Wait for it to finish first."
        )
    
    # Delete all participations for this contest
    await ContestParticipation.find({"contest_id": contest_id}).delete()
    
    # Delete the contest
    await contest.delete()
    
    return {"message": "Contest deleted successfully"}
