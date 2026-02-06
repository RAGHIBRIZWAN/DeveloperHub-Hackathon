"""
Lesson Models
============
Course content and lesson progress tracking models.
"""

from datetime import datetime
from typing import Optional, List
from beanie import Document
from pydantic import Field, BaseModel


class LessonContent(BaseModel):
    """Lesson content block."""
    type: str  # text, code, video, image, interactive
    content: str
    language: str = "en"  # en, ur
    code_language: Optional[str] = None  # python, cpp, javascript


class LessonExample(BaseModel):
    """Code example in a lesson."""
    title: str
    description: str
    code: str
    language: str  # python, cpp, javascript
    expected_output: Optional[str] = None


class Lesson(Document):
    """
    Lesson document model.
    Represents a single lesson in a course.
    """
    
    # Basic Info
    title: str = Field(..., index=True)
    title_ur: Optional[str] = None  # Urdu title
    slug: str = Field(..., index=True)
    description: str
    description_ur: Optional[str] = None  # Urdu description
    
    # Organization
    course_id: str  # python_basics, cpp_basics, js_basics
    module_id: str  # variables, loops, functions, etc.
    order: int  # Order within module
    
    # Content
    content_blocks: List[LessonContent] = Field(default_factory=list)
    examples: List[LessonExample] = Field(default_factory=list)
    
    # Programming Language
    programming_language: str  # python, cpp, javascript
    
    # Difficulty & Duration
    difficulty: str = "beginner"  # beginner, intermediate, advanced
    estimated_minutes: int = 15
    
    # Requirements
    prerequisites: List[str] = Field(default_factory=list)  # List of lesson slugs
    
    # Associated Content
    has_mcq: bool = True
    has_challenge: bool = True
    challenge_id: Optional[str] = None
    
    # Rewards
    xp_reward: int = 50
    coin_reward: int = 10
    
    # Metadata
    tags: List[str] = Field(default_factory=list)
    is_published: bool = True
    is_premium: bool = False
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "lessons"
        use_state_management = True


class LessonProgress(Document):
    """
    Tracks user progress through lessons.
    """
    
    user_id: str = Field(..., index=True)
    lesson_id: str = Field(..., index=True)
    
    # Progress
    status: str = "not_started"  # not_started, in_progress, completed
    progress_percentage: int = 0
    
    # MCQ Progress
    mcq_completed: bool = False
    mcq_score: Optional[float] = None
    mcq_attempts: int = 0
    
    # Challenge Progress
    challenge_completed: bool = False
    challenge_attempts: int = 0
    best_submission_id: Optional[str] = None
    
    # Time Tracking
    time_spent_seconds: int = 0
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    last_accessed_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Rewards
    xp_earned: int = 0
    coins_earned: int = 0
    rewards_claimed: bool = False
    
    class Settings:
        name = "lesson_progress"
        indexes = [
            [("user_id", 1), ("lesson_id", 1)],
        ]
