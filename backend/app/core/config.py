"""
Application Configuration
========================
Centralized configuration management using Pydantic Settings.
"""

import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings
from functools import lru_cache

# Load .env file from backend directory
ENV_FILE = Path(__file__).parent.parent.parent / ".env"


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application
    APP_NAME: str = "CodeHub"
    APP_ENV: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://codehub.vercel.app"
    ]
    
    # MongoDB Atlas
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "codehub"
    
    # Admin Configuration
    ADMIN_EMAIL: str = "alihadi@admin.com"  # Auto-assign admin role to this email
    
    # Judge0 Self-Hosted (Code Execution)
    JUDGE0_URL: str = "http://localhost:2358"  # Self-hosted Judge0 URL
    JUDGE0_API_URL: str = "https://judge0-ce.p.rapidapi.com"  # Fallback to RapidAPI
    JUDGE0_API_KEY: str = "your-judge0-api-key"
    JUDGE0_API_HOST: str = "judge0-ce.p.rapidapi.com"
    USE_SELF_HOSTED_JUDGE0: bool = True  # Set to False to use RapidAPI
    
    # AI Services
    GROQ_API_KEY: str = "your-groq-api-key"
    GEMINI_API_KEY: str = "your-gemini-api-key"
    OPENAI_API_KEY: str = "your-openai-api-key"  # For Whisper
    
    # Codeforces API
    CODEFORCES_API_URL: str = "https://codeforces.com/api"
    CODEFORCES_API_KEY: str = "8d9c93dc6cf323d869e9b922cd5a89511f750bc3"
    CODEFORCES_API_SECRET: str = "3fe38c008a5aad3a9dd28a46d3dcd0d8f2c7b279"
    
    # Redis (Caching & Rate Limiting)
    REDIS_URL: str = "redis://localhost:6379"
    
    # JWT Settings
    JWT_SECRET_KEY: str = "your-jwt-secret-key"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # File Upload
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    # Gamification Settings
    COINS_PER_LESSON: int = 10
    COINS_PER_CHALLENGE: int = 25
    COINS_PER_CONTEST_WIN: int = 100
    STREAK_BONUS_MULTIPLIER: float = 1.5
    
    class Config:
        env_file = str(ENV_FILE)
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
