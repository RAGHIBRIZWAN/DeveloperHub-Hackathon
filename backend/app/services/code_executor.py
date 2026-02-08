"""
CodeHub Code Executor
=====================
Self-contained code execution engine.
Uses the server's own Python for Python code.
Uses Piston API (free, open-source, no auth) for all languages.
Local compilers used as optimization when available.
"""

import asyncio
import subprocess
import tempfile
import os
import sys
import time
import shutil
import httpx


SUPPORTED_LANGUAGES = {
    "python", "python3", "py",
    "cpp", "c++",
    "javascript", "js",
    "c", "java",
}

# Piston API - free, open-source, no subscription needed
PISTON_API = "https://emkc.org/api/v2/piston/execute"

# Exact versions from Piston runtime list (verified working)
PISTON_LANGS = {
    "python":     {"language": "python",     "version": "3.10.0",  "file": "main.py"},
    "cpp":        {"language": "c++",        "version": "10.2.0",  "file": "main.cpp"},
    "javascript": {"language": "javascript", "version": "18.15.0", "file": "main.js"},
    "c":          {"language": "c",          "version": "10.2.0",  "file": "main.c"},
    "java":       {"language": "java",       "version": "15.0.2",  "file": "Main.java"},
}

# Cache which local compilers are available (checked once)
_local_available = {}


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


def _check_local_compiler(lang: str) -> bool:
    """Check if a local compiler/runtime is available. Result is cached."""
    if lang in _local_available:
        return _local_available[lang]

    cmds = {
        "python": [sys.executable, "--version"],
        "cpp": ["g++", "--version"],
        "javascript": ["node", "--version"],
        "c": ["gcc", "--version"],
        "java": ["javac", "-version"],
    }

    cmd = cmds.get(lang)
    if not cmd:
        _local_available[lang] = False
        return False

    try:
        r = subprocess.run(cmd, capture_output=True, timeout=3)
        available = r.returncode == 0
        _local_available[lang] = available
        return available
    except (FileNotFoundError, subprocess.TimeoutExpired, OSError):
        _local_available[lang] = False
        return False


# ─────────────────────────────────────────────────
# PUBLIC API
# ─────────────────────────────────────────────────

async def execute_code(
    code: str,
    language: str,
    stdin: str = "",
    timeout: float = 10.0,
) -> dict:
    """
    Execute code and return the result.

    Strategy:
      - Python: uses server's own interpreter (sys.executable) - always available.
      - All other languages: uses Piston API (free, no auth, verified working).

    Returns dict with: stdout, stderr, compile_output, time, memory,
                       exit_code, status, status_id
    """
    lang = _normalize_lang(language)
    if lang not in PISTON_LANGS:
        return _make_result(stderr=f"Unsupported language: {language}",
                            status="Internal Error", status_id=13)

    # Python: use server's own interpreter (always available)
    if lang == "python":
        try:
            result = await _run_local(code, lang, stdin, timeout)
            if result.get("status_id") != 13:
                return result
        except Exception:
            pass
        # Fallback to Piston if local Python somehow fails
        return await _run_piston(code, lang, stdin, timeout)

    # All other languages: always use Piston API (reliable everywhere)
    return await _run_piston(code, lang, stdin, timeout)


# ─────────────────────────────────────────────────
# PISTON API EXECUTION (works everywhere)
# ─────────────────────────────────────────────────

async def _run_piston(code: str, lang: str, stdin: str, timeout: float) -> dict:
    """Execute code via Piston API."""
    cfg = PISTON_LANGS[lang]
    payload = {
        "language": cfg["language"],
        "version": cfg["version"],
        "files": [{"name": cfg["file"], "content": code}],
        "stdin": stdin or "",
        "args": [],
        "compile_timeout": 10000,
        "run_timeout": int(timeout * 1000),
    }

    start = time.time()
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(PISTON_API, json=payload, timeout=timeout + 10)
            resp.raise_for_status()
            data = resp.json()

        elapsed = time.time() - start
        run = data.get("run", {})
        comp = data.get("compile", {})

        # Compilation error
        compile_err = comp.get("stderr", "") or ""
        if comp.get("code") and comp["code"] != 0:
            return _make_result(
                compile_output=compile_err or comp.get("stdout", ""),
                time_s=elapsed, status="Compilation Error", status_id=6
            )

        stdout = run.get("stdout", "")
        stderr = run.get("stderr", "")
        exit_code = run.get("code", 0) or 0

        if run.get("signal") == "SIGKILL":
            return _make_result(stderr="Time Limit Exceeded", time_s=elapsed,
                                status="Time Limit Exceeded", status_id=5)

        if exit_code != 0:
            return _make_result(stdout=stdout, stderr=stderr, exit_code=exit_code,
                                time_s=elapsed, status="Runtime Error", status_id=11)

        return _make_result(stdout=stdout, stderr=stderr, exit_code=0,
                            time_s=elapsed, status="Accepted", status_id=3)

    except httpx.TimeoutException:
        return _make_result(stderr="Time Limit Exceeded", time_s=timeout,
                            status="Time Limit Exceeded", status_id=5)
    except Exception as e:
        return _make_result(stderr=f"Execution failed: {e}",
                            status="Internal Error", status_id=13)


