"""
Practice & Submission API Routes
================================
Handle code submissions, test case generation, and verdict evaluation.
"""

import asyncio
import subprocess
import tempfile
import os
import time
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from groq import Groq

from app.core.security import get_current_user
from app.core.config import settings
from app.models.submission import Submission, TestCase, UserProblemStatus
from app.models.user import User
from app.models.gamification import UserRewards

router = APIRouter()

# Initialize Groq client
groq_client = Groq(api_key=settings.GROQ_API_KEY)


# ============ Schemas ============

class SubmitCodeRequest(BaseModel):
    """Request to submit code for a problem."""
    problem_id: str = Field(..., description="Codeforces problem ID (e.g., '1234A')")
    problem_name: str
    problem_rating: Optional[int] = None
    problem_statement: str = Field(..., description="Full problem description")
    problem_constraints: str = Field(..., description="Input/output format and constraints")
    source_code: str = Field(..., min_length=1, max_length=50000)
    language: str = Field(default="python3", description="Programming language")


class TestCaseResult(BaseModel):
    """Result of a single test case execution."""
    test_number: int
    input_data: str
    expected_output: str
    actual_output: Optional[str] = None
    passed: bool
    execution_time_ms: int
    error_message: Optional[str] = None


class SubmissionResponse(BaseModel):
    """Response after code submission."""
    submission_id: str
    verdict: str
    verdict_message: str
    passed_tests: int
    total_tests: int
    execution_time_ms: int
    memory_used_kb: int
    test_results: List[TestCaseResult]
    failed_on_test: Optional[int] = None
    failed_details: Optional[dict] = None
    ai_suggestions: Optional[dict] = None  # AI code review and suggestions


# ============ LLM Test Case Generation ============

async def generate_test_cases_with_groq(
    problem_statement: str,
    problem_constraints: str,
    num_test_cases: int = 8
) -> List[TestCase]:
    """
    Generate test cases using Groq LLM.
    
    Returns a mix of:
    - Sample cases
    - Edge cases
    - Random valid cases
    """
    
    prompt = f"""You are a competitive programming test case generator. Generate {num_test_cases} test cases for the following problem.

PROBLEM STATEMENT:
{problem_statement}

CONSTRAINTS & FORMAT:
{problem_constraints}

REQUIREMENTS:
1. Generate exactly {num_test_cases} test cases
2. Include edge cases (minimum values, maximum values, boundary conditions)
3. Include corner cases (special inputs that might break solutions)
4. Include typical valid inputs
5. Each test case must strictly follow the input/output format specified

OUTPUT FORMAT (JSON):
Return ONLY a valid JSON array of test cases. Each test case should have:
- "input": The input string (exactly as it would be fed to the program)
- "output": The expected output string (exactly as the correct solution would produce)
- "description": Brief description of what this test case checks

Example format:
[
  {{"input": "3\\n1 2 3", "output": "6", "description": "Basic case with 3 numbers"}},
  {{"input": "1\\n5", "output": "5", "description": "Single element"}},
  ...
]

CRITICAL: Return ONLY the JSON array, no other text, no markdown formatting, no explanations.
"""

    try:
        # Call Groq API
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are a precise test case generator for competitive programming. Always return valid JSON arrays."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,
            max_tokens=4000
        )
        
        # Parse response
        import json
        content = response.choices[0].message.content.strip()
        
        # Remove markdown code blocks if present
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
            content = content.strip()
        
        test_cases_data = json.loads(content)
        
        # Convert to TestCase objects
        test_cases = []
        for i, tc in enumerate(test_cases_data):
            test_cases.append(TestCase(
                input_data=tc["input"],
                expected_output=tc["output"].strip(),
                is_sample=(i < 2)  # First 2 are samples
            ))
        
        return test_cases
    
    except Exception as e:
        print(f"Error generating test cases with Groq: {e}")
        # Fallback to basic test cases
        return [
            TestCase(
                input_data="1",
                expected_output="1",
                is_sample=True
            )
        ]


# ============ AI Code Suggestions ============

