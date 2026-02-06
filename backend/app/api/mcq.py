"""
MCQ API Routes
=============
RAG-based MCQ generation and quiz management.
"""

from datetime import datetime
from typing import Optional, List
import random
from fastapi import APIRouter, HTTPException, status, Depends, Query
from pydantic import BaseModel
import aiohttp
import json

from app.core.config import settings
from app.core.security import get_current_user
from app.models.mcq import MCQQuestion, MCQAttempt, MCQOption
from app.models.user import User

router = APIRouter()


# ============ Schemas ============

class AnswerSubmission(BaseModel):
    """Single answer submission."""
    question_id: str
    selected_option: str  # a, b, c, d


class QuizStartRequest(BaseModel):
    """Request to start a quiz."""
    lesson_id: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    num_questions: int = 5
    time_limit_seconds: Optional[int] = None


class QuizSubmitRequest(BaseModel):
    """Request to submit quiz answers."""
    attempt_id: str
    answers: List[AnswerSubmission]


class GenerateMCQRequest(BaseModel):
    """Request to generate MCQs using RAG."""
    topic: str
    programming_language: str = "python"
    difficulty: str = "medium"
    num_questions: int = 5
    generate_urdu: bool = True


# ============ RAG MCQ Generation ============

async def generate_mcqs_with_gemini(
    topic: str,
    programming_language: str,
    difficulty: str,
    num_questions: int,
    generate_urdu: bool = True
) -> List[dict]:
    """
    Generate MCQs using Google Gemini with RAG approach.
    """
    import google.generativeai as genai
    
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-pro')
    
    urdu_instruction = """
Also provide Urdu translations for:
- question_ur: Urdu translation of the question
- options with text_ur for each option
- explanation_ur: Urdu translation of the explanation
""" if generate_urdu else ""
    
    prompt = f"""Generate {num_questions} multiple choice questions about "{topic}" in {programming_language}.
Difficulty level: {difficulty}

Each question should test understanding of the concept, not just memorization.
Include practical scenarios and code snippets where relevant.

{urdu_instruction}

Return as a JSON array with this exact structure:
[
  {{
    "question": "Question text here",
    "question_ur": "اردو میں سوال",
    "options": [
      {{"id": "a", "text": "Option A", "text_ur": "آپشن اے", "is_correct": false}},
      {{"id": "b", "text": "Option B", "text_ur": "آپشن بی", "is_correct": true}},
      {{"id": "c", "text": "Option C", "text_ur": "آپشن سی", "is_correct": false}},
      {{"id": "d", "text": "Option D", "text_ur": "آپشن ڈی", "is_correct": false}}
    ],
    "correct_option": "b",
    "explanation": "Explanation of why B is correct",
    "explanation_ur": "وضاحت کہ B کیوں درست ہے",
    "difficulty": "{difficulty}"
  }}
]

Return ONLY the JSON array, no other text."""

    try:
        response = model.generate_content(prompt)
        
        # Parse the JSON response
        response_text = response.text.strip()
        
        # Clean up response if needed
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        questions = json.loads(response_text)
        
        return questions
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate MCQs: {str(e)}"
        )


# ============ Routes ============

