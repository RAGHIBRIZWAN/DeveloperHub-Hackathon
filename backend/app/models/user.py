"""
User Model
==========
User document model with profile, preferences, and progress tracking.
"""

from datetime import datetime
from typing import Optional, List
from enum import Enum
from beanie import Document
from pydantic import Field, EmailStr, BaseModel


class UserRole(str, Enum):
    """User role enumeration."""
    ADMIN = "admin"
    USER = "user"


class UserPreferences(BaseModel):
    """User preference settings."""
    programming_language: str = "python"  # python, cpp, javascript
    instruction_language: str = "en"  # en, ur (English, Urdu)
    theme: str = "default"
    notifications_enabled: bool = True
    sound_enabled: bool = True
    voice_tutor_enabled: bool = True


class UserStats(BaseModel):
    """User statistics and progress."""
    total_lessons_completed: int = 0
    total_challenges_solved: int = 0
    total_mcqs_attempted: int = 0
    total_mcqs_correct: int = 0
    total_contests_participated: int = 0
    total_contests_won: int = 0
    current_streak: int = 0
    longest_streak: int = 0
    last_activity_date: Optional[datetime] = None
    total_time_spent_minutes: int = 0


class User(Document):
    """
    User document model.
    Represents a registered user on the CodeHub platform.
    """
    
    # Authentication
    email: EmailStr = Field(..., index=True)
    username: str = Field(..., index=True)
    hashed_password: str
    
    # Profile
    full_name: str
    avatar_url: Optional[str] = None
    profile_picture: Optional[str] = None  # Base64 or URL for profile picture
    bio: Optional[str] = None
    institution: Optional[str] = None
    country: str = "Pakistan"
    
    # Role & Status (admin/user enum)
    role: str = Field(default="user")  # user, admin
    is_active: bool = True
    is_verified: bool = False
    
    # Preferences
    preferences: UserPreferences = Field(default_factory=UserPreferences)
    
    # Gamification
    level: int = 1
    xp: int = 0
    coins: int = 0
    badges: List[str] = Field(default_factory=list)
    unlocked_themes: List[str] = Field(default_factory=lambda: ["default"])
    
    # Stats
    stats: UserStats = Field(default_factory=UserStats)
    
    # Rating (for competitive programming)
    rating: int = 1000
    max_rating: int = 1000
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    
    class Settings:
        name = "users"
        use_state_management = True
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "student@example.com",
                "username": "coder123",
                "full_name": "Ahmed Khan",
                "role": "student",
                "level": 5,
                "xp": 2500,
                "coins": 350
            }
        }
    
    def add_xp(self, amount: int) -> bool:
        """
        Add XP and check for level up.
        Returns True if user leveled up.
        """
        self.xp += amount
        xp_for_next_level = self.level * 100  # Simple formula: level * 100
        
        if self.xp >= xp_for_next_level:
            self.level += 1
            self.xp -= xp_for_next_level
            return True
        return False
    
    def add_coins(self, amount: int):
        """Add coins to user balance."""
        self.coins += amount
    
    def spend_coins(self, amount: int) -> bool:
        """
        Spend coins if user has enough.
        Returns True if successful.
        """
        if self.coins >= amount:
            self.coins -= amount
            return True
        return False
    
    def update_streak(self):
        """Update daily learning streak."""
        today = datetime.utcnow().date()
        
        if self.stats.last_activity_date:
            last_date = self.stats.last_activity_date.date()
            days_diff = (today - last_date).days
            
            if days_diff == 1:
                self.stats.current_streak += 1
            elif days_diff > 1:
                self.stats.current_streak = 1
            # If same day, don't change streak
        else:
            self.stats.current_streak = 1
        
        if self.stats.current_streak > self.stats.longest_streak:
            self.stats.longest_streak = self.stats.current_streak
        
        self.stats.last_activity_date = datetime.utcnow()