async def generate_code_suggestions(
    source_code: str,
    problem_statement: str,
    verdict: str,
    language: str,
    failed_details: Optional[dict] = None
) -> dict:
    """
    Generate AI suggestions for code improvement using Groq LLM.
    
    Returns:
    {
        "code_review": str,  # Comments on the code quality
        "improvements": List[str],  # Ways to improve the code
        "hints": List[str],  # Hints to solve the problem if failed
        "best_practices": List[str],  # Best practices recommendations
        "complexity_analysis": str,  # Time/space complexity analysis
    }
    """
    
    failure_context = ""
    if failed_details:
        failure_context = f"""
The solution FAILED with the following details:
- Input that failed: {failed_details.get('input', 'N/A')}
- Expected output: {failed_details.get('expected', 'N/A')}
- Actual output: {failed_details.get('actual', 'N/A')}
- Error (if any): {failed_details.get('error', 'None')}
"""
    
    prompt = f"""You are an expert programming mentor and code reviewer. Analyze the following code submission and provide helpful feedback.

PROBLEM STATEMENT:
{problem_statement[:2000]}  # Truncate if too long

SUBMITTED CODE ({language}):
```{language}
{source_code}
```

VERDICT: {verdict}
{failure_context}

Provide a detailed analysis in the following JSON format:
{{
    "code_review": "A 2-3 sentence review of the code quality, readability, and approach",
    "improvements": [
        "Specific improvement suggestion 1",
        "Specific improvement suggestion 2",
        "Specific improvement suggestion 3"
    ],
    "hints": [
        "Hint 1 to help solve the problem (if failed) or optimize (if passed)",
        "Hint 2 with algorithmic insight",
        "Hint 3 about edge cases to consider"
    ],
    "best_practices": [
        "Best practice recommendation 1",
        "Best practice recommendation 2"
    ],
    "complexity_analysis": "Time complexity: O(?), Space complexity: O(?). Brief explanation."
}}

CRITICAL: Return ONLY valid JSON, no markdown formatting, no additional text.
"""

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert programming mentor. Always return valid JSON responses with helpful, constructive feedback."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.5,
            max_tokens=2000
        )
        
        import json
        content = response.choices[0].message.content.strip()
        
        # Remove markdown code blocks if present
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
            content = content.strip()
        
        suggestions = json.loads(content)
        return suggestions
        
    except Exception as e:
        print(f"Error generating AI suggestions: {e}")
        # Return basic fallback suggestions
        return {
            "code_review": "Unable to generate detailed review at this time.",
            "improvements": ["Consider reviewing your approach", "Check edge cases"],
            "hints": ["Review the problem constraints carefully", "Test with sample inputs"],
            "best_practices": ["Use meaningful variable names", "Add comments for complex logic"],
            "complexity_analysis": "Analysis unavailable"
        }


# ============ Code Execution Engine ============

class CodeExecutor:
    """
    Secure sandboxed code execution with limits.
    """
    
    # Execution limits
    TIME_LIMIT_SECONDS = 5
    MEMORY_LIMIT_MB = 256
    
    @staticmethod
    async def execute_python(code: str, input_data: str) -> dict:
        """
        Execute Python code with input and return output.
        
        Returns:
        {
            "output": str,
            "execution_time_ms": int,
            "memory_kb": int,
            "error": Optional[str],
            "status": "success" | "timeout" | "error"
        }
        """
        
        # Security: Remove dangerous imports
        forbidden_keywords = [
            "import os", "import sys", "import subprocess", "import shutil",
            "import requests", "import urllib", "import socket", "import pickle",
            "__import__", "eval", "exec", "compile", "open(", "file("
        ]
        
        for keyword in forbidden_keywords:
            if keyword in code.lower():
                return {
                    "output": "",
                    "execution_time_ms": 0,
                    "memory_kb": 0,
                    "error": f"Forbidden operation detected: {keyword}",
                    "status": "error"
                }
        
        # Create temporary file for code
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(code)
            code_file = f.name
        
        try:
            # Create temporary file for input
            with tempfile.NamedTemporaryFile(mode='w', delete=False) as f:
                f.write(input_data)
                input_file = f.name
            
            # Execute with timeout
            start_time = time.time()
            
            try:
                # Run in subprocess with resource limits
                with open(input_file, 'r') as stdin:
                    process = subprocess.run(
                        ["python", code_file],
                        stdin=stdin,
                        capture_output=True,
                        text=True,
                        timeout=CodeExecutor.TIME_LIMIT_SECONDS,
                        env={"PYTHONPATH": ""}  # Clean environment
                    )
                
                execution_time_ms = int((time.time() - start_time) * 1000)
                
                if process.returncode != 0:
                    return {
                        "output": "",
                        "execution_time_ms": execution_time_ms,
                        "memory_kb": 0,
                        "error": process.stderr[:1000],  # Limit error message
                        "status": "error"
                    }
                
                return {
                    "output": process.stdout.strip(),
                    "execution_time_ms": execution_time_ms,
                    "memory_kb": 1024,  # Simplified - would need psutil for real measurement
                    "error": None,
                    "status": "success"
                }
            
            except subprocess.TimeoutExpired:
                return {
                    "output": "",
                    "execution_time_ms": CodeExecutor.TIME_LIMIT_SECONDS * 1000,
                    "memory_kb": 0,
                    "error": "Time Limit Exceeded",
                    "status": "timeout"
                }
        
        finally:
            # Cleanup
            try:
                os.unlink(code_file)
                os.unlink(input_file)
            except:
                pass


