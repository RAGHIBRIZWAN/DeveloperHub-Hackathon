"""
Code Execution API Routes
========================
Judge0 integration for secure code execution.
"""

from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
import aiohttp
import base64
import asyncio

from app.core.config import settings
from app.core.security import get_current_user
from app.models.challenge import Challenge, Submission, TestCase

router = APIRouter()


# ============ Language ID Mapping for Judge0 ============
LANGUAGE_IDS = {
    "python": 71,      # Python 3.8.1
    "python3": 71,
    "cpp": 54,         # C++ (GCC 9.2.0)
    "c++": 54,
    "javascript": 63,  # JavaScript (Node.js 12.14.0)
    "js": 63,
    "c": 50,           # C (GCC 9.2.0)
    "java": 62,        # Java (OpenJDK 13.0.1)
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


# ============ Judge0 Integration ============

async def create_submission(
    code: str,
    language_id: int,
    stdin: str = "",
    expected_output: str = None,
    time_limit: float = 2.0,
    memory_limit: int = 128000
) -> str:
    """
    Create a submission on Judge0 and return the token.
    """
    url = f"{settings.JUDGE0_API_URL}/submissions"
    
    # Base64 encode the inputs
    encoded_code = base64.b64encode(code.encode()).decode()
    encoded_stdin = base64.b64encode(stdin.encode()).decode() if stdin else ""
    encoded_expected = base64.b64encode(expected_output.encode()).decode() if expected_output else None
    
    payload = {
        "source_code": encoded_code,
        "language_id": language_id,
        "stdin": encoded_stdin,
        "cpu_time_limit": time_limit,
        "memory_limit": memory_limit,
    }
    
    if encoded_expected:
        payload["expected_output"] = encoded_expected
    
    headers = {
        "Content-Type": "application/json",
        "X-RapidAPI-Key": settings.JUDGE0_API_KEY,
        "X-RapidAPI-Host": settings.JUDGE0_API_HOST
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.post(
            url,
            json=payload,
            headers=headers,
            params={"base64_encoded": "true", "wait": "false"}
        ) as response:
            if response.status != 201:
                error_text = await response.text()
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to create submission: {error_text}"
                )
            
            data = await response.json()
            return data["token"]


async def get_submission_result(token: str, max_attempts: int = 10) -> dict:
    """
    Poll Judge0 for submission result.
    """
    url = f"{settings.JUDGE0_API_URL}/submissions/{token}"
    
    headers = {
        "X-RapidAPI-Key": settings.JUDGE0_API_KEY,
        "X-RapidAPI-Host": settings.JUDGE0_API_HOST
    }
    
    async with aiohttp.ClientSession() as session:
        for attempt in range(max_attempts):
            async with session.get(
                url,
                headers=headers,
                params={"base64_encoded": "true", "fields": "*"}
            ) as response:
                if response.status != 200:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Failed to get submission result"
                    )
                
                data = await response.json()
                
                # Status 1 = In Queue, Status 2 = Processing
                if data.get("status", {}).get("id") not in [1, 2]:
                    # Decode base64 outputs
                    if data.get("stdout"):
                        data["stdout"] = base64.b64decode(data["stdout"]).decode()
                    if data.get("stderr"):
                        data["stderr"] = base64.b64decode(data["stderr"]).decode()
                    if data.get("compile_output"):
                        data["compile_output"] = base64.b64decode(data["compile_output"]).decode()
                    
                    return data
                
                await asyncio.sleep(1)  # Wait before polling again
        
        raise HTTPException(
            status_code=status.HTTP_408_REQUEST_TIMEOUT,
            detail="Submission timed out"
        )


# ============ Status Mapping ============

def get_status_description(status_id: int) -> str:
    """Map Judge0 status ID to description."""
    statuses = {
        1: "In Queue",
        2: "Processing",
        3: "Accepted",
        4: "Wrong Answer",
        5: "Time Limit Exceeded",
        6: "Compilation Error",
        7: "Runtime Error (SIGSEGV)",
        8: "Runtime Error (SIGXFSZ)",
        9: "Runtime Error (SIGFPE)",
        10: "Runtime Error (SIGABRT)",
        11: "Runtime Error (NZEC)",
        12: "Runtime Error (Other)",
        13: "Internal Error",
        14: "Exec Format Error"
    }
    return statuses.get(status_id, "Unknown")


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
    if language not in LANGUAGE_IDS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported language: {request.language}. Supported: {list(LANGUAGE_IDS.keys())}"
        )
    
    language_id = LANGUAGE_IDS[language]
    
    try:
        # Create submission
        token = await create_submission(
            code=request.code,
            language_id=language_id,
            stdin=request.stdin or ""
        )
        
        # Get result
        result = await get_submission_result(token)
        
        status_id = result.get("status", {}).get("id", 0)
        status_desc = get_status_description(status_id)
        
        return CodeExecutionResult(
            status=status_desc,
            stdout=result.get("stdout"),
            stderr=result.get("stderr"),
            compile_output=result.get("compile_output"),
            time=result.get("time"),
            memory=result.get("memory"),
            exit_code=result.get("exit_code")
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
    if language not in LANGUAGE_IDS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported language"
        )
    
    if language not in [l.lower() for l in challenge.supported_languages]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Language not supported for this challenge"
        )
    
    language_id = LANGUAGE_IDS[language]
    
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
        max_time = 0
        max_memory = 0
        
        # Run against each test case
        for i, test_case in enumerate(challenge.test_cases):
            token = await create_submission(
                code=request.code,
                language_id=language_id,
                stdin=test_case.input,
                expected_output=test_case.expected_output,
                time_limit=challenge.time_limit_seconds,
                memory_limit=challenge.memory_limit_mb * 1024
            )
            
            result = await get_submission_result(token)
            
            status_id = result.get("status", {}).get("id", 0)
            passed = status_id == 3  # 3 = Accepted
            
            if passed:
                passed_tests += 1
                total_points += test_case.points
            
            # Track max resources
            if result.get("time"):
                max_time = max(max_time, float(result.get("time", 0)))
            if result.get("memory"):
                max_memory = max(max_memory, result.get("memory", 0))
            
            test_result = {
                "test_case_index": i,
                "passed": passed,
                "status": get_status_description(status_id),
                "time_ms": float(result.get("time", 0)) * 1000 if result.get("time") else None,
                "memory_kb": result.get("memory")
            }
            
            # Only include actual output for visible test cases
            if not test_case.is_hidden:
                test_result["actual_output"] = result.get("stdout", "")
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
