# """
# CodeHub Backend - Main Application Entry Point
# ==============================================
# FastAPI server for the CodeHub gamified programming education platform.
# """

# import os
# from contextlib import asynccontextmanager
# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import ORJSONResponse
# from slowapi import Limiter, _rate_limit_exceeded_handler
# from slowapi.util import get_remote_address
# from slowapi.errors import RateLimitExceeded

# from app.core.config import settings
# from app.core.database import connect_db, close_db
# from app.core.scheduler import contest_scheduler
# from app.api import router as api_router


# # Rate limiter setup
# limiter = Limiter(key_func=get_remote_address)


# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     """
#     Application lifespan manager.
#     Handles startup and shutdown events.
#     """
#     # Startup
#     print("🚀 Starting CodeHub Backend...")
#     db_connected = await connect_db()
#     if db_connected:
#         print("✅ Database connected")
#         # Start contest scheduler
#         contest_scheduler.start()
#         print("✅ Contest scheduler started")
#     else:
#         print("⚠️  Database connection failed - running without database")
#     print("✅ CodeHub Backend is ready!")
    
#     yield
    
#     # Shutdown
#     print("🛑 Shutting down CodeHub Backend...")
#     await contest_scheduler.stop()
#     print("✅ Contest scheduler stopped")
#     await close_db()
#     print("✅ Database connection closed")


# # Create FastAPI application
# app = FastAPI(
#     title="CodeHub API",
#     description="""
#     🎓 CodeHub - Gamified Programming Education Platform API
    
#     ## Features
#     - 🔐 Authentication & User Management
#     - 📚 Lesson Management & Progress Tracking
#     - 💻 Code Execution with Judge0
#     - 🤖 AI Tutor (Bilingual - Urdu/English)
#     - 📝 RAG-based MCQ Generation
#     - 🏆 Competitive Programming & Leaderboards
#     - 🎮 Gamification (Coins, Badges, Levels)
#     - 👁️ AI Proctoring for Exams
    
#     ## Team
#     Built by **AI CHAMPS** for NED Hackathon
#     """,
#     version="1.0.0",
#     default_response_class=ORJSONResponse,
#     lifespan=lifespan,
#     docs_url="/docs",
#     redoc_url="/redoc",
# )

# # Add rate limiter to app state
# app.state.limiter = limiter
# app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# # CORS Configuration
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=settings.CORS_ORIGINS,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# # Health check endpoint
# @app.get("/", tags=["Health"])
# async def root():
#     """Root endpoint - API health check."""
#     return {
#         "status": "healthy",
#         "message": "Welcome to CodeHub API",
#         "version": "1.0.0",
#         "docs": "/docs"
#     }


# @app.get("/health", tags=["Health"])
# async def health_check():
#     """Detailed health check endpoint."""
#     return {
#         "status": "healthy",
#         "database": "connected",
#         "services": {
#             "auth": "operational",
#             "lessons": "operational",
#             "code_execution": "operational",
#             "ai_tutor": "operational",
#             "mcq_generator": "operational",
#             "gamification": "operational",
#             "proctoring": "operational"
#         }
#     }


# # Include all API routers
# app.include_router(api_router, prefix="/api")


# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(
#         "main:app",
#         host="0.0.0.0",
#         port=int(os.getenv("PORT", 8000)),
#         reload=True,
#         log_level="info",
#         workers=1,  # Single worker for development (reload mode requires this)
#         limit_concurrency=1000,  # Allow up to 1000 concurrent connections
#         limit_max_requests=10000,  # Restart worker after 10k requests (memory management)
#         timeout_keep_alive=30,  # Keep-alive timeout
#     )


"""
CodeHub Backend - Main Application Entry Point
==============================================
FastAPI server for the CodeHub gamified programming education platform.
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.database import connect_db, close_db
from app.core.scheduler import contest_scheduler
from app.api import router as api_router

# Rate limiter setup
limiter = Limiter(key_func=get_remote_address)

# -----------------------------
# Lifespan (startup & shutdown)
# -----------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Handles startup and shutdown events.
    """
    # Startup
    print("🚀 Starting CodeHub Backend...")
    db_connected = await connect_db()
    if db_connected:
        print("✅ Database connected")
        contest_scheduler.start()
        print("✅ Contest scheduler started")
    else:
        print("⚠️ Database connection failed - running without DB")
    print("✅ CodeHub Backend is ready!")
    
    yield
    
    # Shutdown
    print("🛑 Shutting down CodeHub Backend...")
    await contest_scheduler.stop()
    print("✅ Contest scheduler stopped")
    await close_db()
    print("✅ Database connection closed")

# -----------------------------
# FastAPI App Initialization
# -----------------------------
app = FastAPI(
    title="CodeHub API",
    description="""
    🎓 CodeHub - Gamified Programming Education Platform API
    
    ## Features
    - 🔐 Authentication & User Management
    - 📚 Lesson Management & Progress Tracking
    - 💻 Code Execution with Judge0
    - 🤖 AI Tutor (Bilingual - Urdu/English)
    - 📝 RAG-based MCQ Generation
    - 🏆 Competitive Programming & Leaderboards
    - 🎮 Gamification (Coins, Badges, Levels)
    - 👁️ AI Proctoring for Exams
    
    ## Team
    Built by **AI CHAMPS** for NED Hackathon
    """,
    version="1.0.0",
    default_response_class=ORJSONResponse,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# -----------------------------
# Rate Limiter
# -----------------------------
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# -----------------------------
# CORS Middleware
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://codehubai.vercel.app"  # <-- Your frontend URL
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Needed to handle OPTIONS preflight
    allow_headers=["*"],
)

# -----------------------------
# Health Check Endpoints
# -----------------------------
@app.get("/", tags=["Health"])
async def root():
    """Root endpoint - API health check."""
    return {
        "status": "healthy",
        "message": "Welcome to CodeHub API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health", tags=["Health"])
async def health_check():
    """Detailed health check endpoint."""
    return {
        "status": "healthy",
        "database": "connected",
        "services": {
            "auth": "operational",
            "lessons": "operational",
            "code_execution": "operational",
            "ai_tutor": "operational",
            "mcq_generator": "operational",
            "gamification": "operational",
            "proctoring": "operational"
        }
    }

# -----------------------------
# Include API Routers
# -----------------------------
app.include_router(api_router, prefix="/api")

# -----------------------------
# Main entry point (local dev only)
# -----------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        log_level="info",
        workers=1,
        limit_concurrency=1000,
        limit_max_requests=10000,
        timeout_keep_alive=30,
    )