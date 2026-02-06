"""
Direct server runner to avoid uvicorn CLI issues
"""
import uvicorn
import os

if __name__ == "__main__":
    os.chdir(r"D:\PROJECTS\ned_hackathon\NED-Hackathon\backend")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
