"""
Competitive Programming API Routes
==================================
Contests, leaderboards, and ratings.
"""

from datetime import datetime, timedelta
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
    now = datetime.utcnow()
    new_status = None
    if contest.status == "upcoming" and now >= contest.start_time:
        new_status = "ongoing" if now < contest.end_time else "completed"
    elif contest.status == "ongoing" and now >= contest.end_time:
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
    now = datetime.utcnow()
    await Contest.find({"status": "upcoming", "start_time": {"$lte": now}, "end_time": {"$gt": now}}).update_many({"$set": {"status": "ongoing", "updated_at": now}})
    await Contest.find({"status": {"$in": ["upcoming", "ongoing"]}, "end_time": {"$lte": now}}).update_many({"$set": {"status": "completed", "updated_at": now}})
    
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
                "start_time": c.start_time,
                "end_time": c.end_time,
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
    
    # Auto-register user for ongoing contests if not registered
    if not participation and contest.status == "ongoing":
        user = await User.get(current_user["user_id"])
        participation = ContestParticipation(
            user_id=current_user["user_id"],
            contest_id=contest_id,
            old_rating=user.rating if user else 1000
        )
        await participation.insert()
        contest.registered_count += 1
        await contest.save()
    
    # Only show problems if contest has started or user is registered
    now = datetime.utcnow()
    show_problems = contest.start_time <= now or participation is not None
    
    response = {
        "id": str(contest.id),
        "title": contest.title,
        "title_ur": getattr(contest, 'title_ur', None),
        "description": contest.description,
        "description_ur": getattr(contest, 'description_ur', None),
        "start_time": contest.start_time,
        "end_time": contest.end_time,
        "duration_minutes": contest.duration_minutes,
        "contest_type": contest.contest_type,
        "difficulty": contest.difficulty,
        "status": contest.status,
        "scoring_type": contest.scoring_type,
        "registered_count": contest.registered_count,
        "is_registered": participation is not None,
        "user_rank": participation.rank if participation else None
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
    
    # Check if registration is open (allow upcoming and ongoing)
    if contest.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contest has ended"
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
    
    # Get participations sorted by score
    skip = (page - 1) * limit
    participations = await ContestParticipation.find(
        {"contest_id": contest_id}
    ).sort([
        ("total_points", -1),
        ("total_penalty", 1)
    ]).skip(skip).limit(limit).to_list()
    
    total = await ContestParticipation.find({"contest_id": contest_id}).count()
    
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
    
    contest = Contest(
        title=request.title,
        title_ur=request.title_ur,
        slug=slug,
        description=request.description,
        description_ur=request.description_ur,
        problems=problems,
        start_time=request.start_time,
        end_time=request.start_time + timedelta(minutes=request.duration_minutes),
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
    
    # Check registration
    participation = await ContestParticipation.find_one({
        "user_id": current_user["user_id"],
        "contest_id": contest_id
    })
    if not participation:
        raise HTTPException(status_code=400, detail="You are not registered for this contest")
    
    problem_index = request.get("problem_index", 0)
    code = request.get("code", "")
    language = request.get("language", "python")
    
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
    
    for tc in test_cases:
        tc_input = tc.get("input", "") if isinstance(tc, dict) else ""
        tc_output = tc.get("output", "") if isinstance(tc, dict) else ""
        
        try:
            if language == "python":
                with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
                    f.write(code)
                    code_file = f.name
                try:
                    proc = subprocess.run(
                        ["python", code_file],
                        input=tc_input, capture_output=True, text=True, timeout=5
                    )
                    if proc.returncode == 0 and proc.stdout.strip() == tc_output.strip():
                        passed += 1
                finally:
                    os.unlink(code_file)
            elif language == "cpp":
                with tempfile.NamedTemporaryFile(mode='w', suffix='.cpp', delete=False) as f:
                    f.write(code)
                    code_file = f.name
                exe_file = code_file.replace('.cpp', '.exe' if os.name == 'nt' else '')
                try:
                    compile_res = subprocess.run(
                        ["g++", code_file, "-o", exe_file, "-std=c++14"],
                        capture_output=True, text=True, timeout=30
                    )
                    if compile_res.returncode == 0:
                        proc = subprocess.run(
                            [exe_file], input=tc_input, capture_output=True, text=True, timeout=5
                        )
                        if proc.returncode == 0 and proc.stdout.strip() == tc_output.strip():
                            passed += 1
                finally:
                    try: os.unlink(code_file)
                    except: pass
                    try: os.unlink(exe_file)
                    except: pass
            elif language == "javascript":
                with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
                    escaped = tc_input.replace('`', '\\`')
                    wrapped = f"const input = `{escaped}`.trim().split('\\n'); let idx=0; const readLine=()=>input[idx++]||'';\n{code}"
                    f.write(wrapped)
                    code_file = f.name
                try:
                    proc = subprocess.run(
                        ["node", code_file],
                        capture_output=True, text=True, timeout=5
                    )
                    if proc.returncode == 0 and proc.stdout.strip() == tc_output.strip():
                        passed += 1
                finally:
                    os.unlink(code_file)
        except Exception:
            pass
    
    is_accepted = passed == total and total > 0
    points = problem.points if is_accepted else 0
    
    # Update participation
    if not participation.started_at:
        participation.started_at = datetime.utcnow()
    
    # Record submission for this problem
    sub_record = {
        "problem_order": problem_index,
        "passed": passed,
        "total": total,
        "accepted": is_accepted,
        "points": points,
        "submitted_at": datetime.utcnow().isoformat()
    }
    
    # Check if already solved this problem (don't add duplicate points)
    existing_sub = next(
        (s for s in participation.problem_submissions if s.get("problem_order") == problem_index and s.get("accepted")),
        None
    )
    
    if not existing_sub:
        participation.problem_submissions.append(sub_record)
        if is_accepted:
            participation.total_points += points
            participation.problems_solved += 1
    else:
        # Already accepted, just record the submission
        participation.problem_submissions.append(sub_record)
    
    await participation.save()
    
    return {
        "passed": is_accepted,
        "passed_tests": passed,
        "total_tests": total,
        "points": points,
        "total_points": participation.total_points,
        "problems_solved": participation.problems_solved
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
    
    # Get all participations
    participations = await ContestParticipation.find(
        {"contest_id": contest_id}
    ).sort([
        ("total_points", -1),
        ("total_penalty", 1)
    ]).to_list()
    
    if not participations:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No participants"
        )
    
    # Calculate average rating
    total_rating = sum(p.old_rating or 1000 for p in participations)
    avg_rating = total_rating // len(participations)
    
    # Calculate and apply rating changes + XP by position
    for rank, p in enumerate(participations, 1):
        p.rank = rank
        
        participant_user = await User.get(p.user_id)
        if not participant_user:
            await p.save()
            continue
        
        # Award XP based on position
        if rank == 1:
            xp_award = 100
            coins_award = 50
        elif rank == 2:
            xp_award = 75
            coins_award = 35
        elif rank == 3:
            xp_award = 50
            coins_award = 25
        elif rank <= 10:
            xp_award = 30
            coins_award = 15
        else:
            xp_award = 10  # Participation XP
            coins_award = 5
        
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
                len(participations),
                avg_rating
            )
            p.rating_change = rating_change
            p.new_rating = (p.old_rating or 1000) + rating_change
            
            participant_user.rating = p.new_rating
            participant_user.max_rating = max(participant_user.max_rating, p.new_rating)
        
        participant_user.updated_at = datetime.utcnow()
        await participant_user.save()
        
        # Sync UserRewards
        try:
            rewards = await UserRewards.find_one({"user_id": p.user_id})
            if not rewards:
                rewards = UserRewards(user_id=p.user_id)
                await rewards.insert()
            rewards.total_xp_earned += xp_award
            rewards.add_coins(coins_award, "contest", f"Contest #{rank} - {contest.title}")
            await rewards.save()
        except Exception as e:
            print(f"Failed to sync rewards for user {p.user_id}: {e}")
        
        await p.save()
    
    # Update contest status
    contest.status = "completed"
    contest.is_results_published = True
    await contest.save()
    
    return {"message": "Contest finalized", "participants": len(participations)}


@router.delete("/contests/{contest_id}")
async def delete_contest(
    contest_id: str,
    current_user: dict = Depends(get_current_admin)
):
    """
    Delete a contest (Admin only).
    """
    contest = await get_contest_safe(contest_id)
    
    # Delete all participations for this contest
    await ContestParticipation.find({"contest_id": contest_id}).delete()
    
    # Delete the contest
    await contest.delete()
    
    return {"message": "Contest deleted successfully"}
