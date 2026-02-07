"""
Lessons API Routes
=================
Lesson content, progress tracking, and course management.
"""

from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, status, Depends, Query
from pydantic import BaseModel

from app.core.security import get_current_user
from app.models.lesson import Lesson, LessonProgress
from app.models.user import User

router = APIRouter()


# ============ Schemas ============

class LessonSummary(BaseModel):
    """Lesson summary for listing."""
    id: str
    title: str
    title_ur: Optional[str]
    slug: str
    description: str
    course_id: str
    module_id: str
    difficulty: str
    estimated_minutes: int
    xp_reward: int
    coin_reward: int
    has_mcq: bool
    has_challenge: bool


class LessonDetail(BaseModel):
    """Full lesson detail."""
    id: str
    title: str
    title_ur: Optional[str]
    description: str
    description_ur: Optional[str]
    content_blocks: List[dict]
    examples: List[dict]
    difficulty: str
    estimated_minutes: int
    prerequisites: List[str]
    xp_reward: int
    coin_reward: int


class ProgressUpdate(BaseModel):
    """Progress update request."""
    progress_percentage: int
    time_spent_seconds: int


# ============ Routes ============

@router.get("/courses")
async def get_courses():
    """
    Get all available courses.
    """
    return {
        "courses": [
            {
                "id": "programming-fundamentals",
                "name": "Programming Fundamentals",
                "name_ur": "پروگرامنگ کے بنیادی اصول",
                "description": "Master the basics of programming with variables, loops, conditions, and functions",
                "description_ur": "ویری ایبلز، لوپس، کنڈیشنز اور فنکشنز کے ساتھ پروگرامنگ کی بنیادی باتیں سیکھیں",
                "total_lessons": 24,
                "difficulty": "beginner",
                "icon": "💻",
                "color": "from-blue-500 to-cyan-500"
            },
            {
                "id": "oop",
                "name": "Object-Oriented Programming",
                "name_ur": "آبجیکٹ اورینٹڈ پروگرامنگ",
                "description": "Learn classes, objects, inheritance, polymorphism and encapsulation",
                "description_ur": "کلاسز، آبجیکٹس، وراثت، پولی مورفزم اور انکیپسولیشن سیکھیں",
                "total_lessons": 18,
                "difficulty": "intermediate",
                "icon": "🧩",
                "color": "from-purple-500 to-pink-500"
            },
            {
                "id": "data-structures",
                "name": "Data Structures & Algorithms",
                "name_ur": "ڈیٹا سٹرکچرز اور الگورتھمز",
                "description": "Understand arrays, linked lists, trees, graphs, sorting and searching",
                "description_ur": "ارے، لنکڈ لسٹس، ٹریز، گرافس، ترتیب اور تلاش کو سمجھیں",
                "total_lessons": 22,
                "difficulty": "intermediate",
                "icon": "🌳",
                "color": "from-green-500 to-emerald-500"
            },
            {
                "id": "competitive-programming",
                "name": "Competitive Programming",
                "name_ur": "مسابقتی پروگرامنگ",
                "description": "Advanced algorithms and problem-solving techniques for contests",
                "description_ur": "مقابلوں کے لیے ایڈوانسڈ الگورتھمز اور مسئلہ حل کرنے کی تکنیکیں",
                "total_lessons": 30,
                "difficulty": "advanced",
                "icon": "🏆",
                "color": "from-yellow-500 to-orange-500"
            }
        ]
    }


