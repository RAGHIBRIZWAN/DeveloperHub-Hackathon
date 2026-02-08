"""
Local Code Executor
===================
Executes code locally using subprocess.
Supports Python, C++, and JavaScript.
"""

import asyncio
import subprocess
import tempfile
import os
import time
import shutil


SUPPORTED_LANGUAGES = {
    "python", "python3", "py",
    "cpp", "c++",
    "javascript", "js",
    "c", "java",
}


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
        - status: str ("Accepted", "Time Limit Exceeded", etc.)
        - status_id: int (3=Accepted, 5=TLE, 6=CE, 11=RE, 13=IE)
    """
    lang = _normalize_lang(language)

    if lang not in ("python", "cpp", "javascript", "c", "java"):
        return _error_result(f"Unsupported language: {language}")

    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None, _execute_sync, code, lang, stdin, timeout
    )


def _execute_sync(code: str, lang: str, stdin: str, timeout: float) -> dict:
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
        try:
            shutil.rmtree(tmpdir, ignore_errors=True)
        except Exception:
            pass


def _run_python(code, stdin, timeout, tmpdir):
    src = os.path.join(tmpdir, "solution.py")
    with open(src, "w", encoding="utf-8") as f:
        f.write(code)
    return _run_process(["python", src], stdin, timeout)


def _run_cpp(code, stdin, timeout, tmpdir):
    src = os.path.join(tmpdir, "solution.cpp")
    exe = os.path.join(tmpdir, "solution.exe" if os.name == "nt" else "solution")
    with open(src, "w", encoding="utf-8") as f:
        f.write(code)
    cr = _run_process(["g++", "-o", exe, src, "-std=c++17", "-O2"], "", timeout=30.0)
    if cr["exit_code"] != 0:
        return {"stdout": "", "stderr": "", "compile_output": cr["stderr"] or cr["stdout"],
                "time": "0", "memory": 0, "exit_code": 1,
                "status": "Compilation Error", "status_id": 6}
    return _run_process([exe], stdin, timeout)


def _run_c(code, stdin, timeout, tmpdir):
    src = os.path.join(tmpdir, "solution.c")
    exe = os.path.join(tmpdir, "solution.exe" if os.name == "nt" else "solution")
    with open(src, "w", encoding="utf-8") as f:
        f.write(code)
    cr = _run_process(["gcc", "-o", exe, src, "-O2"], "", timeout=30.0)
    if cr["exit_code"] != 0:
        return {"stdout": "", "stderr": "", "compile_output": cr["stderr"] or cr["stdout"],
                "time": "0", "memory": 0, "exit_code": 1,
                "status": "Compilation Error", "status_id": 6}
    return _run_process([exe], stdin, timeout)


def _run_javascript(code, stdin, timeout, tmpdir):
    src = os.path.join(tmpdir, "solution.js")
    with open(src, "w", encoding="utf-8") as f:
        f.write(code)
    return _run_process(["node", src], stdin, timeout)


def _run_java(code, stdin, timeout, tmpdir):
    src = os.path.join(tmpdir, "Main.java")
    with open(src, "w", encoding="utf-8") as f:
        f.write(code)
    cr = _run_process(["javac", src], "", timeout=30.0)
    if cr["exit_code"] != 0:
        return {"stdout": "", "stderr": "", "compile_output": cr["stderr"] or cr["stdout"],
                "time": "0", "memory": 0, "exit_code": 1,
                "status": "Compilation Error", "status_id": 6}
    return _run_process(["java", "-cp", tmpdir, "Main"], stdin, timeout)


def _run_process(cmd, stdin, timeout):
    start = time.time()
    try:
        result = subprocess.run(
            cmd, input=stdin, capture_output=True, text=True,
            timeout=timeout,
            env={**os.environ, "PYTHONIOENCODING": "utf-8"},
        )
        elapsed = time.time() - start
        ok = result.returncode == 0
        return {
            "stdout": result.stdout or "",
            "stderr": result.stderr or "",
            "compile_output": None,
            "time": f"{elapsed:.3f}",
            "memory": 0,
            "exit_code": result.returncode,
            "status": "Accepted" if ok else "Runtime Error",
            "status_id": 3 if ok else 11,
        }
    except subprocess.TimeoutExpired:
        return {
            "stdout": "", "stderr": "Time Limit Exceeded", "compile_output": None,
            "time": f"{time.time() - start:.3f}", "memory": 0, "exit_code": -1,
            "status": "Time Limit Exceeded", "status_id": 5,
        }
    except FileNotFoundError as e:
        return {
            "stdout": "", "stderr": f"Compiler/runtime not found: {e}",
            "compile_output": None, "time": "0", "memory": 0, "exit_code": 1,
            "status": "Internal Error", "status_id": 13,
        }
    except Exception as e:
        return {
            "stdout": "", "stderr": str(e), "compile_output": None,
            "time": "0", "memory": 0, "exit_code": 1,
            "status": "Internal Error", "status_id": 13,
        }


def _error_result(message):
    return {
        "stdout": "", "stderr": message, "compile_output": None,
        "time": "0", "memory": 0, "exit_code": 1,
        "status": "Internal Error", "status_id": 13,
    }
