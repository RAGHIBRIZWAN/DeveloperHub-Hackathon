"""
Proctoring Models
================
Exam session and proctoring event tracking models.
"""

from datetime import datetime
from typing import Optional, List
from beanie import Document
from pydantic import Field, BaseModel


class ProctoringSettings(BaseModel):
    """Proctoring configuration for an exam."""
    webcam_required: bool = True
    face_detection_enabled: bool = True
    tab_switch_detection: bool = True
    copy_paste_detection: bool = True
    fullscreen_required: bool = True
    max_tab_switches: int = 3
    max_face_away_seconds: int = 30
    auto_submit_on_violation: bool = False


class ExamSession(Document):
    """
    Exam session document with proctoring.
    """
    
    # References
    user_id: str = Field(..., index=True)
    exam_type: str  # mcq, coding, mixed
    exam_id: str  # lesson_id, contest_id, etc.
    
    # Proctoring Settings
    settings: ProctoringSettings = Field(default_factory=ProctoringSettings)
    
    # Session Status
    status: str = "not_started"  # not_started, active, paused, 
                                  # completed, terminated, flagged
    
    # Timing
    scheduled_start: Optional[datetime] = None
    actual_start: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration_minutes: int = 60
    time_remaining_seconds: Optional[int] = None
    
    # Proctoring State
    webcam_active: bool = False
    face_detected: bool = False
    is_fullscreen: bool = False
    
    # Violations
    total_violations: int = 0
    tab_switch_count: int = 0
    copy_paste_count: int = 0
    face_away_count: int = 0
    face_away_total_seconds: int = 0
    
    # Trust Score (0-100)
    trust_score: float = 100.0
    
    # Flags
    is_flagged: bool = False
    flag_reason: Optional[str] = None
    needs_review: bool = False
    
    # Browser Info
    browser_info: Optional[dict] = None
    ip_address: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "exam_sessions"
        indexes = [
            [("user_id", 1), ("exam_id", 1)],
        ]
    
    def record_violation(self, violation_type: str):
        """Record a proctoring violation and update trust score."""
        self.total_violations += 1
        
        if violation_type == "tab_switch":
            self.tab_switch_count += 1
            self.trust_score -= 5
        elif violation_type == "copy_paste":
            self.copy_paste_count += 1
            self.trust_score -= 10
        elif violation_type == "face_away":
            self.face_away_count += 1
            self.trust_score -= 3
        elif violation_type == "fullscreen_exit":
            self.trust_score -= 15
        
        self.trust_score = max(0, self.trust_score)
        
        # Flag if trust score too low
        if self.trust_score < 50:
            self.is_flagged = True
            self.flag_reason = "Low trust score"
            self.needs_review = True


class ProctoringEvent(Document):
    """
    Individual proctoring event log.
    """
    
    session_id: str = Field(..., index=True)
    user_id: str = Field(..., index=True)
    
    # Event Info
    event_type: str  # face_detected, face_lost, tab_switch, 
                     # copy_detected, paste_detected, 
                     # fullscreen_enter, fullscreen_exit,
                     # session_start, session_end
    
    severity: str = "info"  # info, warning, violation
    
    # Details
    description: str
    metadata: Optional[dict] = None
    # For face events: {confidence, face_count, position}
    # For tab events: {from_tab, to_tab}
    
    # Screenshot (optional, for violations)
    screenshot_url: Optional[str] = None
    
    # Timestamp
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "proctoring_events"
        indexes = [
            [("session_id", 1), ("timestamp", -1)],
        ]
