"""
Database Connection Manager
==========================
Handles MongoDB Atlas connection and Beanie ODM initialization.
"""

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from typing import Optional

from .config import settings
from app.models.user import User
from app.models.lesson import Lesson, LessonProgress
from app.models.challenge import Challenge, Submission as ChallengeSubmission
from app.models.mcq import MCQQuestion, MCQAttempt
from app.models.gamification import UserRewards, Badge, Achievement
from app.models.contest import Contest, ContestParticipation
from app.models.proctoring import ExamSession, ProctoringEvent
from app.models.notification import Notification
from app.models.submission import Submission, UserProblemStatus


# Global database client
_client: "Optional[AsyncIOMotorClient]" = None
_database = None


async def connect_db():
    """
    Initialize database connection and Beanie ODM.
    In development mode with no MongoDB, this will fail gracefully.
    """
    global _client, _database
    
    try:
        # Create MongoDB client with optimized connection pool for concurrency
        _client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            maxPoolSize=100,  # Increased for better concurrency
            minPoolSize=20,
            maxIdleTimeMS=45000,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=10000,
            socketTimeoutMS=45000,
            retryWrites=True,
            w='majority'
        )
        
        # Get database
        _database = _client[settings.MONGODB_DB_NAME]
        
        # Initialize Beanie with document models
        await init_beanie(
            database=_database,
            document_models=[
                User,
                Lesson,
                LessonProgress,
                Challenge,
                ChallengeSubmission,
                MCQQuestion,
                MCQAttempt,
                UserRewards,
                Badge,
                Achievement,
                Contest,
                ContestParticipation,
                ExamSession,
                ProctoringEvent,
                Notification,
                Submission,
                UserProblemStatus,
            ]
        )
        
        print(f"✅ Connected to MongoDB: {settings.MONGODB_URL}")
        return True
        
    except Exception as e:
        print(f"⚠️  Failed to connect to MongoDB: {e}")
        if settings.DEBUG:
            print("📌 Running in DEBUG mode without MongoDB connection")
            print(f"📌 To use the database, start MongoDB or update MONGODB_URL in .env")
            print("📌 Quick fix options:")
            print("   1. Install MongoDB: https://www.mongodb.com/try/download/community")
            print("   2. Use MongoDB Atlas: Update MONGODB_URL in .env for remote database")
            print("   3. Use Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest")
            return False
        else:
            raise


async def close_db():
    """
    Close database connection.
    """
    global _client
    
    if _client:
        _client.close()
        print("✅ MongoDB connection closed")


def get_database():
    """
    Get database instance.
    """
    return _database


def get_client():
    """
    Get MongoDB client instance.
    """
    return _client
