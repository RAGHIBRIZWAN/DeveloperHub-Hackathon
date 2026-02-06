"""
Challenge & Submission Models
============================
Coding challenge and code submission models.
"""

from datetime import datetime
from typing import Optional, List
from beanie import Document
from pydantic import Field, BaseModel


class TestCase(BaseModel):
    """Test case for code validation."""
    input: str
    expected_output: str
    is_hidden: bool = False
    points: int = 10
    description: Optional[str] = None


class Challenge(Document):
    """
    Coding challenge document model.
    """
    
    # Basic Info
    title: str = Field(..., index=True)
    title_ur: Optional[str] = None
    slug: str = Field(..., index=True)
    description: str
    description_ur: Optional[str] = None
    
    # Problem Statement
    problem_statement: str
    problem_statement_ur: Optional[str] = None
    
    # Input/Output Format
    input_format: str
    output_format: str
    constraints: str
    
    # Examples (visible to user)
    sample_input: str
    sample_output: str
    explanation: Optional[str] = None
    
    # Test Cases
    test_cases: List[TestCase] = Field(default_factory=list)
    
    # Languages Supported
    supported_languages: List[str] = Field(
        default_factory=lambda: ["python", "cpp", "javascript"]
    )
    
    # Starter Code Templates
    starter_code: dict = Field(default_factory=lambda: {
        "python": "# Write your solution here\n",
        "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n",
        "javascript": "// Write your solution here\n"
    })
    
    # Solution (for reference)
    solution_code: Optional[dict] = None  # {python: "...", cpp: "..."}
    
    # Difficulty & Points
    difficulty: str = "easy"  # easy, medium, hard
    total_points: int = 100
    
    # Limits
    time_limit_seconds: float = 2.0
    memory_limit_mb: int = 256
    
    # Association
    lesson_id: Optional[str] = None
    contest_id: Optional[str] = None
    
    # Rewards
    xp_reward: int = 100
    coin_reward: int = 25
    
    # Stats
    total_submissions: int = 0
    accepted_submissions: int = 0
    
    # Metadata
    tags: List[str] = Field(default_factory=list)
    is_published: bool = True
    is_premium: bool = False
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "challenges"
        use_state_management = True
    
    @property
    def acceptance_rate(self) -> float:
        """Calculate acceptance rate percentage."""
        if self.total_submissions == 0:
            return 0.0
        return (self.accepted_submissions / self.total_submissions) * 100


class Submission(Document):
    """
    Code submission document model.
    Tracks all code submissions by users.
    """
    
    # References
    user_id: str = Field(..., index=True)
    challenge_id: str = Field(..., index=True)
    contest_id: Optional[str] = None
    
    # Code
    code: str
    language: str  # python, cpp, javascript
    
    # Judge0 Integration
    judge0_token: Optional[str] = None
    
    # Results
    status: str = "pending"  # pending, running, accepted, wrong_answer, 
                             # time_limit_exceeded, memory_limit_exceeded,
                             # runtime_error, compilation_error
    
    # Test Results
    test_results: List[dict] = Field(default_factory=list)
    # Each: {test_case_index, passed, actual_output, expected_output, time_ms, memory_kb}
    
    passed_tests: int = 0
    total_tests: int = 0
    score: float = 0.0  # Points earned
    
    # Performance
    execution_time_ms: Optional[float] = None
    memory_used_kb: Optional[float] = None
    
    # Error Info
    error_message: Optional[str] = None
    compile_output: Optional[str] = None
    
    # Timestamps
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    judged_at: Optional[datetime] = None
    
    class Settings:
        name = "submissions"
        indexes = [
            [("user_id", 1), ("challenge_id", 1)],
            [("challenge_id", 1), ("status", 1)],
            [("contest_id", 1), ("submitted_at", -1)],
        ]
