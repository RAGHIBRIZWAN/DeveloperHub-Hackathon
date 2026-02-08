"""
Code Execution API Routes
========================
Local subprocess-based code execution.
"""

from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel

from app.core.security import get_current_user
from app.models.challenge import Challenge, Submission, TestCase
from app.services.code_executor import execute_code, SUPPORTED_LANGUAGES

router = APIRouter()


# ============ Supported Languages ============
LANGUAGE_ALIASES = {
    "python", "python3", "cpp", "c++",
    "javascript", "js", "c", "java",
}


# ============ Schemas ============

class RunCodeRequest(BaseModel):
    """Request to run code."""
    code: str
    language: str
    stdin: Optional[str] = ""


class SubmitCodeRequest(BaseModel):
    """Request to submit code for a challenge."""
    code: str
    language: str


class CodeExecutionResult(BaseModel):
    """Code execution result."""
    status: str
    stdout: Optional[str] = None
    stderr: Optional[str] = None
    compile_output: Optional[str] = None
    time: Optional[str] = None
    memory: Optional[int] = None
    exit_code: Optional[int] = None


# ============ Routes ============

@router.post("/run", response_model=CodeExecutionResult)
async def run_code(
    request: RunCodeRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Run code and return output.
    This is for free code execution (not challenge submission).
    """
    # Validate language
    language = request.language.lower()
    if language not in LANGUAGE_ALIASES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported language: {request.language}. Supported: python, cpp, javascript, c, java"
        )
    
    try:
        result = await execute_code(
            code=request.code,
            language=language,
            stdin=request.stdin or "",
            timeout=10.0,
        )
        
        return CodeExecutionResult(
            status=result["status"],
            stdout=result.get("stdout"),
            stderr=result.get("stderr"),
            compile_output=result.get("compile_output"),
            time=result.get("time"),
            memory=result.get("memory"),
            exit_code=result.get("exit_code"),
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Code execution failed: {str(e)}"
        )


@router.post("/challenges/{challenge_slug}/submit")
async def submit_challenge(
    challenge_slug: str,
    request: SubmitCodeRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Submit code for a challenge.
    Runs against all test cases including hidden ones.
    """
    # Get challenge
    challenge = await Challenge.find_one(Challenge.slug == challenge_slug)
    
    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found"
        )
    
    # Validate language
    language = request.language.lower()
    if language not in LANGUAGE_ALIASES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported language"
        )
    
    if language not in [l.lower() for l in challenge.supported_languages]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Language not supported for this challenge"
        )
    
    # Create submission record
    submission = Submission(
        user_id=current_user["user_id"],
        challenge_id=str(challenge.id),
        code=request.code,
        language=language,
        status="running",
        total_tests=len(challenge.test_cases)
    )
    await submission.insert()
    
    try:
        test_results = []
        passed_tests = 0
        total_points = 0
        max_time = 0.0
        max_memory = 0
        
        # Run against each test case
        for i, test_case in enumerate(challenge.test_cases):
            result = await execute_code(
                code=request.code,
                language=language,
                stdin=test_case.input,
                timeout=challenge.time_limit_seconds,
            )
            
            status_id = result.get("status_id", 0)
            actual_output = (result.get("stdout") or "").strip()
            expected_output = (test_case.expected_output or "").strip()
            passed = status_id == 3 and actual_output == expected_output
            
            if passed:
                passed_tests += 1
                total_points += test_case.points
            
            # Track max resources
            exec_time = float(result.get("time", 0) or 0)
            if exec_time:
                max_time = max(max_time, exec_time)
            mem = result.get("memory", 0) or 0
            if mem:
                max_memory = max(max_memory, mem)
            
            test_result = {
                "test_case_index": i,
                "passed": passed,
                "status": result["status"],
                "time_ms": exec_time * 1000 if exec_time else None,
                "memory_kb": mem
            }
            
            # Only include actual output for visible test cases
            if not test_case.is_hidden:
                test_result["actual_output"] = actual_output
                test_result["expected_output"] = test_case.expected_output
                test_result["input"] = test_case.input
            
            test_results.append(test_result)
        
        # Determine overall status
        if passed_tests == len(challenge.test_cases):
            final_status = "accepted"
        elif passed_tests > 0:
            final_status = "partial"
        else:
            # Check first test result for specific error
            first_result_status = test_results[0].get("status", "wrong_answer")
            if "Error" in first_result_status:
                final_status = first_result_status.lower().replace(" ", "_")
            else:
                final_status = "wrong_answer"
        
        # Update submission
        submission.status = final_status
        submission.test_results = test_results
        submission.passed_tests = passed_tests
        submission.score = total_points
        submission.execution_time_ms = max_time * 1000
        submission.memory_used_kb = max_memory
        submission.judged_at = datetime.utcnow()
        await submission.save()
        
        # Update challenge stats
        challenge.total_submissions += 1
        if final_status == "accepted":
            challenge.accepted_submissions += 1
        await challenge.save()
        
        return {
            "submission_id": str(submission.id),
            "status": final_status,
            "passed_tests": passed_tests,
            "total_tests": len(challenge.test_cases),
            "score": total_points,
            "max_score": sum(tc.points for tc in challenge.test_cases),
            "execution_time_ms": submission.execution_time_ms,
            "memory_used_kb": submission.memory_used_kb,
            "test_results": [
                {
                    **tr,
                    "is_hidden": challenge.test_cases[tr["test_case_index"]].is_hidden
                }
                for tr in test_results
            ]
        }
        
    except Exception as e:
        submission.status = "error"
        submission.error_message = str(e)
        await submission.save()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Submission failed: {str(e)}"
        )