# ─────────────────────────────────────────────────
# LOCAL EXECUTION (when compilers are installed)
# ─────────────────────────────────────────────────

async def _run_local(code: str, lang: str, stdin: str, timeout: float) -> dict:
    """Execute code locally via subprocess."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None, _local_sync, code, lang, stdin, timeout
    )


def _local_sync(code: str, lang: str, stdin: str, timeout: float) -> dict:
    tmpdir = tempfile.mkdtemp(prefix="codehub_")
    try:
        if lang == "python":
            return _local_python(code, stdin, timeout, tmpdir)
        elif lang == "cpp":
            return _local_compiled(code, stdin, timeout, tmpdir,
                                   ext=".cpp",
                                   compile_cmd=lambda src, exe: ["g++", "-o", exe, src, "-std=c++17", "-O2"])
        elif lang == "c":
            return _local_compiled(code, stdin, timeout, tmpdir,
                                   ext=".c",
                                   compile_cmd=lambda src, exe: ["gcc", "-o", exe, src, "-O2"])
        elif lang == "javascript":
            return _local_interpreted(code, stdin, timeout, tmpdir,
                                      ext=".js", cmd=lambda src: ["node", src])
        elif lang == "java":
            return _local_java(code, stdin, timeout, tmpdir)
        else:
            return _make_result(stderr=f"Unsupported: {lang}",
                                status="Internal Error", status_id=13)
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


def _local_python(code, stdin, timeout, tmpdir):
    """Run Python using the server's own interpreter."""
    src = os.path.join(tmpdir, "solution.py")
    with open(src, "w", encoding="utf-8") as f:
        f.write(code)
    return _subprocess_run([sys.executable, src], stdin, timeout)


def _local_interpreted(code, stdin, timeout, tmpdir, ext, cmd):
    """Run an interpreted language (JS, etc.)."""
    src = os.path.join(tmpdir, f"solution{ext}")
    with open(src, "w", encoding="utf-8") as f:
        f.write(code)
    return _subprocess_run(cmd(src), stdin, timeout)


def _local_compiled(code, stdin, timeout, tmpdir, ext, compile_cmd):
    """Compile and run (C, C++)."""
    src = os.path.join(tmpdir, f"solution{ext}")
    exe = os.path.join(tmpdir, "solution.exe" if os.name == "nt" else "solution")
    with open(src, "w", encoding="utf-8") as f:
        f.write(code)

    cr = _subprocess_run(compile_cmd(src, exe), "", timeout=30.0)
    if cr["exit_code"] != 0:
        return _make_result(compile_output=cr["stderr"] or cr["stdout"],
                            status="Compilation Error", status_id=6)
    return _subprocess_run([exe], stdin, timeout)


def _local_java(code, stdin, timeout, tmpdir):
    """Compile and run Java."""
    src = os.path.join(tmpdir, "Main.java")
    with open(src, "w", encoding="utf-8") as f:
        f.write(code)
    cr = _subprocess_run(["javac", src], "", timeout=30.0)
    if cr["exit_code"] != 0:
        return _make_result(compile_output=cr["stderr"] or cr["stdout"],
                            status="Compilation Error", status_id=6)
    return _subprocess_run(["java", "-cp", tmpdir, "Main"], stdin, timeout)


def _subprocess_run(cmd, stdin, timeout):
    """Run a subprocess and return a result dict."""
    start = time.time()
    try:
        r = subprocess.run(
            cmd, input=stdin, capture_output=True, text=True,
            timeout=timeout,
            env={**os.environ, "PYTHONIOENCODING": "utf-8"},
        )
        elapsed = time.time() - start
        ok = r.returncode == 0
        return _make_result(
            stdout=r.stdout or "", stderr=r.stderr or "",
            exit_code=r.returncode, time_s=elapsed,
            status="Accepted" if ok else "Runtime Error",
            status_id=3 if ok else 11,
        )
    except subprocess.TimeoutExpired:
        return _make_result(
            stderr="Time Limit Exceeded", time_s=time.time() - start,
            status="Time Limit Exceeded", status_id=5,
        )
    except FileNotFoundError as e:
        return _make_result(
            stderr=f"Compiler/runtime not found: {e}",
            status="Internal Error", status_id=13,
        )
    except Exception as e:
        return _make_result(
            stderr=str(e), status="Internal Error", status_id=13,
        )


# ─────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────

def _make_result(
    stdout="", stderr="", compile_output=None,
    time_s=0.0, memory=0, exit_code=1,
    status="Internal Error", status_id=13,
) -> dict:
    return {
        "stdout": stdout,
        "stderr": stderr,
        "compile_output": compile_output,
        "time": f"{time_s:.3f}" if isinstance(time_s, float) else str(time_s),
        "memory": memory,
        "exit_code": exit_code,
        "status": status,
        "status_id": status_id,
    }