@router.get("/courses/{course_id}/modules")
async def get_course_modules(course_id: str):
    """
    Get modules for a specific course.
    """
    modules = {
        "programming-fundamentals": [
            {"id": "intro", "name": "Introduction to Programming", "name_ur": "پروگرامنگ کا تعارف", "order": 1},
            {"id": "variables", "name": "Variables & Data Types", "name_ur": "متغیرات اور ڈیٹا کی اقسام", "order": 2},
            {"id": "operators", "name": "Operators", "name_ur": "آپریٹرز", "order": 3},
            {"id": "conditionals", "name": "Conditional Statements", "name_ur": "شرطی بیانات", "order": 4},
            {"id": "loops", "name": "Loops", "name_ur": "لوپس", "order": 5},
            {"id": "functions", "name": "Functions", "name_ur": "فنکشنز", "order": 6},
            {"id": "arrays", "name": "Arrays & Lists", "name_ur": "ارے اور فہرستیں", "order": 7},
            {"id": "strings", "name": "String Operations", "name_ur": "سٹرنگ آپریشنز", "order": 8},
        ],
        "oop": [
            {"id": "intro_oop", "name": "Introduction to OOP", "name_ur": "OOP کا تعارف", "order": 1},
            {"id": "classes", "name": "Classes & Objects", "name_ur": "کلاسز اور آبجیکٹس", "order": 2},
            {"id": "constructors", "name": "Constructors & Destructors", "name_ur": "کنسٹرکٹرز اور ڈیسٹرکٹرز", "order": 3},
            {"id": "inheritance", "name": "Inheritance", "name_ur": "وراثت", "order": 4},
            {"id": "polymorphism", "name": "Polymorphism", "name_ur": "پولی مورفزم", "order": 5},
            {"id": "encapsulation", "name": "Encapsulation", "name_ur": "انکیپسولیشن", "order": 6},
            {"id": "abstraction", "name": "Abstraction", "name_ur": "تجرید", "order": 7},
            {"id": "interfaces", "name": "Interfaces", "name_ur": "انٹرفیسز", "order": 8},
        ],
        "data-structures": [
            {"id": "arrays_advanced", "name": "Arrays & Strings", "name_ur": "ارے اور سٹرنگز", "order": 1},
            {"id": "linked_lists", "name": "Linked Lists", "name_ur": "لنکڈ لسٹس", "order": 2},
            {"id": "stacks", "name": "Stacks", "name_ur": "سٹیکس", "order": 3},
            {"id": "queues", "name": "Queues", "name_ur": "کیوز", "order": 4},
            {"id": "trees", "name": "Trees", "name_ur": "ٹریز", "order": 5},
            {"id": "graphs", "name": "Graphs", "name_ur": "گرافس", "order": 6},
            {"id": "hashing", "name": "Hash Tables", "name_ur": "ہیش ٹیبلز", "order": 7},
            {"id": "sorting", "name": "Sorting Algorithms", "name_ur": "ترتیب کے الگورتھمز", "order": 8},
            {"id": "searching", "name": "Searching Algorithms", "name_ur": "تلاش کے الگورتھمز", "order": 9},
        ],
        "competitive-programming": [
            {"id": "cp_intro", "name": "Introduction to CP", "name_ur": "CP کا تعارف", "order": 1},
            {"id": "time_complexity", "name": "Time & Space Complexity", "name_ur": "وقت اور جگہ کی پیچیدگی", "order": 2},
            {"id": "binary_search", "name": "Binary Search", "name_ur": "بائنری سرچ", "order": 3},
            {"id": "two_pointers", "name": "Two Pointers", "name_ur": "دو پوائنٹرز", "order": 4},
            {"id": "dp_basics", "name": "Dynamic Programming Basics", "name_ur": "ڈائنامک پروگرامنگ کی بنیاد", "order": 5},
            {"id": "greedy", "name": "Greedy Algorithms", "name_ur": "گریڈی الگورتھمز", "order": 6},
            {"id": "graph_algorithms", "name": "Graph Algorithms", "name_ur": "گراف الگورتھمز", "order": 7},
            {"id": "number_theory", "name": "Number Theory", "name_ur": "نمبر تھیوری", "order": 8},
            {"id": "bit_manipulation", "name": "Bit Manipulation", "name_ur": "بٹ مینیپولیشن", "order": 9},
        ]
    }
    
    if course_id not in modules:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    return {"modules": modules[course_id]}


