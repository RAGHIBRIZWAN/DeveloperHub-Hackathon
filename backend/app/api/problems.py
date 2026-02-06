"""
Problems API Routes
==================
API endpoints for hardcoded CP problems and module coding problems.
Supports Python, C++, and JavaScript code execution with test case evaluation.
"""

import asyncio
import subprocess
import tempfile
import os
import time
import random
import json
import aiohttp
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, status, Depends, Query, Body
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.security import get_current_user
from app.models.user import User
from app.models.gamification import UserRewards
from app.models.submission import UserProblemStatus
from app.data.cp_problems import CP_PROBLEMS, get_problem_by_id, get_problems_by_rating
from app.data.module_problems import (
    get_mcqs_by_module, get_coding_problems_by_module, get_mcq_by_id,
    get_coding_problem_by_id, get_all_mcqs, get_all_coding_problems
)

router = APIRouter()


# ============ Groq API Helper ============

async def call_groq_api(prompt: str, temperature: float = 0.7) -> str:
    """Call Groq API for text generation."""
    try:
        async with aiohttp.ClientSession() as session:
            headers = {
                "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": temperature,
                "max_tokens": 2000
            }
            
            async with session.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return data["choices"][0]["message"]["content"]
                else:
                    error_text = await response.text()
                    raise HTTPException(
                        status_code=500,
                        detail=f"Groq API error: {error_text}"
                    )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to call Groq API: {str(e)}"
        )


# ============ Schemas ============

class RunCodeRequest(BaseModel):
    """Request to run code."""
    code: str = Field(..., min_length=1, max_length=50000)
    language: str = Field(..., description="python, cpp, or javascript")
    stdin: str = Field(default="", description="Input for the program")


class SubmitSolutionRequest(BaseModel):
    """Request to submit a solution for judging."""
    problem_id: str
    code: str = Field(..., min_length=1, max_length=50000)
    language: str = Field(..., description="python, cpp, or javascript")


class TestResult(BaseModel):
    """Result of a single test case."""
    test_number: int
    passed: bool
    input_data: str
    expected_output: str
    actual_output: Optional[str] = None
    execution_time_ms: int
    error: Optional[str] = None


class SubmissionResult(BaseModel):
    """Result of code submission."""
    verdict: str
    verdict_message: str
    passed_tests: int
    total_tests: int
    execution_time_ms: int
    test_results: List[TestResult]


class ExamQuestion(BaseModel):
    """Question in an exam (MCQ or Coding)."""
    type: str  # "mcq" or "coding"
    question_data: dict


class ModuleExam(BaseModel):
    """Complete exam for a module."""
    module_id: str
    module_name: str
    total_mcqs: int
    total_coding: int
    questions: List[ExamQuestion]


# ============ Code Executor ============

