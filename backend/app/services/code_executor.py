"""
Local Code Executor
===================
Executes code locally using subprocess.
Supports Python, C++, and JavaScript.
Replaces Judge0 API integration.
"""

import asyncio
import subprocess
import tempfile
import os
import time
import shutil
from pathlib import Path
from typing import Optional


# Language configuration
SUPPORTED_LANGUAGES = {
    "python", "python3", "py",
    "cpp", "c++",
    "javascript", "js",
    "c",
    "java",
}

# Normalize language aliases
def _normalize_lang(language: str) -> str:
    lang = language.lower().strip()
    if lang in ("python", "python3", "py"):
        return "python"
    if lang in ("cpp", "c++"):
        return "cpp"
    if lang in ("javascript", "js"):
        return "javascript"
    if lang == "c":
        return "c"
    if lang == "java":
        return "java"
    return lang


async def execute_code(
    code: str,
    language: str,
    stdin: str = "",
    timeout: float = 10.0,
) -> dict:
    """
    Execute code locally via subprocess and return the result.
    
    Returns dict with keys:
        - stdout: str
        - stderr: str
        - compile_output: str or None
        - time: str (seconds)
        - memory: int (KB, approximate)
        - exit_code: int
        - status: str ("Accepted", "Wrong Answer", "Time Limit Exceeded",
                        "Compilation Error", "Runtime Error")
        - status_id: int (mirrors Judge0 IDs for compatibility)
    """
    lang = _normalize_lang(language)
    
    if lang not in ("python", "cpp", "javascript", "c", "java"):
        return {
            "stdout": "",
            "stderr": f"Unsupported language: {language}",
            "compile_output": None,
            "time": "0",
            "memory": 0,
            "exit_code": 1,
            "status": "Runtime Error",
            "status_id": 12,
        }
    
    # Run in a thread to avoid blocking the event loop
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None, _execute_sync, code, lang, stdin, timeout
    )


def _execute_sync(code: str, lang: str, stdin: str, timeout: float) -> dict:
    """Synchronous code execution."""
    tmpdir = tempfile.mkdtemp(prefix="codehub_")
    
    try:
        if lang == "python":
            return _run_python(code, stdin, timeout, tmpdir)
        elif lang == "cpp":
            return _run_cpp(code, stdin, timeout, tmpdir)
        elif lang == "c":
            return _run_c(code, stdin, timeout, tmpdir)
        elif lang == "javascript":
            return _run_javascript(code, stdin, timeout, tmpdir)
        elif lang == "java":
            return _run_java(code, stdin, timeout, tmpdir)
        else:
            return _error_result(f"Unsupported language: {lang}")
    finally:
        # Clean up temp directory
        try:
            shutil.rmtree(tmpdir, ignore_errors=True)
        except Exception:
            pass


def _run_python(code: str, stdin: str, timeout: float, tmpdir: str) -> dict:
    src = os.path.join(tmpdir, "solution.py")
    with open(src, "w", encoding="utf-8") as f:
        f.write(code)
    
    return _run_process(["python", src], stdin, timeout)


def _run_cpp(code: str, stdin: str, timeout: float, tmpdir: str) -> dict:
    src = os.path.join(tmpdir, "solution.cpp")
    exe = os.path.join(tmpdir, "solution.exe" if os.name == "nt" else "solution")
    
    with open(src, "w", encoding="utf-8") as f:
        f.write(code)
    
    # Compile
    compile_result = _run_process(
        ["g++", "-o", exe, src, "-std=c++17", "-O2"],
        "", timeout=30.0
    )
    
    if compile_result["exit_code"] != 0:
        return {
            "stdout": "",
            "stderr": "",
            "compile_output": compile_result["stderr"] or compile_result["stdout"],
            "time": "0",
            "memory": 0,
            "exit_code": 1,
            "status": "Compilation Error",
            "status_id": 6,
        }
    
    # Run
    return _run_process([exe], stdin, timeout)