# ============ Verdict Evaluation ============

def evaluate_verdict(test_results: List[dict]) -> tuple[str, str]:
    """
    Determine verdict based on test results.
    
    Returns: (verdict_code, verdict_message)
    """
    
    if not test_results:
        return ("CE", "No test cases to evaluate")
    
    total_tests = len(test_results)
    passed_tests = sum(1 for r in test_results if r["passed"])
    
    # Check for runtime errors
    if any(r.get("error") and "error" in r["status"] for r in test_results):
        return ("RE", "Runtime Error")
    
    # Check for time limit exceeded
    if any(r.get("status") == "timeout" for r in test_results):
        return ("TLE", "Time Limit Exceeded")
    
    # Check if all passed
    if passed_tests == total_tests:
        return ("AC", f"Accepted ({passed_tests}/{total_tests} test cases passed)")
    
    # Wrong answer
    failed_test = next((i + 1 for i, r in enumerate(test_results) if not r["passed"]), None)
    return ("WA", f"Wrong Answer on test {failed_test} ({passed_tests}/{total_tests} passed)")


# ============ Routes ============

@router.post("/submit", response_model=SubmissionResponse)
async def submit_code(
    request: SubmitCodeRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Submit code for a practice problem.
    
    Flow:
    1. Generate test cases using Groq LLM
    2. Execute code against test cases
    3. Evaluate verdict
    4. Save submission
    5. Update user stats
    """
    
    # Step 1: Generate test cases
    print(f"Generating test cases for problem {request.problem_id}...")
    test_cases = await generate_test_cases_with_groq(
        request.problem_statement,
        request.problem_constraints,
        num_test_cases=8
    )
    
    if not test_cases:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate test cases"
        )
    
    # Step 2: Execute code against test cases
    print(f"Executing code against {len(test_cases)} test cases...")
    test_results = []
    executor = CodeExecutor()
    
    total_execution_time = 0
    max_memory = 0
    
    for i, test_case in enumerate(test_cases):
        result = await executor.execute_python(
            request.source_code,
            test_case.input_data
        )
        
        actual_output = result.get("output", "").strip()
        expected_output = test_case.expected_output.strip()
        
        passed = (
            result["status"] == "success" and
            actual_output == expected_output
        )
        
        test_results.append({
            "test_number": i + 1,
            "input_data": test_case.input_data,
            "expected_output": expected_output,
            "actual_output": actual_output if result["status"] == "success" else None,
            "passed": passed,
            "execution_time_ms": result["execution_time_ms"],
            "error_message": result.get("error"),
            "status": result["status"]
        })
        
        total_execution_time += result["execution_time_ms"]
        max_memory = max(max_memory, result["memory_kb"])
        
        # Store execution stats in test case
        test_case.execution_time_ms = result["execution_time_ms"]
        test_case.memory_kb = result["memory_kb"]
    
    # Step 3: Evaluate verdict
    verdict, verdict_message = evaluate_verdict(test_results)
    passed_count = sum(1 for r in test_results if r["passed"])
    
    # Find first failed test
    failed_test = next((r for r in test_results if not r["passed"]), None)
    
    # Step 3.5: Generate AI suggestions
    print("Generating AI code suggestions...")
    failed_details_for_ai = None
    if failed_test:
        failed_details_for_ai = {
            "input": failed_test["input_data"],
            "expected": failed_test["expected_output"],
            "actual": failed_test.get("actual_output"),
            "error": failed_test.get("error_message")
        }
    
    ai_suggestions = await generate_code_suggestions(
        source_code=request.source_code,
        problem_statement=request.problem_statement,
        verdict=verdict,
        language=request.language,
        failed_details=failed_details_for_ai
    )
    
    # Step 4: Save submission
    submission = Submission(
        user_id=str(current_user.id),
        problem_id=request.problem_id,
        problem_name=request.problem_name,
        problem_rating=request.problem_rating,
        source_code=request.source_code,
        language=request.language,
        test_cases=test_cases,
        total_test_cases=len(test_cases),
        passed_test_cases=passed_count,
        verdict=verdict,
        verdict_message=verdict_message,
        execution_time_ms=total_execution_time,
        memory_used_kb=max_memory,
        failed_on_test=failed_test["test_number"] if failed_test else None,
        failed_input=failed_test["input_data"] if failed_test else None,
        failed_expected=failed_test["expected_output"] if failed_test else None,
        failed_actual=failed_test.get("actual_output") if failed_test else None
    )
    await submission.insert()
    
    # Step 5: Update user problem status
    status_record = await UserProblemStatus.find_one({
        "user_id": str(current_user.id),
        "problem_id": request.problem_id
    })
    
    if not status_record:
        status_record = UserProblemStatus(
            user_id=str(current_user.id),
            problem_id=request.problem_id,
            attempts=0
        )
    
    status_record.attempts += 1
    status_record.last_attempt_at = datetime.utcnow()
    
    if verdict == "AC" and not status_record.is_solved:
        status_record.is_solved = True
        status_record.solved_at = datetime.utcnow()
        status_record.best_submission_id = str(submission.id)
        status_record.best_execution_time_ms = total_execution_time
        
        # Award XP and coins
        xp_reward = 50 + (request.problem_rating or 1000) // 20
        coin_reward = 10 + (request.problem_rating or 1000) // 100
        
        current_user.xp += xp_reward
        current_user.coins += coin_reward
        await current_user.save()
    
    await status_record.save()
    
    # Return response
    return SubmissionResponse(
        submission_id=str(submission.id),
        verdict=verdict,
        verdict_message=verdict_message,
        passed_tests=passed_count,
        total_tests=len(test_cases),
        execution_time_ms=total_execution_time,
        memory_used_kb=max_memory,
        test_results=[
            TestCaseResult(**r) for r in test_results
        ],
        failed_on_test=failed_test["test_number"] if failed_test else None,
        failed_details={
            "input": failed_test["input_data"],
            "expected": failed_test["expected_output"],
            "actual": failed_test.get("actual_output"),
            "error": failed_test.get("error_message")
        } if failed_test else None,
        ai_suggestions=ai_suggestions
    )


@router.get("/submissions/my")
async def get_my_submissions(
    page: int = 1,
    limit: int = 20,
    problem_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get current user's submission history."""
    
    query = {"user_id": str(current_user.id)}
    if problem_id:
        query["problem_id"] = problem_id
    
    skip = (page - 1) * limit
    
    submissions = await Submission.find(query).sort("-submitted_at").skip(skip).limit(limit).to_list()
    total = await Submission.find(query).count()
    
    return {
        "submissions": [
            {
                "id": str(s.id),
                "problem_id": s.problem_id,
                "problem_name": s.problem_name,
                "problem_rating": s.problem_rating,
                "verdict": s.verdict,
                "verdict_message": s.verdict_message,
                "passed_tests": s.passed_test_cases,
                "total_tests": s.total_test_cases,
                "execution_time_ms": s.execution_time_ms,
                "submitted_at": s.submitted_at,
                "language": s.language
            }
            for s in submissions
        ],
        "total": total,
        "page": page,
        "limit": limit
    }


@router.get("/submissions/{submission_id}")
async def get_submission_details(
    submission_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get detailed submission information including test cases."""
    
    submission = await Submission.get(submission_id)
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    # Only allow viewing own submissions
    if submission.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return {
        "id": str(submission.id),
        "problem_id": submission.problem_id,
        "problem_name": submission.problem_name,
        "problem_rating": submission.problem_rating,
        "source_code": submission.source_code,
        "language": submission.language,
        "verdict": submission.verdict,
        "verdict_message": submission.verdict_message,
        "passed_tests": submission.passed_test_cases,
        "total_tests": submission.total_test_cases,
        "execution_time_ms": submission.execution_time_ms,
        "memory_used_kb": submission.memory_used_kb,
        "submitted_at": submission.submitted_at,
        "failed_on_test": submission.failed_on_test,
        "failed_details": {
            "input": submission.failed_input,
            "expected": submission.failed_expected,
            "actual": submission.failed_actual
        } if submission.failed_on_test else None,
        "sample_test_cases": [
            {
                "input": tc.input_data,
                "expected_output": tc.expected_output,
                "execution_time_ms": tc.execution_time_ms
            }
            for tc in submission.test_cases[:2]  # Show only first 2 sample cases
        ]
    }


@router.get("/problems/{problem_id}/status")
async def get_problem_status(
    problem_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get user's status on a specific problem."""
    
    status_record = await UserProblemStatus.find_one({
        "user_id": str(current_user.id),
        "problem_id": problem_id
    })
    
    if not status_record:
        return {
            "is_solved": False,
            "attempts": 0,
            "first_attempt_at": None,
            "solved_at": None
        }
    
    return {
        "is_solved": status_record.is_solved,
        "attempts": status_record.attempts,
        "first_attempt_at": status_record.first_attempt_at,
        "solved_at": status_record.solved_at,
        "best_execution_time_ms": status_record.best_execution_time_ms
    }


@router.get("/stats/overview")
async def get_practice_stats(
    current_user: User = Depends(get_current_user)
):
    """Get overall practice statistics for the user."""
    
    # Count solved problems
    solved_count = await UserProblemStatus.find({
        "user_id": str(current_user.id),
        "is_solved": True
    }).count()
    
    # Count total attempts
    attempted_count = await UserProblemStatus.find({
        "user_id": str(current_user.id)
    }).count()
    
    # Total submissions
    total_submissions = await Submission.find({
        "user_id": str(current_user.id)
    }).count()
    
    # AC submissions
    ac_submissions = await Submission.find({
        "user_id": str(current_user.id),
        "verdict": "AC"
    }).count()
    
    # Get rating distribution of solved problems
    solved_statuses = await UserProblemStatus.find({
        "user_id": str(current_user.id),
        "is_solved": True
    }).to_list()
    
    # Get recent AC submissions to find ratings
    recent_ac = await Submission.find({
        "user_id": str(current_user.id),
        "verdict": "AC"
    }).sort("-submitted_at").limit(100).to_list()
    
    rating_distribution = {"<1200": 0, "1200-1400": 0, "1400-1600": 0, "1600-1900": 0, "1900+": 0}
    for sub in recent_ac:
        if sub.problem_rating:
            if sub.problem_rating < 1200:
                rating_distribution["<1200"] += 1
            elif sub.problem_rating < 1400:
                rating_distribution["1200-1400"] += 1
            elif sub.problem_rating < 1600:
                rating_distribution["1400-1600"] += 1
            elif sub.problem_rating < 1900:
                rating_distribution["1600-1900"] += 1
            else:
                rating_distribution["1900+"] += 1
    
    return {
        "solved_problems": solved_count,
        "attempted_problems": attempted_count,
        "total_submissions": total_submissions,
        "accepted_submissions": ac_submissions,
        "acceptance_rate": round((ac_submissions / total_submissions * 100) if total_submissions > 0 else 0, 2),
        "rating_distribution": rating_distribution
    }