class MultiLangExecutor:
    """Execute code in Python, C++, or JavaScript."""
    
    TIME_LIMIT = 5  # seconds
    
    @staticmethod
    async def execute(code: str, language: str, stdin: str) -> dict:
        """Execute code and return result."""
        
        if language == "python":
            return await MultiLangExecutor._execute_python(code, stdin)
        elif language == "cpp":
            return await MultiLangExecutor._execute_cpp(code, stdin)
        elif language == "javascript":
            return await MultiLangExecutor._execute_javascript(code, stdin)
        else:
            return {
                "output": "",
                "error": f"Unsupported language: {language}",
                "execution_time_ms": 0,
                "status": "error"
            }
    
    @staticmethod
    async def _execute_python(code: str, stdin: str) -> dict:
        """Execute Python code."""
        
        # Security check
        forbidden = ["import os", "import sys", "import subprocess", "__import__", "eval(", "exec(", "open("]
        code_lower = code.lower()
        for f in forbidden:
            if f in code_lower:
                return {"output": "", "error": f"Forbidden: {f}", "execution_time_ms": 0, "status": "error"}
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(code)
            code_file = f.name
        
        try:
            start = time.time()
            process = subprocess.run(
                ["python", code_file],
                input=stdin,
                capture_output=True,
                text=True,
                timeout=MultiLangExecutor.TIME_LIMIT
            )
            execution_time = int((time.time() - start) * 1000)
            
            if process.returncode != 0:
                return {
                    "output": "",
                    "error": process.stderr[:1000],
                    "execution_time_ms": execution_time,
                    "status": "error"
                }
            
            return {
                "output": process.stdout.strip(),
                "error": None,
                "execution_time_ms": execution_time,
                "status": "success"
            }
        except subprocess.TimeoutExpired:
            return {"output": "", "error": "Time Limit Exceeded", "execution_time_ms": MultiLangExecutor.TIME_LIMIT * 1000, "status": "timeout"}
        finally:
            try:
                os.unlink(code_file)
            except:
                pass
    
    @staticmethod
    async def _execute_cpp(code: str, stdin: str) -> dict:
        """Execute C++ code."""
        
        # Add header to fix MinGW ssize_t issue - define ssize_t before any includes
        mingw_fix = """#ifndef _SSIZE_T_DEFINED
#define _SSIZE_T_DEFINED
#include <stddef.h>
typedef ptrdiff_t ssize_t;
#endif
"""
        fixed_code = mingw_fix + code
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.cpp', delete=False) as f:
            f.write(fixed_code)
            code_file = f.name
        
        exe_file = code_file.replace('.cpp', '.exe' if os.name == 'nt' else '')
        
        try:
            # Compile with C++14 standard and proper flags
            compile_result = subprocess.run(
                ["g++", code_file, "-o", exe_file, "-std=c++14", "-O2", "-static-libgcc", "-static-libstdc++"],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if compile_result.returncode != 0:
                return {
                    "output": "",
                    "error": f"Compilation Error:\n{compile_result.stderr[:1000]}",
                    "execution_time_ms": 0,
                    "status": "compile_error"
                }
            
            # Execute
            start = time.time()
            process = subprocess.run(
                [exe_file],
                input=stdin,
                capture_output=True,
                text=True,
                timeout=MultiLangExecutor.TIME_LIMIT
            )
            execution_time = int((time.time() - start) * 1000)
            
            if process.returncode != 0:
                return {
                    "output": "",
                    "error": process.stderr[:1000] or "Runtime Error",
                    "execution_time_ms": execution_time,
                    "status": "error"
                }
            
            return {
                "output": process.stdout.strip(),
                "error": None,
                "execution_time_ms": execution_time,
                "status": "success"
            }
        except subprocess.TimeoutExpired:
            return {"output": "", "error": "Time Limit Exceeded", "execution_time_ms": MultiLangExecutor.TIME_LIMIT * 1000, "status": "timeout"}
        except FileNotFoundError:
            return {"output": "", "error": "C++ compiler (g++) not found. Please install it.", "execution_time_ms": 0, "status": "error"}
        finally:
            try:
                os.unlink(code_file)
                if os.path.exists(exe_file):
                    os.unlink(exe_file)
            except:
                pass
    
    @staticmethod
    async def _execute_javascript(code: str, stdin: str) -> dict:
        """Execute JavaScript code with Node.js."""
        
        # Wrap code to read from stdin
        escaped_stdin = stdin.replace('`', '\\`')
        newline = '\\n'
        wrapped_code = f"""
const readline = require('readline');
const input = `{escaped_stdin}`.trim().split('{newline}');
let inputIndex = 0;
const readLine = () => input[inputIndex++] || '';

{code}
"""
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
            f.write(wrapped_code)
            code_file = f.name
        
        try:
            start = time.time()
            process = subprocess.run(
                ["node", code_file],
                capture_output=True,
                text=True,
                timeout=MultiLangExecutor.TIME_LIMIT
            )
            execution_time = int((time.time() - start) * 1000)
            
            if process.returncode != 0:
                return {
                    "output": "",
                    "error": process.stderr[:1000],
                    "execution_time_ms": execution_time,
                    "status": "error"
                }
            
            return {
                "output": process.stdout.strip(),
                "error": None,
                "execution_time_ms": execution_time,
                "status": "success"
            }
        except subprocess.TimeoutExpired:
            return {"output": "", "error": "Time Limit Exceeded", "execution_time_ms": MultiLangExecutor.TIME_LIMIT * 1000, "status": "timeout"}
        except FileNotFoundError:
            return {"output": "", "error": "Node.js not found. Please install it.", "execution_time_ms": 0, "status": "error"}
        finally:
            try:
                os.unlink(code_file)
            except:
                pass


# ============ CP Problems Routes ============

@router.get("/cp/problems")
async def get_cp_problems(
    rating_min: Optional[int] = Query(None, ge=800, le=3500),
    rating_max: Optional[int] = Query(None, ge=800, le=3500),
    difficulty: Optional[str] = Query(None, description="easy, medium, hard, expert"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50)
):
    """Get competitive programming problems with filtering."""
    
    problems = CP_PROBLEMS.copy()
    
    # Filter by rating
    if rating_min:
        problems = [p for p in problems if p["rating"] >= rating_min]
    if rating_max:
        problems = [p for p in problems if p["rating"] <= rating_max]
    
    # Filter by difficulty
    if difficulty:
        problems = [p for p in problems if p["difficulty"] == difficulty]
    
    # Pagination
    total = len(problems)
    start = (page - 1) * limit
    end = start + limit
    problems = problems[start:end]
    
    # Return without test cases for list view
    return {
        "problems": [
            {
                "id": p["id"],
                "name": p["name"],
                "rating": p["rating"],
                "difficulty": p["difficulty"],
                "tags": p["tags"]
            }
            for p in problems
        ],
        "total": total,
        "page": page,
        "total_pages": (total + limit - 1) // limit
    }


@router.get("/cp/problems/{problem_id}")
async def get_cp_problem_detail(problem_id: str):
    """Get full details of a CP problem including examples."""
    
    problem = get_problem_by_id(problem_id)
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    # Return full problem but without test cases
    return {
        "id": problem["id"],
        "name": problem["name"],
        "rating": problem["rating"],
        "difficulty": problem["difficulty"],
        "tags": problem["tags"],
        "description": problem["description"],
        "input_format": problem["input_format"],
        "output_format": problem["output_format"],
        "examples": problem["examples"],
        "solution_hint": problem.get("solution_hint", "")
    }


# ============ Module Problems Routes ============

@router.get("/modules/{module_id}/mcqs")
async def get_module_mcqs(
    module_id: str,
    difficulty: Optional[str] = None,
    topic: Optional[str] = None,
    limit: int = Query(10, ge=1, le=50)
):
    """Get MCQ questions for a module."""
    
    mcqs = get_mcqs_by_module(module_id)
    
    if not mcqs:
        raise HTTPException(status_code=404, detail=f"Module '{module_id}' not found")
    
    # Filter
    if difficulty:
        mcqs = [m for m in mcqs if m["difficulty"] == difficulty]
    if topic:
        mcqs = [m for m in mcqs if topic.lower() in m["topic"].lower()]
    
    # Limit results
    mcqs = mcqs[:limit]
    
    # Remove correct answer for quiz mode
    return {
        "module_id": module_id,
        "total": len(mcqs),
        "questions": [
            {
                "id": m["id"],
                "topic": m["topic"],
                "difficulty": m["difficulty"],
                "question": m["question"],
                "options": [{"id": o["id"], "text": o["text"]} for o in m["options"]]
            }
            for m in mcqs
        ]
    }


@router.post("/modules/mcqs/{mcq_id}/check")
async def check_mcq_answer(mcq_id: str, request: dict = Body(...)):
    """Check if the selected answer is correct."""
    
    selected_option = request.get("selected_option")
    if not selected_option:
        raise HTTPException(status_code=400, detail="selected_option is required")
    
    mcq = get_mcq_by_id(mcq_id)
    if not mcq:
        raise HTTPException(status_code=404, detail="Question not found")
    
    is_correct = selected_option == mcq["correct_option"]
    
    # Generate detailed explanation using Groq LLM
    groq_explanation = None
    try:
        explanation_prompt = f"""You are a helpful programming tutor. A student just answered this multiple-choice question:

Question: {mcq['question']}

Options:
{chr(10).join([f"{opt['id'].upper()}. {opt['text']}" for opt in mcq['options']])}

Student selected: {selected_option.upper()}
Correct answer: {mcq['correct_option'].upper()}

Provide:
1. A brief explanation of why the correct answer is right
2. If the student was wrong, explain their misconception
3. A helpful suggestion or tip to remember this concept

Keep it concise (2-3 sentences) and encouraging."""

        groq_explanation = await call_groq_api(explanation_prompt, temperature=0.7)
    except Exception as e:
        print(f"Failed to generate Groq explanation: {e}")
        groq_explanation = mcq["explanation"]
    
    return {
        "is_correct": is_correct,
        "correct_option": mcq["correct_option"],
        "explanation": mcq["explanation"],
        "ai_explanation": groq_explanation,
        "selected_option": selected_option
    }


@router.get("/modules/{module_id}/mcqs/groq")
async def generate_groq_mcqs(
    module_id: str,
    count: int = Query(10, ge=1, le=15, description="Number of MCQs to generate")
):
    """Generate MCQs using Groq AI for a module."""
    
    module_topics = {
        "programming-fundamentals": "Programming Fundamentals: variables, data types, control flow, loops, functions, arrays, strings",
        "pf": "Programming Fundamentals: variables, data types, control flow, loops, functions, arrays, strings",
        "oop": "Object-Oriented Programming: classes, objects, inheritance, polymorphism, encapsulation, abstraction",
        "data-structures": "Data Structures and Algorithms: arrays, linked lists, stacks, queues, trees, graphs, sorting, searching, dynamic programming",
        "dsa": "Data Structures and Algorithms: arrays, linked lists, stacks, queues, trees, graphs, sorting, searching, dynamic programming"
    }
    
    normalized_id = module_id.lower()
    if normalized_id not in module_topics:
        raise HTTPException(status_code=404, detail=f"Module '{module_id}' not found")
    
    topic = module_topics[normalized_id]
    
    prompt = f"""Generate {count} multiple-choice questions about {topic}.

For each question, provide:
1. A clear question
2. Four answer options (A, B, C, D)
3. The correct answer (A, B, C, or D)
4. A brief explanation of why the answer is correct

Format as JSON array:
[
  {{
    "question": "question text",
    "options": [
      {{"id": "a", "text": "option A"}},
      {{"id": "b", "text": "option B"}},
      {{"id": "c", "text": "option C"}},
      {{"id": "d", "text": "option D"}}
    ],
    "correct_option": "a",
    "explanation": "explanation text"
  }}
]

Make questions educational, practical, and relevant to {topic.split(':')[0]}."""
    
    try:
        response = await call_groq_api(prompt, temperature=0.8)
        
        # Extract JSON from response
        start = response.find('[')
        end = response.rfind(']') + 1
        if start == -1 or end == 0:
            raise ValueError("No JSON array found in response")
        
        json_str = response[start:end]
        mcqs = json.loads(json_str)
        
        # Add IDs
        for i, mcq in enumerate(mcqs):
            mcq["id"] = f"groq-{normalized_id}-{i+1}"
            mcq["topic"] = topic.split(':')[0]
            mcq["difficulty"] = "medium"
        
        return {
            "module_id": normalized_id,
            "module_name": topic.split(':')[0],
            "total": len(mcqs),
            "questions": mcqs
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate MCQs: {str(e)}"
        )


@router.get("/modules/{module_id}/coding")
async def get_module_coding_problems(
    module_id: str,
    difficulty: Optional[str] = None
):
    """Get coding problems for a module."""
    
    problems = get_coding_problems_by_module(module_id)
    
    if not problems:
        raise HTTPException(status_code=404, detail=f"Module '{module_id}' not found")
    
    if difficulty:
        problems = [p for p in problems if p["difficulty"] == difficulty]
    
    return {
        "module_id": module_id,
        "total": len(problems),
        "problems": [
            {
                "id": p["id"],
                "name": p["name"],
                "difficulty": p["difficulty"],
                "topic": p["topic"]
            }
            for p in problems
        ]
    }


@router.get("/modules/coding/{problem_id}")
async def get_coding_problem_detail(problem_id: str):
    """Get full details of a coding problem."""
    
    # Check CP problems first
    problem = get_problem_by_id(problem_id)
    if not problem:
        # Check module coding problems
        problem = get_coding_problem_by_id(problem_id)
    
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    return {
        "id": problem["id"],
        "name": problem["name"],
        "difficulty": problem["difficulty"],
        "topic": problem.get("topic", ""),
        "tags": problem.get("tags", []),
        "description": problem["description"],
        "input_format": problem["input_format"],
        "output_format": problem["output_format"],
        "examples": problem["examples"],
        "rating": problem.get("rating")
    }


# ============ Code Execution Routes ============

@router.post("/run")
async def run_code(request: RunCodeRequest):
    """Run code with custom input."""
    
    result = await MultiLangExecutor.execute(
        request.code,
        request.language,
        request.stdin
    )
    
    return {
        "output": result["output"],
        "error": result["error"],
        "execution_time_ms": result["execution_time_ms"],
        "status": result["status"]
    }


@router.post("/submit/{problem_id}")
async def submit_solution(
    problem_id: str,
    request: SubmitSolutionRequest,
    current_user: dict = Depends(get_current_user)
):
    """Submit solution and judge against test cases."""
    
    # Find problem
    problem = get_problem_by_id(problem_id)
    if not problem:
        problem = get_coding_problem_by_id(problem_id)
    
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    test_cases = problem["test_cases"]
    test_results = []
    total_time = 0
    all_passed = True
    
    for i, tc in enumerate(test_cases):
        result = await MultiLangExecutor.execute(
            request.code,
            request.language,
            tc["input"]
        )
        
        expected = tc["output"].strip()
        actual = result["output"].strip()
        passed = result["status"] == "success" and actual == expected
        
        if not passed:
            all_passed = False
        
        test_results.append(TestResult(
            test_number=i + 1,
            passed=passed,
            input_data=tc["input"],
            expected_output=expected,
            actual_output=actual if result["status"] == "success" else None,
            execution_time_ms=result["execution_time_ms"],
            error=result["error"]
        ))
        
        total_time += result["execution_time_ms"]
        
        # Stop on first failure for efficiency
        if not passed and i >= 2:  # Run at least 3 tests
            # Add remaining tests as not run
            for j in range(i + 1, len(test_cases)):
                test_results.append(TestResult(
                    test_number=j + 1,
                    passed=False,
                    input_data=test_cases[j]["input"],
                    expected_output=test_cases[j]["output"],
                    actual_output=None,
                    execution_time_ms=0,
                    error="Skipped due to previous failure"
                ))
            break
    
    passed_count = sum(1 for tr in test_results if tr.passed)
    total_count = len(test_cases)
    
    # Determine verdict
    if all_passed:
        verdict = "AC"
        verdict_message = f"Accepted! All {total_count} test cases passed."
    elif any(tr.error and "Time Limit" in tr.error for tr in test_results):
        verdict = "TLE"
        verdict_message = "Time Limit Exceeded"
    elif any(tr.error and "Compilation" in (tr.error or "") for tr in test_results):
        verdict = "CE"
        verdict_message = "Compilation Error"
    elif any(tr.error and tr.error and "Runtime" in tr.error for tr in test_results):
        verdict = "RE"
        verdict_message = "Runtime Error"
    else:
        first_failed = next((tr for tr in test_results if not tr.passed), None)
        verdict = "WA"
        verdict_message = f"Wrong Answer on test {first_failed.test_number if first_failed else '?'}"
    
    # Generate AI guidance and suggestions using Groq
    ai_guidance = None
    try:
        if verdict != "AC":
            # Generate helpful feedback for wrong solutions
            first_failure = next((tr for tr in test_results if not tr.passed), None)
            guidance_prompt = f"""You are a helpful programming tutor. A student submitted code for this problem:

Problem: {problem['name']}
Description: {problem['description'][:300]}...

Their code ({request.language}):
```{request.language}
{request.code[:500]}...
```

Verdict: {verdict} - {verdict_message}
Failed test input: {first_failure.input_data if first_failure else 'N/A'}
Expected output: {first_failure.expected_output if first_failure else 'N/A'}
Student's output: {first_failure.actual_output if first_failure else 'N/A'}

Provide:
1. What went wrong (briefly)
2. A hint to fix it (don't give the full solution)
3. A suggestion for improvement

Keep it concise (3-4 sentences) and encouraging."""

            ai_guidance = await call_groq_api(guidance_prompt, temperature=0.7)
        else:
            # Congratulatory message with optimization tips
            guidance_prompt = f"""A student solved this problem correctly:

Problem: {problem['name']}
Their solution in {request.language} passed all test cases.

Provide:
1. A brief congratulation
2. One tip for code optimization or best practices
3. Encouragement to try harder problems

Keep it concise (2-3 sentences) and positive."""

            ai_guidance = await call_groq_api(guidance_prompt, temperature=0.7)
    except Exception as e:
        print(f"Failed to generate AI guidance: {e}")
        ai_guidance = None
    
    result = SubmissionResult(
        verdict=verdict,
        verdict_message=verdict_message,
        passed_tests=passed_count,
        total_tests=total_count,
        execution_time_ms=total_time,
        test_results=test_results[:5]  # Only return first 5 test results
    )
    
    # Track problem status and award XP (with dedup)
    xp_earned = 0
    coins_earned = 0
    leveled_up = False
    new_level = None
    already_solved = False
    if verdict == "AC":
        try:
            user = await User.get(current_user["user_id"])
            rewards = await UserRewards.find_one({"user_id": current_user["user_id"]})
            if not rewards:
                rewards = UserRewards(user_id=current_user["user_id"])
                await rewards.insert()

            # Check if already solved (dedup)
            problem_status = await UserProblemStatus.find_one({
                "user_id": current_user["user_id"],
                "problem_id": problem_id
            })
            if problem_status and problem_status.is_solved:
                already_solved = True
            else:
                # First time solving — award XP/coins
                difficulty = problem.get("difficulty", "medium")
                xp_map = {"easy": 15, "medium": 25, "hard": 40, "expert": 60}
                xp_earned = xp_map.get(difficulty, 20)
                coins_earned = 5
                leveled_up = user.add_xp(xp_earned)
                new_level = user.level if leveled_up else None
                user.add_coins(coins_earned)
                user.stats.total_challenges_solved += 1
                user.updated_at = datetime.utcnow()
                await user.save()
                rewards.total_xp_earned += xp_earned
                rewards.add_coins(coins_earned, "practice", f"Solved {problem['name']}")
                await rewards.save()

            # Update / create problem status
            if not problem_status:
                problem_status = UserProblemStatus(
                    user_id=current_user["user_id"],
                    problem_id=problem_id,
                    is_solved=True,
                    attempts=1,
                    solved_at=datetime.utcnow(),
                    last_attempt_at=datetime.utcnow()
                )
                await problem_status.insert()
            else:
                problem_status.is_solved = True
                problem_status.attempts += 1
                if not problem_status.solved_at:
                    problem_status.solved_at = datetime.utcnow()
                problem_status.last_attempt_at = datetime.utcnow()
                await problem_status.save()
        except Exception as e:
            print(f"Failed to award XP for submission: {e}")
    else:
        # Track failed attempt too
        try:
            problem_status = await UserProblemStatus.find_one({
                "user_id": current_user["user_id"],
                "problem_id": problem_id
            })
            if not problem_status:
                problem_status = UserProblemStatus(
                    user_id=current_user["user_id"],
                    problem_id=problem_id,
                    is_solved=False,
                    attempts=1,
                    last_attempt_at=datetime.utcnow()
                )
                await problem_status.insert()
            else:
                problem_status.attempts += 1
                problem_status.last_attempt_at = datetime.utcnow()
                await problem_status.save()
        except Exception as e:
            print(f"Failed to track attempt: {e}")

    # Add AI guidance to response
    return {
        **result.dict(),
        "ai_guidance": ai_guidance,
        "problem_name": problem["name"],
        "xp_earned": xp_earned,
        "coins_earned": coins_earned,
        "leveled_up": leveled_up,
        "new_level": new_level,
        "already_solved": already_solved
    }


# ============ OOP Validation Helper ============

async def validate_oop_code(code: str, problem_description: str, language: str) -> dict:
    """Use Groq LLM to validate if code follows OOP principles for OOP problems."""
    
    prompt = f"""You are a code reviewer for an Object-Oriented Programming course.

Problem Description:
{problem_description}

Student's Code ({language}):
```{language}
{code}
```

Analyze this code and determine if it properly follows OOP principles as required by the problem.

Requirements to check:
1. Does the code define appropriate classes as described in the problem?
2. Are methods properly encapsulated within classes?
3. Does it use inheritance/polymorphism if the problem requires it?
4. Are attributes properly defined (private/public as appropriate)?
5. Does the solution use OOP concepts instead of purely procedural code?

Respond in JSON format:
{{
  "valid": true/false,
  "feedback": "Brief explanation of what's wrong or right with the OOP implementation",
  "missing_concepts": ["list", "of", "missing", "oop", "concepts"]
}}

Important: If the output is correct but the code doesn't use proper OOP (e.g., no classes, procedural approach), mark it as INVALID.
Be strict - the solution must demonstrate understanding of OOP concepts."""

    try:
        response = await call_groq_api(prompt, temperature=0.3)
        
        # Parse JSON from response
        import re
        json_match = re.search(r'\{[^{}]*\}', response, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group())
            return {
                "valid": result.get("valid", False),
                "feedback": result.get("feedback", ""),
                "missing_concepts": result.get("missing_concepts", [])
            }
        
        # If can't parse, assume invalid
        return {
            "valid": False,
            "feedback": "Could not validate OOP compliance. Please ensure you use proper OOP concepts.",
            "missing_concepts": []
        }
    except Exception as e:
        print(f"OOP validation error: {e}")
        # On error, don't block - just skip validation
        return {
            "valid": True,
            "feedback": "OOP validation skipped due to service unavailability.",
            "missing_concepts": []
        }


@router.post("/modules/submit/{problem_id}")
async def submit_module_solution(
    problem_id: str,
    request: SubmitSolutionRequest,
    current_user: dict = Depends(get_current_user)
):
    """Submit solution for a module coding problem with OOP validation for OOP module."""
    
    # Find problem
    problem = get_coding_problem_by_id(problem_id)
    
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    # Check if this is an OOP problem (id starts with 'oop-')
    is_oop_problem = problem_id.startswith('oop-')
    oop_validation = None
    
    # Validate OOP compliance for OOP problems BEFORE running tests
    if is_oop_problem:
        oop_validation = await validate_oop_code(
            request.code, 
            problem["description"],
            request.language
        )
        
        # If OOP validation fails, return failure immediately
        if not oop_validation["valid"]:
            return {
                "verdict": "WA",
                "verdict_message": "Code does not follow OOP requirements",
                "passed_tests": 0,
                "total_tests": len(problem["test_cases"]),
                "execution_time_ms": 0,
                "test_results": [],
                "oop_validation": {
                    "valid": False,
                    "feedback": oop_validation["feedback"],
                    "missing_concepts": oop_validation.get("missing_concepts", [])
                }
            }
    
    # Run test cases
    test_cases = problem["test_cases"]
    test_results = []
    total_time = 0
    all_passed = True
    
    for i, tc in enumerate(test_cases):
        result = await MultiLangExecutor.execute(
            request.code,
            request.language,
            tc["input"]
        )
        
        expected = tc["output"].strip()
        actual = result["output"].strip()
        passed = result["status"] == "success" and actual == expected
        
        if not passed:
            all_passed = False
        
        test_results.append({
            "test_number": i + 1,
            "passed": passed,
            "input_data": tc["input"],
            "expected_output": expected,
            "actual_output": actual if result["status"] == "success" else None,
            "execution_time_ms": result["execution_time_ms"],
            "error": result["error"]
        })
        
        total_time += result["execution_time_ms"]
        
        # Stop on first failure for efficiency
        if not passed and i >= 2:
            for j in range(i + 1, len(test_cases)):
                test_results.append({
                    "test_number": j + 1,
                    "passed": False,
                    "input_data": test_cases[j]["input"],
                    "expected_output": test_cases[j]["output"],
                    "actual_output": None,
                    "execution_time_ms": 0,
                    "error": "Skipped due to previous failure"
                })
            break
    
    passed_count = sum(1 for tr in test_results if tr["passed"])
    total_count = len(test_cases)
    
    if all_passed:
        verdict = "AC"
        verdict_message = f"Accepted! All {total_count} test cases passed."
    elif any(tr.get("error") and "Time Limit" in tr["error"] for tr in test_results):
        verdict = "TLE"
        verdict_message = "Time Limit Exceeded"
    elif any(tr.get("error") and "Compilation" in (tr.get("error") or "") for tr in test_results):
        verdict = "CE"
        verdict_message = "Compilation Error"
    elif any(tr.get("error") and "Runtime" in (tr.get("error") or "") for tr in test_results):
        verdict = "RE"
        verdict_message = "Runtime Error"
    else:
        first_failed = next((tr for tr in test_results if not tr["passed"]), None)
        verdict = "WA"
        verdict_message = f"Wrong Answer on test {first_failed['test_number'] if first_failed else '?'}"
    
    # Generate AI guidance for module submissions too
    ai_guidance = None
    try:
        if verdict != "AC":
            first_failure = next((tr for tr in test_results if not tr["passed"]), None)
            guidance_prompt = f"""You are a helpful programming tutor for {problem.get('topic', 'programming')} module.

Problem: {problem['name']}
Description: {problem['description'][:300]}...

Student's code ({request.language}):
```{request.language}
{request.code[:500]}...
```

Verdict: {verdict} - {verdict_message}
Failed test: {first_failure['input_data'] if first_failure else 'N/A'}
Expected: {first_failure['expected_output'] if first_failure else 'N/A'}
Got: {first_failure['actual_output'] if first_failure else 'N/A'}

Provide brief, encouraging guidance:
1. What likely went wrong
2. A hint to fix it
3. A learning tip

Keep it 3-4 sentences."""

            ai_guidance = await call_groq_api(guidance_prompt, temperature=0.7)
        else:
            ai_guidance = f"Excellent work! Your solution for '{problem['name']}' is correct. Keep practicing to strengthen your {problem.get('topic', 'programming')} skills!"
    except Exception as e:
        print(f"Failed to generate AI guidance: {e}")
        ai_guidance = None
    
    response = {
        "verdict": verdict,
        "verdict_message": verdict_message,
        "passed_tests": passed_count,
        "total_tests": total_count,
        "execution_time_ms": total_time,
        "test_results": test_results[:5],
        "ai_guidance": ai_guidance,
        "problem_name": problem["name"]
    }
    
    # Add OOP validation info if applicable
    if is_oop_problem and oop_validation:
        response["oop_validation"] = {
            "valid": oop_validation["valid"],
            "feedback": oop_validation["feedback"]
        }
    
    # Track problem status and award XP (with dedup)
    xp_earned = 0
    coins_earned = 0
    leveled_up = False
    new_level = None
    already_solved = False
    if verdict == "AC":
        try:
            user = await User.get(current_user["user_id"])
            rewards = await UserRewards.find_one({"user_id": current_user["user_id"]})
            if not rewards:
                rewards = UserRewards(user_id=current_user["user_id"])
                await rewards.insert()

            # Check if already solved (dedup)
            problem_status = await UserProblemStatus.find_one({
                "user_id": current_user["user_id"],
                "problem_id": problem_id
            })
            if problem_status and problem_status.is_solved:
                already_solved = True
            else:
                # First time solving — award XP/coins
                difficulty = problem.get("difficulty", "medium")
                xp_map = {"easy": 10, "medium": 20, "hard": 35, "expert": 50}
                xp_earned = xp_map.get(difficulty, 15)
                coins_earned = 5
                leveled_up = user.add_xp(xp_earned)
                new_level = user.level if leveled_up else None
                user.add_coins(coins_earned)
                user.stats.total_challenges_solved += 1
                user.updated_at = datetime.utcnow()
                await user.save()
                rewards.total_xp_earned += xp_earned
                rewards.add_coins(coins_earned, "practice", f"Solved {problem['name']}")
                await rewards.save()

            # Update / create problem status
            if not problem_status:
                problem_status = UserProblemStatus(
                    user_id=current_user["user_id"],
                    problem_id=problem_id,
                    is_solved=True,
                    attempts=1,
                    solved_at=datetime.utcnow(),
                    last_attempt_at=datetime.utcnow()
                )
                await problem_status.insert()
            else:
                problem_status.is_solved = True
                problem_status.attempts += 1
                if not problem_status.solved_at:
                    problem_status.solved_at = datetime.utcnow()
                problem_status.last_attempt_at = datetime.utcnow()
                await problem_status.save()
        except Exception as e:
            print(f"Failed to award XP for module submission: {e}")
    else:
        # Track failed attempt
        try:
            problem_status = await UserProblemStatus.find_one({
                "user_id": current_user["user_id"],
                "problem_id": problem_id
            })
            if not problem_status:
                problem_status = UserProblemStatus(
                    user_id=current_user["user_id"],
                    problem_id=problem_id,
                    is_solved=False,
                    attempts=1,
                    last_attempt_at=datetime.utcnow()
                )
                await problem_status.insert()
            else:
                problem_status.attempts += 1
                problem_status.last_attempt_at = datetime.utcnow()
                await problem_status.save()
        except Exception as e:
            print(f"Failed to track attempt: {e}")
    
    response["xp_earned"] = xp_earned
    response["coins_earned"] = coins_earned
    response["leveled_up"] = leveled_up
    response["new_level"] = new_level
    response["already_solved"] = already_solved
    
    return response


# ============ Module Exam Routes ============

@router.get("/modules/{module_id}/exam")
async def generate_module_exam(
    module_id: str,
    mcq_count: int = Query(5, ge=1, le=15, description="Number of MCQ questions"),
    coding_count: int = Query(3, ge=1, le=10, description="Number of coding problems")
):
    """Generate a randomized exam for a module with MCQs and coding problems."""
    
    # Map module IDs to names
    module_names = {
        "programming-fundamentals": "Programming Fundamentals",
        "pf": "Programming Fundamentals",
        "oop": "Object-Oriented Programming",
        "data-structures": "Data Structures and Algorithms",
        "dsa": "Data Structures and Algorithms"
    }
    
    # Normalize module ID
    normalized_id = module_id.lower()
    if normalized_id == "pf":
        normalized_id = "programming-fundamentals"
    elif normalized_id == "dsa":
        normalized_id = "data-structures"
    
    # Get all MCQs and coding problems for the module
    all_mcqs = get_mcqs_by_module(normalized_id)
    all_coding = get_coding_problems_by_module(normalized_id)
    
    if not all_mcqs and not all_coding:
        raise HTTPException(
            status_code=404,
            detail=f"Module '{module_id}' not found. Available modules: programming-fundamentals, oop, data-structures"
        )
    
    # Randomly select questions
    selected_mcqs = random.sample(all_mcqs, min(mcq_count, len(all_mcqs)))
    selected_coding = random.sample(all_coding, min(coding_count, len(all_coding)))
    
    # Prepare exam questions
    exam_questions = []
    
    # Add MCQs (without correct answer)
    for mcq in selected_mcqs:
        exam_questions.append({
            "type": "mcq",
            "question_data": {
                "id": mcq["id"],
                "topic": mcq["topic"],
                "difficulty": mcq["difficulty"],
                "question": mcq["question"],
                "options": [{"id": o["id"], "text": o["text"]} for o in mcq["options"]]
            }
        })
    
    # Add coding problems
    for coding in selected_coding:
        exam_questions.append({
            "type": "coding",
            "question_data": {
                "id": coding["id"],
                "name": coding["name"],
                "difficulty": coding["difficulty"],
                "topic": coding["topic"],
                "description": coding["description"],
                "input_format": coding["input_format"],
                "output_format": coding["output_format"],
                "examples": coding["examples"]
            }
        })
    
    # Shuffle all questions together
    random.shuffle(exam_questions)
    
    return {
        "module_id": normalized_id,
        "module_name": module_names.get(normalized_id, normalized_id),
        "total_mcqs": len(selected_mcqs),
        "total_coding": len(selected_coding),
        "total_questions": len(exam_questions),
        "questions": exam_questions,
        "instructions": [
            "Answer all questions to the best of your ability",
            "MCQ questions have only one correct answer",
            "Coding problems will be judged against hidden test cases",
            "Time limit: 5 seconds per code execution"
        ]
    }


@router.post("/modules/exam/submit")
async def submit_exam(
    request: dict = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """Submit exam answers and get results with Groq AI justifications for wrong answers."""
    
    module_id = request.get("module_id")
    answers = request.get("answers", [])
    
    # Separate MCQ and coding answers
    mcq_answers = {}
    coding_submissions = {}
    
    for ans in answers:
        q_id = ans.get("question_id")
        q_type = ans.get("question_type", "mcq")
        
        if q_type == "mcq":
            mcq_answers[q_id] = ans.get("selected_option")
        elif q_type == "coding":
            coding_submissions[q_id] = {
                "code": ans.get("code", ""),
                "language": ans.get("language", "python")
            }
    
    total_correct = 0
    total_questions = len(answers)
    review = []
    
    # Check MCQ answers
    for mcq_id, selected_option in mcq_answers.items():
        mcq = get_mcq_by_id(mcq_id)
        if mcq:
            is_correct = selected_option == mcq["correct_option"]
            if is_correct:
                total_correct += 1
            else:
                # Generate Groq justification for wrong answer
                try:
                    selected_text = next((opt["text"] for opt in mcq["options"] if opt["id"] == selected_option), "Unknown")
                    correct_text = next((opt["text"] for opt in mcq["options"] if opt["id"] == mcq["correct_option"]), "Unknown")
                    
                    prompt = f"""Question: {mcq["question"]}

Student's answer: {selected_text}
Correct answer: {correct_text}

Explain in 2-3 sentences why the student's answer is wrong and why the correct answer is right. Be educational and helpful."""
                    
                    justification = await call_groq_api(prompt, temperature=0.7)
                except Exception as e:
                    print(f"Groq API error: {e}")
                    justification = mcq.get("explanation", "")
                
                review.append({
                    "question": mcq["question"],
                    "user_answer": selected_text,
                    "correct_answer": correct_text,
                    "justification": justification
                })
    
    # Check coding submissions
    for problem_id, submission in coding_submissions.items():
        problem = get_coding_problem_by_id(problem_id)
        if problem:
            test_cases = problem.get("test_cases", [])
            if not test_cases:
                continue
                
            passed = 0
            for tc in test_cases:
                try:
                    result = await MultiLangExecutor.execute(
                        submission["code"],
                        submission["language"],
                        tc["input"]
                    )
                    if result["status"] == "success" and result["output"].strip() == tc["output"].strip():
                        passed += 1
                except:
                    pass
            
            # Consider coding problem correct if all tests pass
            if passed == len(test_cases):
                total_correct += 1
            else:
                review.append({
                    "question": f"Coding: {problem['name']}",
                    "user_answer": f"Passed {passed}/{len(test_cases)} tests",
                    "correct_answer": "All test cases should pass",
                    "justification": f"Your code passed {passed} out of {len(test_cases)} test cases. Review the problem constraints and examples."
                })
    
    score = round((total_correct / total_questions * 100) if total_questions > 0 else 0)
    
    # Award XP and coins based on exam score (with dedup)
    xp_earned = 0
    coins_earned = 0
    leveled_up = False
    new_level = None
    already_completed = False
    try:
        user = await User.get(current_user["user_id"])
        rewards = await UserRewards.find_one({"user_id": current_user["user_id"]})
        if not rewards:
            rewards = UserRewards(user_id=current_user["user_id"])
            await rewards.insert()

        # Dedup: check if this module exam was already completed
        exam_key = f"exam-{module_id}"
        exam_status = await UserProblemStatus.find_one({
            "user_id": current_user["user_id"],
            "problem_id": exam_key
        })
        if exam_status and exam_status.is_solved:
            already_completed = True
        else:
            # First completion — award XP/coins
            if score >= 60:
                xp_earned = 30 + int(score * 0.5)
                coins_earned = 10 + int(score * 0.1)
            else:
                xp_earned = max(5, int(score * 0.2))
                coins_earned = 2
            leveled_up = user.add_xp(xp_earned)
            new_level = user.level if leveled_up else None
            user.add_coins(coins_earned)
            user.updated_at = datetime.utcnow()
            await user.save()
            rewards.total_xp_earned += xp_earned
            rewards.add_coins(coins_earned, "exam", f"Exam: {module_id} ({score}%)")
            await rewards.save()

            # Mark exam as completed
            if not exam_status:
                exam_status = UserProblemStatus(
                    user_id=current_user["user_id"],
                    problem_id=exam_key,
                    is_solved=True,
                    attempts=1,
                    solved_at=datetime.utcnow(),
                    last_attempt_at=datetime.utcnow()
                )
                await exam_status.insert()
            else:
                exam_status.is_solved = True
                exam_status.attempts += 1
                exam_status.solved_at = datetime.utcnow()
                exam_status.last_attempt_at = datetime.utcnow()
                await exam_status.save()
    except Exception as e:
        print(f"Failed to award XP for exam: {e}")
    
    return {
        "module_id": module_id,
        "score": score,
        "passing_score": 60,
        "correct": total_correct,
        "total": total_questions,
        "review": review,
        "xp_earned": xp_earned,
        "coins_earned": coins_earned,
        "leveled_up": leveled_up,
        "new_level": new_level,
        "already_completed": already_completed
    }


# ============ All Problems Summary ============

@router.post("/modules/quiz/complete")
async def complete_quiz(
    request: dict = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """Submit quiz results and award XP/coins based on score."""
    module_id = request.get("module_id", "unknown")
    correct = request.get("correct", 0)
    total = request.get("total", 0)
    
    if total <= 0:
        raise HTTPException(status_code=400, detail="Invalid quiz data")
    
    score = round((correct / total) * 100)
    
    xp_earned = 0
    coins_earned = 0
    leveled_up = False
    new_level = None
    already_completed = False
    
    try:
        user = await User.get(current_user["user_id"])
        rewards = await UserRewards.find_one({"user_id": current_user["user_id"]})
        if not rewards:
            rewards = UserRewards(user_id=current_user["user_id"])
            await rewards.insert()
        
        # Dedup: check if this module quiz was already completed
        quiz_key = f"quiz-{module_id}"
        quiz_status = await UserProblemStatus.find_one({
            "user_id": current_user["user_id"],
            "problem_id": quiz_key
        })
        if quiz_status and quiz_status.is_solved:
            already_completed = True
        else:
            # First completion — award XP/coins
            xp_earned = correct * 5
            if score >= 80:
                xp_earned += 15
            elif score >= 60:
                xp_earned += 10
            
            coins_earned = correct * 2
            
            leveled_up = user.add_xp(xp_earned)
            new_level = user.level if leveled_up else None
            user.add_coins(coins_earned)
            user.stats.total_mcqs_attempted += total
            user.stats.total_mcqs_correct += correct
            user.updated_at = datetime.utcnow()
            await user.save()
            
            rewards.total_xp_earned += xp_earned
            rewards.add_coins(coins_earned, "quiz", f"Quiz: {module_id} ({score}%)")
            await rewards.save()

            # Mark quiz as completed
            if not quiz_status:
                quiz_status = UserProblemStatus(
                    user_id=current_user["user_id"],
                    problem_id=quiz_key,
                    is_solved=True,
                    attempts=1,
                    solved_at=datetime.utcnow(),
                    last_attempt_at=datetime.utcnow()
                )
                await quiz_status.insert()
            else:
                quiz_status.is_solved = True
                quiz_status.attempts += 1
                quiz_status.solved_at = datetime.utcnow()
                quiz_status.last_attempt_at = datetime.utcnow()
                await quiz_status.save()
    except Exception as e:
        print(f"Failed to award XP for quiz: {e}")
    
    return {
        "score": score,
        "correct": correct,
        "total": total,
        "xp_earned": xp_earned,
        "coins_earned": coins_earned,
        "leveled_up": leveled_up,
        "new_level": new_level,
        "already_completed": already_completed
    }


@router.get("/all/summary")
async def get_all_problems_summary():
    """Get summary of all available problems."""
    
    cp_count = len(CP_PROBLEMS)
    
    modules = {
        "programming-fundamentals": get_mcqs_by_module("programming-fundamentals"),
        "oop": get_mcqs_by_module("oop"),
        "data-structures": get_mcqs_by_module("data-structures")
    }
    
    coding = {
        "programming-fundamentals": get_coding_problems_by_module("programming-fundamentals"),
        "oop": get_coding_problems_by_module("oop"),
        "data-structures": get_coding_problems_by_module("data-structures")
    }
    
    return {
        "competitive_programming": {
            "total_problems": cp_count,
            "difficulty_breakdown": {
                "easy": len([p for p in CP_PROBLEMS if p["difficulty"] == "easy"]),
                "medium": len([p for p in CP_PROBLEMS if p["difficulty"] == "medium"]),
                "hard": len([p for p in CP_PROBLEMS if p["difficulty"] == "hard"]),
                "expert": len([p for p in CP_PROBLEMS if p["difficulty"] == "expert"])
            }
        },
        "modules": {
            module_id: {
                "mcq_count": len(mcqs),
                "coding_count": len(coding.get(module_id, []))
            }
            for module_id, mcqs in modules.items()
        }
    }


@router.get("/solved")
async def get_solved_problems(
    current_user: dict = Depends(get_current_user)
):
    """Get list of all problems solved by the current user."""
    solved = await UserProblemStatus.find({
        "user_id": current_user["user_id"],
        "is_solved": True
    }).to_list()
    
    return {
        "solved_problem_ids": [s.problem_id for s in solved],
        "total_solved": len(solved)
    }