@router.get("/challenges/{challenge_slug}")
async def get_challenge(
    challenge_slug: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get challenge details.
    """
    challenge = await Challenge.find_one(Challenge.slug == challenge_slug)
    
    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found"
        )
    
    # Get user's submissions for this challenge
    user_submissions = await Submission.find({
        "user_id": current_user["user_id"],
        "challenge_id": str(challenge.id)
    }).sort("-submitted_at").limit(10).to_list()
    
    return {
        "challenge": {
            "id": str(challenge.id),
            "title": challenge.title,
            "title_ur": challenge.title_ur,
            "slug": challenge.slug,
            "description": challenge.description,
            "problem_statement": challenge.problem_statement,
            "problem_statement_ur": challenge.problem_statement_ur,
            "input_format": challenge.input_format,
            "output_format": challenge.output_format,
            "constraints": challenge.constraints,
            "sample_input": challenge.sample_input,
            "sample_output": challenge.sample_output,
            "explanation": challenge.explanation,
            "supported_languages": challenge.supported_languages,
            "starter_code": challenge.starter_code,
            "difficulty": challenge.difficulty,
            "total_points": challenge.total_points,
            "time_limit_seconds": challenge.time_limit_seconds,
            "memory_limit_mb": challenge.memory_limit_mb,
            "xp_reward": challenge.xp_reward,
            "coin_reward": challenge.coin_reward,
            "acceptance_rate": challenge.acceptance_rate
        },
        "user_submissions": [
            {
                "id": str(s.id),
                "status": s.status,
                "language": s.language,
                "score": s.score,
                "passed_tests": s.passed_tests,
                "total_tests": s.total_tests,
                "submitted_at": s.submitted_at
            }
            for s in user_submissions
        ]
    }


@router.get("/submissions/{submission_id}")
async def get_submission(
    submission_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get submission details.
    """
    submission = await Submission.get(submission_id)
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    # Only allow user to see their own submissions
    if submission.user_id != current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return {
        "id": str(submission.id),
        "challenge_id": submission.challenge_id,
        "code": submission.code,
        "language": submission.language,
        "status": submission.status,
        "test_results": submission.test_results,
        "passed_tests": submission.passed_tests,
        "total_tests": submission.total_tests,
        "score": submission.score,
        "execution_time_ms": submission.execution_time_ms,
        "memory_used_kb": submission.memory_used_kb,
        "error_message": submission.error_message,
        "submitted_at": submission.submitted_at,
        "judged_at": submission.judged_at
    }