@router.post("/generate")
async def generate_mcqs(
    request: GenerateMCQRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate new MCQ questions using RAG (Admin/Instructor only).
    """
    # Check if user is admin or instructor
    user = await User.get(current_user["user_id"])
    if user.role not in ["admin", "instructor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and instructors can generate questions"
        )
    
    # Generate questions
    questions_data = await generate_mcqs_with_gemini(
        topic=request.topic,
        programming_language=request.programming_language,
        difficulty=request.difficulty,
        num_questions=request.num_questions,
        generate_urdu=request.generate_urdu
    )
    
    # Save to database
    saved_questions = []
    for q_data in questions_data:
        options = [
            MCQOption(
                id=opt["id"],
                text=opt["text"],
                text_ur=opt.get("text_ur"),
                is_correct=opt.get("is_correct", False)
            )
            for opt in q_data["options"]
        ]
        
        question = MCQQuestion(
            question=q_data["question"],
            question_ur=q_data.get("question_ur"),
            options=options,
            correct_option=q_data["correct_option"],
            explanation=q_data["explanation"],
            explanation_ur=q_data.get("explanation_ur"),
            topic=request.topic,
            programming_language=request.programming_language,
            difficulty=request.difficulty,
            is_generated=True,
            generation_date=datetime.utcnow()
        )
        await question.insert()
        saved_questions.append(str(question.id))
    
    return {
        "message": f"Generated {len(saved_questions)} questions",
        "question_ids": saved_questions
    }


@router.post("/quiz/start")
async def start_quiz(
    request: QuizStartRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Start a new MCQ quiz.
    """
    # Build query
    query = {"is_active": True}
    
    if request.lesson_id:
        query["lesson_id"] = request.lesson_id
    if request.topic:
        query["topic"] = request.topic
    if request.difficulty:
        query["difficulty"] = request.difficulty
    
    # Get questions
    all_questions = await MCQQuestion.find(query).to_list()
    
    if len(all_questions) < request.num_questions:
        # If not enough questions with filter, get any available
        all_questions = await MCQQuestion.find({"is_active": True}).to_list()
    
    if len(all_questions) == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No questions available"
        )
    
    # Select random questions
    selected_questions = random.sample(
        all_questions, 
        min(request.num_questions, len(all_questions))
    )
    
    # Create attempt record
    attempt = MCQAttempt(
        user_id=current_user["user_id"],
        lesson_id=request.lesson_id,
        quiz_type="lesson" if request.lesson_id else "practice",
        questions=[str(q.id) for q in selected_questions],
        total_questions=len(selected_questions),
        time_limit_seconds=request.time_limit_seconds,
        status="in_progress"
    )
    await attempt.insert()
    
    # Return questions (without correct answers)
    return {
        "attempt_id": str(attempt.id),
        "total_questions": len(selected_questions),
        "time_limit_seconds": request.time_limit_seconds,
        "questions": [
            {
                "id": str(q.id),
                "question": q.question,
                "question_ur": q.question_ur,
                "options": [
                    {
                        "id": opt.id,
                        "text": opt.text,
                        "text_ur": opt.text_ur
                    }
                    for opt in q.options
                ],
                "difficulty": q.difficulty,
                "points": q.points
            }
            for q in selected_questions
        ]
    }


