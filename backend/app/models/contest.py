"""
Contest Models
=============
Competitive programming contest models.
"""

from datetime import datetime
from typing import Optional, List
from beanie import Document
from pydantic import Field, BaseModel


class ContestProblem(BaseModel):
    """Problem in a contest - can be internal or from Codeforces."""
    # Internal problem reference (optional)
    challenge_id: Optional[str] = None
    
    # Problem details (for local problems)
    title: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[str] = None
    input_format: Optional[str] = None
    output_format: Optional[str] = None
    examples: List[dict] = []
    test_cases: List[dict] = []
    
    # Codeforces problem reference (optional - legacy)
    codeforces_id: Optional[str] = None  # e.g. "1234A"
    codeforces_contest_id: Optional[int] = None
    codeforces_index: Optional[str] = None  # e.g. "A"
    codeforces_rating: Optional[int] = None
    codeforces_tags: List[str] = []
    codeforces_url: Optional[str] = None
    
    # Contest ordering
    order: int = 1  # A=1, B=2, C=3, etc.
    points: int = 100


class Contest(Document):
    """
    Programming contest document model.
    """
    
    # Basic Info
    title: str
    title_ur: Optional[str] = None
    slug: str = Field(..., index=True)
    description: str
    description_ur: Optional[str] = None
    
    # Problems
    problems: List[ContestProblem] = Field(default_factory=list)
    
    # Schedule
    start_time: datetime
    end_time: datetime
    duration_minutes: int
    
    # Type
    contest_type: str = "rated"  # rated, unrated, practice
    difficulty: str = "mixed"  # easy, medium, hard, mixed
    
    # Registration
    is_public: bool = True
    requires_registration: bool = True
    max_participants: Optional[int] = None
    registered_count: int = 0
    
    # Scoring
    scoring_type: str = "icpc"  # icpc (time-based), ioi (partial)
    penalty_time_minutes: int = 20  # For wrong submissions
    
    # Prizes
    has_prizes: bool = False
    prizes: List[dict] = Field(default_factory=list)
    # Each: {rank, coins, badge_id}
    
    # Status
    status: str = "upcoming"  # upcoming, ongoing, completed
    
    # Results
    is_results_published: bool = False
    
    # Metadata
    created_by: str  # User ID
    tags: List[str] = Field(default_factory=list)
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "contests"
        use_state_management = True


class ContestParticipation(Document):
    """
    Tracks user participation in a contest.
    """
    
    user_id: str = Field(..., index=True)
    contest_id: str = Field(..., index=True)
    
    # Registration
    registered_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Participation
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    
    # Disqualification
    is_disqualified: bool = False
    disqualified_at: Optional[datetime] = None
    disqualification_reason: Optional[str] = None
    
    # Submissions per problem
    problem_submissions: List[dict] = Field(default_factory=list)
    # Each: {problem_order, submissions: [], best_submission_id, points, time}
    
    # Scoring
    total_points: int = 0
    total_penalty: int = 0  # Penalty time in minutes
    problems_solved: int = 0
    
    # Ranking
    rank: Optional[int] = None
    
    # Rating Change (for rated contests)
    old_rating: Optional[int] = None
    new_rating: Optional[int] = None
    rating_change: Optional[int] = None
    
    class Settings:
        name = "contest_participations"
        indexes = [
            [("user_id", 1), ("contest_id", 1)],
            [("contest_id", 1), ("total_points", -1), ("total_penalty", 1)],
        ]
