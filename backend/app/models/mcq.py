"""
MCQ Models
=========
Multiple Choice Question and attempt tracking models.
"""

from datetime import datetime
from typing import Optional, List
from beanie import Document
from pydantic import Field, BaseModel


class MCQOption(BaseModel):
    """MCQ answer option."""
    id: str  # a, b, c, d
    text: str
    text_ur: Optional[str] = None
    is_correct: bool = False


class MCQQuestion(Document):
    """
    MCQ Question document model.
    Supports both static and RAG-generated questions.
    """
    
    # Question Text
    question: str
    question_ur: Optional[str] = None  # Urdu translation
    
    # Options
    options: List[MCQOption]
    correct_option: str  # a, b, c, d
    
    # Explanation
    explanation: str
    explanation_ur: Optional[str] = None
    
    # Categorization
    topic: str = Field(..., index=True)  # variables, loops, functions, etc.
    subtopic: Optional[str] = None
    programming_language: str  # python, cpp, javascript, general
    
    # Difficulty
    difficulty: str = "medium"  # easy, medium, hard
    points: int = 10
    
    # Association
    lesson_id: Optional[str] = None
    
    # RAG Metadata
    is_generated: bool = False  # True if RAG-generated
    source_document: Optional[str] = None
    generation_date: Optional[datetime] = None
    
    # Stats
    times_shown: int = 0
    times_correct: int = 0
    
    # Metadata
    tags: List[str] = Field(default_factory=list)
    is_active: bool = True
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "mcq_questions"
        use_state_management = True
    
    @property
    def accuracy_rate(self) -> float:
        """Calculate how often this question is answered correctly."""
        if self.times_shown == 0:
            return 0.0
        return (self.times_correct / self.times_shown) * 100


class MCQAttempt(Document):
    """
    Tracks user attempts at MCQ quizzes.
    """
    
    # References
    user_id: str = Field(..., index=True)
    lesson_id: Optional[str] = Field(None, index=True)
    
    # Quiz Info
    quiz_type: str = "lesson"  # lesson, practice, exam
    
    # Questions & Answers
    questions: List[str] = Field(default_factory=list)  # Question IDs
    answers: List[dict] = Field(default_factory=list)
    # Each: {question_id, selected_option, is_correct, time_taken_seconds}
    
    # Results
    total_questions: int = 0
    correct_answers: int = 0
    score_percentage: float = 0.0
    points_earned: int = 0
    
    # Time
    time_limit_seconds: Optional[int] = None
    time_taken_seconds: int = 0
    
    # Status
    status: str = "in_progress"  # in_progress, completed, timed_out
    
    # Timestamps
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    
    class Settings:
        name = "mcq_attempts"
        indexes = [
            [("user_id", 1), ("lesson_id", 1)],
        ]
    
    def calculate_score(self):
        """Calculate and update score."""
        if self.total_questions > 0:
            self.score_percentage = (self.correct_answers / self.total_questions) * 100
