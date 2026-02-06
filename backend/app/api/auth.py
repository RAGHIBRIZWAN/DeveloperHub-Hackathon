"""
Authentication API Routes
========================
User registration, login, and profile management.
"""

import base64
import asyncio
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from pydantic import BaseModel, EmailStr, Field

from app.core.security import (
    hash_password, 
    verify_password, 
    create_access_token, 
    create_refresh_token,
    decode_token,
    get_current_user
)
from app.core.config import settings
from app.models.user import User, UserPreferences, UserStats
from app.models.gamification import UserRewards

router = APIRouter()


# ============ Schemas ============

class RegisterRequest(BaseModel):
    """User registration request."""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=30)
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2, max_length=100)
    # Removed language selection - will use defaults


class LoginRequest(BaseModel):
    """User login request."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Authentication token response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


class RefreshTokenRequest(BaseModel):
    """Refresh token request."""
    refresh_token: str


class UpdateProfileRequest(BaseModel):
    """Profile update request."""
    full_name: Optional[str] = None
    bio: Optional[str] = None
    institution: Optional[str] = None
    avatar_url: Optional[str] = None


class UpdatePreferencesRequest(BaseModel):
    """Preferences update request."""
    programming_language: Optional[str] = None
    instruction_language: Optional[str] = None
    theme: Optional[str] = None
    notifications_enabled: Optional[bool] = None
    sound_enabled: Optional[bool] = None
    voice_tutor_enabled: Optional[bool] = None


# ============ Routes ============

# Semaphore to limit concurrent login requests to prevent database overload
_login_semaphore = asyncio.Semaphore(20)

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest):
    """
    Register a new user.
    
    - Creates user account
    - Initializes gamification data
    - Returns authentication tokens
    """
    # Check if email exists
    existing_email = await User.find_one(User.email == request.email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username exists
    existing_username = await User.find_one(User.username == request.username)
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Auto-detect admin role based on email
    user_role = "admin" if request.email == settings.ADMIN_EMAIL else "user"
    
    # Create user with simplified defaults
    user = User(
        email=request.email,
        username=request.username,
        hashed_password=hash_password(request.password),
        full_name=request.full_name,
        role=user_role,
        rating=1000,  # Initial competitive programming rating
        max_rating=1000,
        level=1,
        xp=0,
        coins=0,
        preferences=UserPreferences(
            programming_language="python",
            instruction_language="en"
        ),
        stats=UserStats()
    )
    await user.insert()
    
    # Initialize gamification rewards
    rewards = UserRewards(
        user_id=str(user.id),
        total_xp_earned=0,
        total_coins_earned=0,
        coin_balance=0
    )
    await rewards.insert()
    
    # Create tokens
    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role
    }
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user={
            "id": str(user.id),
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
            "level": user.level,
            "coins": user.coins,
            "avatar_url": user.avatar_url,
            "profile_picture": user.profile_picture,
            "preferences": user.preferences.dict()
        }
    )


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """
    Authenticate user and return tokens.
    Supports concurrent logins from multiple tabs/sessions.
    """
    async with _login_semaphore:
        # Find user
        user = await User.find_one(User.email == request.email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Verify password
        if not verify_password(request.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Check if active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated"
            )
        
        # Update last login (use atomic update for better concurrency)
        user.last_login = datetime.utcnow()
        await User.find_one(User.id == user.id).update({"$set": {"last_login": user.last_login}})
        
        # Create tokens
        token_data = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role
        }
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user={
                "id": str(user.id),
                "email": user.email,
                "username": user.username,
                "full_name": user.full_name,
                "role": user.role,
                "level": user.level,
                "xp": user.xp,
                "coins": user.coins,
                "rating": user.rating,
                "avatar_url": user.avatar_url,
                "profile_picture": user.profile_picture,
                "preferences": user.preferences.dict(),
                "stats": user.stats.dict()
            }
        )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: RefreshTokenRequest):
    """
    Refresh access token using refresh token.
    """
    payload = decode_token(request.refresh_token)
    
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    user = await User.get(user_id)
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role
    }
    access_token = create_access_token(token_data)
    new_refresh_token = create_refresh_token(token_data)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        user={
            "id": str(user.id),
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name
        }
    )


@router.get("/me")
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """
    Get current authenticated user's profile.
    """
    user = await User.get(current_user["user_id"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get UserRewards for synchronized data
    from app.models.gamification import UserRewards
    rewards = await UserRewards.find_one({"user_id": current_user["user_id"]})
    if not rewards:
        rewards = UserRewards(user_id=current_user["user_id"])
        await rewards.insert()
    
    # Sync coins from rewards (source of truth)
    actual_coins = rewards.coin_balance
    
    return {
        "id": str(user.id),
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "bio": user.bio,
        "institution": user.institution,
        "avatar_url": user.avatar_url,
        "profile_picture": user.profile_picture,
        "role": user.role,
        "level": user.level,
        "xp": user.xp,
        "coins": actual_coins,  # Use synchronized value
        "rating": user.rating,
        "max_rating": user.max_rating,
        "badges": user.badges,
        "preferences": user.preferences.dict(),
        "stats": {
            **user.stats.dict(),
            "current_streak": rewards.current_streak,
            "longest_streak": rewards.longest_streak
        },
        "created_at": user.created_at
    }


@router.put("/me")
async def update_profile(
    request: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Update current user's profile.
    """
    user = await User.get(current_user["user_id"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if request.full_name is not None:
        user.full_name = request.full_name
    if request.bio is not None:
        user.bio = request.bio
    if request.institution is not None:
        user.institution = request.institution
    if request.avatar_url is not None:
        user.avatar_url = request.avatar_url
    
    user.updated_at = datetime.utcnow()
    await user.save()
    
    return {"message": "Profile updated successfully"}


@router.put("/me/preferences")
async def update_preferences(
    request: UpdatePreferencesRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Update current user's preferences.
    """
    user = await User.get(current_user["user_id"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if request.programming_language is not None:
        user.preferences.programming_language = request.programming_language
    if request.instruction_language is not None:
        user.preferences.instruction_language = request.instruction_language
    if request.theme is not None:
        if request.theme in user.unlocked_themes:
            user.preferences.theme = request.theme
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Theme not unlocked"
            )
    if request.notifications_enabled is not None:
        user.preferences.notifications_enabled = request.notifications_enabled
    if request.sound_enabled is not None:
        user.preferences.sound_enabled = request.sound_enabled
    if request.voice_tutor_enabled is not None:
        user.preferences.voice_tutor_enabled = request.voice_tutor_enabled
    
    user.updated_at = datetime.utcnow()
    await user.save()
    
    return {"message": "Preferences updated successfully", "preferences": user.preferences.dict()}


@router.post("/me/profile-picture")
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload a profile picture for the current user.
    
    - Accepts JPG, JPEG, PNG, GIF formats
    - Maximum file size: 5MB
    - Stores as base64 in the database
    """
    user = await User.get(current_user["user_id"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Allowed: JPG, PNG, GIF"
        )
    
    # Read file content
    contents = await file.read()
    
    # Validate file size (5MB max)
    max_size = 5 * 1024 * 1024
    if len(contents) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size is 5MB"
        )
    
    # Convert to base64
    base64_image = base64.b64encode(contents).decode("utf-8")
    profile_picture_url = f"data:{file.content_type};base64,{base64_image}"
    
    # Update user profile
    user.profile_picture = profile_picture_url
    user.updated_at = datetime.utcnow()
    await user.save()
    
    return {
        "message": "Profile picture uploaded successfully",
        "profile_picture": profile_picture_url
    }
