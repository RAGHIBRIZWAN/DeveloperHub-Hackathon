"""
Judge0 Service
==============
Service for interacting with self-hosted Judge0 instance for code execution.
"""

import httpx
import asyncio
import base64
from typing import Optional, Dict, List, Any
from app.core.config import settings


# Language ID mapping for Judge0
LANGUAGE_IDS = {
    "python": 71,      # Python (3.8.1)
    "python3": 71,
    "cpp": 54,         # C++ (GCC 9.2.0)
    "c++": 54,
    "javascript": 63,  # JavaScript (Node.js 12.14.0)
    "js": 63,
    "java": 62,        # Java (OpenJDK 13.0.1)
    "c": 50,           # C (GCC 9.2.0)
    "ruby": 72,        # Ruby (2.7.0)
    "go": 60,          # Go (1.13.5)
    "rust": 73,        # Rust (1.40.0)
    "typescript": 74,  # TypeScript (3.7.4)
}


class Judge0Service:
    """
    Service class for Judge0 API interactions.
    Supports both self-hosted and RapidAPI versions.
    """
    
    def __init__(self):
        self.use_self_hosted = settings.USE_SELF_HOSTED_JUDGE0
        
        if self.use_self_hosted:
            self.base_url = settings.JUDGE0_URL
            self.headers = {"Content-Type": "application/json"}
        else:
            self.base_url = settings.JUDGE0_API_URL
            self.headers = {
                "Content-Type": "application/json",
                "X-RapidAPI-Key": settings.JUDGE0_API_KEY,
                "X-RapidAPI-Host": settings.JUDGE0_API_HOST,
            }
    
    def _encode_base64(self, text: str) -> str:
        """Encode text to base64."""
        return base64.b64encode(text.encode()).decode()
    
    def _decode_base64(self, encoded: str) -> str:
        """Decode base64 text."""
        if not encoded:
            return ""
        try:
            return base64.b64decode(encoded).decode()
        except Exception:
            return encoded
    
    def get_language_id(self, language: str) -> int:
        """Get Judge0 language ID from language name."""
        return LANGUAGE_IDS.get(language.lower(), 71)  # Default to Python
    
    async def get_languages(self) -> List[Dict]:
        """Get list of available languages."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/languages",
                headers=self.headers,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
    
    async def get_system_info(self) -> Dict:
        """Get Judge0 system information."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/system_info",
                headers=self.headers,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
    
    async def submit_code(
        self,
        source_code: str,
        language: str,
        stdin: str = "",
        expected_output: Optional[str] = None,
        cpu_time_limit: float = 5.0,
        memory_limit: int = 128000,
        wait: bool = True
    ) -> Dict[str, Any]:
        """
        Submit code for execution.
        
        Args:
            source_code: The code to execute
            language: Programming language (python, cpp, javascript, etc.)
            stdin: Input for the program
            expected_output: Expected output for verification
            cpu_time_limit: CPU time limit in seconds
            memory_limit: Memory limit in KB
            wait: Whether to wait for result
        
        Returns:
            Submission result with status, output, errors, etc.
        """
        language_id = self.get_language_id(language)
        
        # Prepare submission data
        submission_data = {
            "source_code": self._encode_base64(source_code),
            "language_id": language_id,
            "stdin": self._encode_base64(stdin) if stdin else "",
            "cpu_time_limit": cpu_time_limit,
            "memory_limit": memory_limit,
        }
        
        if expected_output:
            submission_data["expected_output"] = self._encode_base64(expected_output)
        
        async with httpx.AsyncClient() as client:
            # Create submission
            params = {"base64_encoded": "true"}
            if wait:
                params["wait"] = "true"
            
            response = await client.post(
                f"{self.base_url}/submissions",
                json=submission_data,
                headers=self.headers,
                params=params,
                timeout=60.0
            )
            response.raise_for_status()
            result = response.json()
            
            # If not waiting, poll for result
            if not wait and "token" in result:
                result = await self._poll_submission(result["token"])
            
            return self._process_result(result)
    
    async def _poll_submission(self, token: str, max_attempts: int = 20) -> Dict:
        """Poll for submission result."""
        async with httpx.AsyncClient() as client:
            for _ in range(max_attempts):
                response = await client.get(
                    f"{self.base_url}/submissions/{token}",
                    headers=self.headers,
                    params={"base64_encoded": "true"},
                    timeout=30.0
                )
                response.raise_for_status()
                result = response.json()
                
                # Check if processing is complete
                status_id = result.get("status", {}).get("id", 0)
                if status_id not in [1, 2]:  # Not "In Queue" or "Processing"
                    return result
                
                await asyncio.sleep(0.5)
            
            return result
    
    def _process_result(self, result: Dict) -> Dict[str, Any]:
        """Process and decode Judge0 result."""
        status = result.get("status", {})
        
        return {
            "token": result.get("token"),
            "status_id": status.get("id"),
            "status": status.get("description", "Unknown"),
            "stdout": self._decode_base64(result.get("stdout", "")),
            "stderr": self._decode_base64(result.get("stderr", "")),
            "compile_output": self._decode_base64(result.get("compile_output", "")),
            "message": result.get("message", ""),
            "time": result.get("time"),
            "memory": result.get("memory"),
            "exit_code": result.get("exit_code"),
        }
    
    async def run_with_test_cases(
        self,
        source_code: str,
        language: str,
        test_cases: List[Dict[str, str]],
        cpu_time_limit: float = 5.0,
        memory_limit: int = 128000
    ) -> Dict[str, Any]:
        """
        Run code against multiple test cases.
        
        Args:
            source_code: The code to execute
            language: Programming language
            test_cases: List of {"input": ..., "expected_output": ...}
            cpu_time_limit: CPU time limit per test case
            memory_limit: Memory limit in KB
        
        Returns:
            Results for all test cases with pass/fail status
        """
        results = []
        passed = 0
        total = len(test_cases)
        
        for i, test_case in enumerate(test_cases):
            result = await self.submit_code(
                source_code=source_code,
                language=language,
                stdin=test_case.get("input", ""),
                expected_output=test_case.get("expected_output"),
                cpu_time_limit=cpu_time_limit,
                memory_limit=memory_limit
            )
            
            # Check if output matches expected
            actual_output = result["stdout"].strip()
            expected_output = test_case.get("expected_output", "").strip()
            is_passed = actual_output == expected_output and result["status_id"] == 3
            
            if is_passed:
                passed += 1
            
            results.append({
                "test_case": i + 1,
                "passed": is_passed,
                "status": result["status"],
                "actual_output": actual_output,
                "expected_output": expected_output,
                "time": result["time"],
                "memory": result["memory"],
                "error": result["stderr"] or result["compile_output"],
            })
        
        return {
            "total_test_cases": total,
            "passed": passed,
            "failed": total - passed,
            "success_rate": (passed / total) * 100 if total > 0 else 0,
            "all_passed": passed == total,
            "results": results,
        }
    
    async def verify_solution(
        self,
        source_code: str,
        language: str,
        hidden_test_cases: List[Dict[str, str]],
        cpu_time_limit: float = 5.0,
        memory_limit: int = 128000
    ) -> Dict[str, Any]:
        """
        Verify solution against hidden test cases (for challenges/contests).
        
        Returns minimal information to prevent test case leakage.
        """
        result = await self.run_with_test_cases(
            source_code=source_code,
            language=language,
            test_cases=hidden_test_cases,
            cpu_time_limit=cpu_time_limit,
            memory_limit=memory_limit
        )
        
        # Return only pass/fail info for hidden test cases
        return {
            "total_test_cases": result["total_test_cases"],
            "passed": result["passed"],
            "all_passed": result["all_passed"],
            "success_rate": result["success_rate"],
            # Don't expose actual test case details
            "verdict": "Accepted" if result["all_passed"] else f"Wrong Answer ({result['passed']}/{result['total_test_cases']} passed)",
        }


# Global instance
judge0_service = Judge0Service()