@router.get("/")
async def get_lessons(
    course_id: Optional[str] = None,
    module_id: Optional[str] = None,
    language: Optional[str] = None,
    difficulty: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """
    Get list of lessons with optional filtering.
    """
    query = {"is_published": True}
    
    if course_id:
        query["course_id"] = course_id
    if module_id:
        query["module_id"] = module_id
    if language:
        query["programming_language"] = language
    if difficulty:
        query["difficulty"] = difficulty
    
    skip = (page - 1) * limit
    
    lessons = await Lesson.find(query).skip(skip).limit(limit).to_list()
    total = await Lesson.find(query).count()
    
    return {
        "lessons": [
            {
                "id": str(lesson.id),
                "title": lesson.title,
                "title_ur": lesson.title_ur,
                "slug": lesson.slug,
                "description": lesson.description,
                "course_id": lesson.course_id,
                "module_id": lesson.module_id,
                "difficulty": lesson.difficulty,
                "estimated_minutes": lesson.estimated_minutes,
                "xp_reward": lesson.xp_reward,
                "coin_reward": lesson.coin_reward,
                "has_mcq": lesson.has_mcq,
                "has_challenge": lesson.has_challenge
            }
            for lesson in lessons
        ],
        "total": total,
        "page": page,
        "limit": limit
    }


@router.get("/{lesson_slug}")
async def get_lesson(lesson_slug: str, current_user: dict = Depends(get_current_user)):
    """
    Get full lesson content by slug.
    """
    lesson = await Lesson.find_one(Lesson.slug == lesson_slug)
    
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    # Get user's progress for this lesson
    progress = await LessonProgress.find_one({
        "user_id": current_user["user_id"],
        "lesson_id": str(lesson.id)
    })
    
    return {
        "lesson": {
            "id": str(lesson.id),
            "title": lesson.title,
            "title_ur": lesson.title_ur,
            "slug": lesson.slug,
            "description": lesson.description,
            "description_ur": lesson.description_ur,
            "content_blocks": [block.dict() for block in lesson.content_blocks],
            "examples": [example.dict() for example in lesson.examples],
            "difficulty": lesson.difficulty,
            "estimated_minutes": lesson.estimated_minutes,
            "prerequisites": lesson.prerequisites,
            "has_mcq": lesson.has_mcq,
            "has_challenge": lesson.has_challenge,
            "challenge_id": lesson.challenge_id,
            "xp_reward": lesson.xp_reward,
            "coin_reward": lesson.coin_reward
        },
        "progress": progress.dict() if progress else None
    }


@router.post("/{lesson_slug}/start")
async def start_lesson(lesson_slug: str, current_user: dict = Depends(get_current_user)):
    """
    Mark a lesson as started and initialize progress.
    """
    lesson = await Lesson.find_one(Lesson.slug == lesson_slug)
    
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    # Check if progress already exists
    progress = await LessonProgress.find_one({
        "user_id": current_user["user_id"],
        "lesson_id": str(lesson.id)
    })
    
    if progress:
        progress.last_accessed_at = datetime.utcnow()
        await progress.save()
    else:
        progress = LessonProgress(
            user_id=current_user["user_id"],
            lesson_id=str(lesson.id),
            status="in_progress",
            started_at=datetime.utcnow()
        )
        await progress.insert()
    
    return {"message": "Lesson started", "progress": progress.dict()}


@router.put("/{lesson_slug}/progress")
async def update_lesson_progress(
    lesson_slug: str,
    request: ProgressUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update progress for a lesson.
    """
    lesson = await Lesson.find_one(Lesson.slug == lesson_slug)
    
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    progress = await LessonProgress.find_one({
        "user_id": current_user["user_id"],
        "lesson_id": str(lesson.id)
    })
    
    if not progress:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lesson not started"
        )
    
    progress.progress_percentage = min(request.progress_percentage, 100)
    progress.time_spent_seconds += request.time_spent_seconds
    progress.last_accessed_at = datetime.utcnow()
    
    await progress.save()
    
    return {"message": "Progress updated", "progress": progress.dict()}


@router.post("/{lesson_slug}/complete")
async def complete_lesson(lesson_slug: str, current_user: dict = Depends(get_current_user)):
    """
    Mark a lesson as completed and award rewards.
    """
    lesson = await Lesson.find_one(Lesson.slug == lesson_slug)
    
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    progress = await LessonProgress.find_one({
        "user_id": current_user["user_id"],
        "lesson_id": str(lesson.id)
    })
    
    if not progress:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lesson not started"
        )
    
    # Check if already completed
    if progress.rewards_claimed:
        return {"message": "Lesson already completed", "rewards": None}
    
    # Update progress
    progress.status = "completed"
    progress.progress_percentage = 100
    progress.completed_at = datetime.utcnow()
    
    # Award rewards
    user = await User.get(current_user["user_id"])
    
    # Get or create user rewards
    from app.models.gamification import UserRewards
    rewards = await UserRewards.find_one({"user_id": current_user["user_id"]})
    if not rewards:
        rewards = UserRewards(user_id=current_user["user_id"])
        await rewards.insert()
    
    xp_earned = lesson.xp_reward
    coins_earned = lesson.coin_reward
    
    # Apply streak bonus
    if user.stats.current_streak >= 7:
        xp_earned = int(xp_earned * 1.5)
        coins_earned = int(coins_earned * 1.5)
    
    # Update user XP and level
    leveled_up = user.add_xp(xp_earned)
    user.add_coins(coins_earned)
    user.stats.total_lessons_completed += 1
    user.update_streak()
    
    # Update UserRewards to keep in sync
    rewards.total_xp_earned += xp_earned
    rewards.add_coins(coins_earned, "lesson", f"Completed lesson: {lesson.title}")
    rewards.current_streak = user.stats.current_streak
    rewards.longest_streak = user.stats.longest_streak
    rewards.last_streak_date = user.stats.last_activity_date
    
    # Save both user and rewards
    await user.save()
    await rewards.save()
    
    progress.xp_earned = xp_earned
    progress.coins_earned = coins_earned
    progress.rewards_claimed = True
    progress.completed_at = datetime.utcnow()
    await progress.save()
    
    return {
        "message": "Lesson completed!",
        "rewards": {
            "xp": xp_earned,
            "coins": coins_earned,
            "leveled_up": leveled_up,
            "new_level": user.level if leveled_up else None
        }
    }


@router.get("/user/progress")
async def get_user_progress(
    current_user: dict = Depends(get_current_user),
    course_id: Optional[str] = None
):
    """
    Get user's overall learning progress.
    """
    # Get all user's progress
    progress_query = {"user_id": current_user["user_id"]}
    
    all_progress = await LessonProgress.find(progress_query).to_list()
    
    # Calculate stats
    completed_lessons = [p for p in all_progress if p.status == "completed"]
    in_progress_lessons = [p for p in all_progress if p.status == "in_progress"]
    
    total_time = sum(p.time_spent_seconds for p in all_progress)
    
    return {
        "total_lessons_started": len(all_progress),
        "completed_lessons": len(completed_lessons),
        "in_progress_lessons": len(in_progress_lessons),
        "total_time_spent_minutes": total_time // 60,
        "recent_lessons": [
            {
                "lesson_id": p.lesson_id,
                "status": p.status,
                "progress_percentage": p.progress_percentage,
                "last_accessed_at": p.last_accessed_at
            }
            for p in sorted(all_progress, key=lambda x: x.last_accessed_at, reverse=True)[:5]
        ]
    }


@router.get("/user/module-progress")
async def get_module_progress(
    current_user: dict = Depends(get_current_user)
):
    """
    Get user's progress broken down by module/course.
    Returns completion percentage for each module.
    Includes both lesson completions AND solved coding problems.
    """
    from app.models.submission import UserProblemStatus
    from app.data.module_problems import get_coding_problems_by_module
    
    module_ids = [
        "programming-fundamentals",
        "oop",
        "data-structures",
        "competitive-programming"
    ]
    
    result = {}
    
    for module_id in module_ids:
        # Count total lessons in this module
        total_lessons = await Lesson.find(
            {"course_id": module_id, "is_published": True}
        ).count()
        
        # Count total coding problems for this module
        coding_problems = get_coding_problems_by_module(module_id)
        total_coding = len(coding_problems)
        
        # Total items = lessons + coding problems
        total_items = total_lessons + total_coding
        
        if total_items == 0:
            result[module_id] = {"total": 0, "completed": 0, "progress": 0}
            continue
        
        # Count completed lessons
        lessons = await Lesson.find(
            {"course_id": module_id, "is_published": True}
        ).to_list()
        lesson_ids = [str(l.id) for l in lessons]
        
        completed_lessons = await LessonProgress.find({
            "user_id": current_user["user_id"],
            "lesson_id": {"$in": lesson_ids},
            "status": "completed"
        }).count()
        
        # Count solved coding problems for this module
        coding_problem_ids = [p["id"] for p in coding_problems]
        completed_coding = await UserProblemStatus.find({
            "user_id": current_user["user_id"],
            "problem_id": {"$in": coding_problem_ids},
            "is_solved": True
        }).count()
        
        total_completed = completed_lessons + completed_coding
        progress_pct = round((total_completed / total_items) * 100) if total_items > 0 else 0
        
        result[module_id] = {
            "total": total_items,
            "completed": total_completed,
            "progress": progress_pct
        }
    
    return {"module_progress": result}