def _run_c(code: str, stdin: str, timeout: float, tmpdir: str) -> dict:
    src = os.path.join(tmpdir, "solution.c")
    exe = os.path.join(tmpdir, "solution.exe" if os.name == "nt" else "solution")
    
    with open(src, "w", encoding="utf-8") as f:
        f.write(code)
    
    # Compile
    compile_result = _run_process(
        ["gcc", "-o", exe, src, "-O2"],
        "", timeout=30.0
    )
    
    if compile_result["exit_code"] != 0:
        return {
            "stdout": "",
            "stderr": "",
            "compile_output": compile_result["stderr"] or compile_result["stdout"],
            "time": "0",
            "memory": 0,
            "exit_code": 1,
            "status": "Compilation Error",
            "status_id": 6,
        }
    
    return _run_process([exe], stdin, timeout)


def _run_javascript(code: str, stdin: str, timeout: float, tmpdir: str) -> dict:
    src = os.path.join(tmpdir, "solution.js")
    with open(src, "w", encoding="utf-8") as f:
        f.write(code)
    
    return _run_process(["node", src], stdin, timeout)


def _run_java(code: str, stdin: str, timeout: float, tmpdir: str) -> dict:
    src = os.path.join(tmpdir, "Main.java")
    with open(src, "w", encoding="utf-8") as f:
        f.write(code)
    
    # Compile
    compile_result = _run_process(["javac", src], "", timeout=30.0)
    
    if compile_result["exit_code"] != 0:
        return {
            "stdout": "",
            "stderr": "",
            "compile_output": compile_result["stderr"] or compile_result["stdout"],
            "time": "0",
            "memory": 0,
            "exit_code": 1,
            "status": "Compilation Error",
            "status_id": 6,
        }
    
    return _run_process(["java", "-cp", tmpdir, "Main"], stdin, timeout)


def _run_process(cmd: list, stdin: str, timeout: float) -> dict:
    """Run a subprocess with timeout and capture output."""
    start_time = time.time()
    
    try:
        result = subprocess.run(
            cmd,
            input=stdin,
            capture_output=True,
            text=True,
            timeout=timeout,
            env={**os.environ, "PYTHONIOENCODING": "utf-8"},
        )
        
        elapsed = time.time() - start_time
        
        status_str = "Accepted" if result.returncode == 0 else "Runtime Error"
        status_id = 3 if result.returncode == 0 else 11
        
        return {
            "stdout": result.stdout or "",
            "stderr": result.stderr or "",
            "compile_output": None,
            "time": f"{elapsed:.3f}",
            "memory": 0,
            "exit_code": result.returncode,
            "status": status_str,
            "status_id": status_id,
        }
        
    except subprocess.TimeoutExpired:
        elapsed = time.time() - start_time
        return {
            "stdout": "",
            "stderr": "Time Limit Exceeded",
            "compile_output": None,
            "time": f"{elapsed:.3f}",
            "memory": 0,
            "exit_code": -1,
            "status": "Time Limit Exceeded",
            "status_id": 5,
        }
    except FileNotFoundError as e:
        return {
            "stdout": "",
            "stderr": f"Compiler/runtime not found: {e}",
            "compile_output": None,
            "time": "0",
            "memory": 0,
            "exit_code": 1,
            "status": "Internal Error",
            "status_id": 13,
        }
    except Exception as e:
        return {
            "stdout": "",
            "stderr": str(e),
            "compile_output": None,
            "time": "0",
            "memory": 0,
            "exit_code": 1,
            "status": "Internal Error",
            "status_id": 13,
        }


def _error_result(message: str) -> dict:
    return {
        "stdout": "",
        "stderr": message,
        "compile_output": None,
        "time": "0",
        "memory": 0,
        "exit_code": 1,
        "status": "Internal Error",
        "status_id": 13,
    }