@router.post("/quiz/submit")
async def submit_quiz(
    request: QuizSubmitRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Submit quiz answers and get results.
    """
    # Get attempt
    attempt = await MCQAttempt.get(request.attempt_id)
    
    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz attempt not found"
        )
    
    if attempt.user_id != current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    if attempt.status != "in_progress":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quiz already submitted"
        )
    
    # Check time limit
    time_taken = (datetime.utcnow() - attempt.started_at).total_seconds()
    if attempt.time_limit_seconds and time_taken > attempt.time_limit_seconds + 30:  # 30s grace period
        attempt.status = "timed_out"
        await attempt.save()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Time limit exceeded"
        )
    
    # Process answers
    answers_dict = {a.question_id: a.selected_option for a in request.answers}
    correct_count = 0
    total_points = 0
    results = []
    
    for question_id in attempt.questions:
        question = await MCQQuestion.get(question_id)
        if not question:
            continue
        
        selected = answers_dict.get(question_id)
        is_correct = selected == question.correct_option
        
        if is_correct:
            correct_count += 1
            total_points += question.points
        
        # Update question stats
        question.times_shown += 1
        if is_correct:
            question.times_correct += 1
        await question.save()
        
        results.append({
            "question_id": question_id,
            "selected_option": selected,
            "correct_option": question.correct_option,
            "is_correct": is_correct,
            "explanation": question.explanation,
            "explanation_ur": question.explanation_ur,
            "points": question.points if is_correct else 0
        })
        
        attempt.answers.append({
            "question_id": question_id,
            "selected_option": selected,
            "is_correct": is_correct,
            "time_taken_seconds": 0  # Would need per-question timing
        })
    
    # Update attempt
    attempt.correct_answers = correct_count
    attempt.points_earned = total_points
    attempt.time_taken_seconds = int(time_taken)
    attempt.status = "completed"
    attempt.completed_at = datetime.utcnow()
    attempt.calculate_score()
    await attempt.save()
    
    # Update user stats and rewards
    user = await User.get(current_user["user_id"])
    user.stats.total_mcqs_attempted += attempt.total_questions
    user.stats.total_mcqs_correct += correct_count
    
    # Award XP and coins based on score
    xp_earned = total_points
    coins_earned = correct_count * 2
    
    user.add_xp(xp_earned)
    user.add_coins(coins_earned)
    await user.save()
    
    return {
        "attempt_id": str(attempt.id),
        "score_percentage": attempt.score_percentage,
        "correct_answers": correct_count,
        "total_questions": attempt.total_questions,
        "points_earned": total_points,
        "xp_earned": xp_earned,
        "coins_earned": coins_earned,
        "time_taken_seconds": int(time_taken),
        "results": results
    }


@router.get("/quiz/{attempt_id}")
async def get_quiz_result(
    attempt_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get quiz attempt results.
    """
    attempt = await MCQAttempt.get(attempt_id)
    
    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz attempt not found"
        )
    
    if attempt.user_id != current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return {
        "attempt_id": str(attempt.id),
        "status": attempt.status,
        "score_percentage": attempt.score_percentage,
        "correct_answers": attempt.correct_answers,
        "total_questions": attempt.total_questions,
        "points_earned": attempt.points_earned,
        "time_taken_seconds": attempt.time_taken_seconds,
        "started_at": attempt.started_at,
        "completed_at": attempt.completed_at,
        "answers": attempt.answers
    }


@router.get("/questions")
async def get_questions(
    topic: Optional[str] = None,
    programming_language: Optional[str] = None,
    difficulty: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """
    Get MCQ questions (Admin/Instructor only).
    """
    user = await User.get(current_user["user_id"])
    if user.role not in ["admin", "instructor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    query = {}
    if topic:
        query["topic"] = topic
    if programming_language:
        query["programming_language"] = programming_language
    if difficulty:
        query["difficulty"] = difficulty
    
    skip = (page - 1) * limit
    questions = await MCQQuestion.find(query).skip(skip).limit(limit).to_list()
    total = await MCQQuestion.find(query).count()
    
    return {
        "questions": [
            {
                "id": str(q.id),
                "question": q.question,
                "question_ur": q.question_ur,
                "topic": q.topic,
                "difficulty": q.difficulty,
                "times_shown": q.times_shown,
                "accuracy_rate": q.accuracy_rate,
                "is_generated": q.is_generated,
                "created_at": q.created_at
            }
            for q in questions
        ],
        "total": total,
        "page": page,
        "limit": limit
    }


@router.get("/topics")
async def get_topics():
    """
    Get available MCQ topics.
    """
    return {
        "topics": [
            {"id": "variables", "name": "Variables & Data Types", "name_ur": "متغیرات اور ڈیٹا کی اقسام"},
            {"id": "operators", "name": "Operators", "name_ur": "آپریٹرز"},
            {"id": "conditionals", "name": "Conditional Statements", "name_ur": "شرطی بیانات"},
            {"id": "loops", "name": "Loops", "name_ur": "لوپس"},
            {"id": "functions", "name": "Functions", "name_ur": "فنکشنز"},
            {"id": "arrays", "name": "Arrays & Lists", "name_ur": "ارے اور فہرستیں"},
            {"id": "strings", "name": "Strings", "name_ur": "سٹرنگز"},
            {"id": "oop", "name": "Object-Oriented Programming", "name_ur": "آبجیکٹ اورینٹڈ پروگرامنگ"},
            {"id": "file_handling", "name": "File Handling", "name_ur": "فائل ہینڈلنگ"},
            {"id": "algorithms", "name": "Algorithms", "name_ur": "الگورتھمز"},
        ]
    }
