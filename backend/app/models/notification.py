"""
Notification Model
==================
User notification system for contests and announcements.
"""

from datetime import datetime
from typing import Optional, List
from enum import Enum
from beanie import Document
from pydantic import Field, BaseModel


class NotificationType(str, Enum):
    """Notification type enumeration."""
    CONTEST_CREATED = "contest_created"
    CONTEST_STARTING = "contest_starting"
    CONTEST_ENDED = "contest_ended"
    ACHIEVEMENT_UNLOCKED = "achievement_unlocked"
    BADGE_EARNED = "badge_earned"
    LEVEL_UP = "level_up"
    ANNOUNCEMENT = "announcement"
    SYSTEM = "system"


class Notification(Document):
    """
    User notification document model.
    """
    
    # Target (user_id or "all" for broadcast)
    user_id: str = Field(..., index=True)  # Use "all" for broadcast notifications
    
    # Notification details
    title: str
    title_ur: Optional[str] = None
    message: str
    message_ur: Optional[str] = None
    
    # Type and metadata
    notification_type: str = Field(default=NotificationType.SYSTEM)
    
    # Related entity
    related_type: Optional[str] = None  # "contest", "badge", "achievement"
    related_id: Optional[str] = None
    
    # Link/Action
    action_url: Optional[str] = None
    
    # Status
    is_read: bool = False
    read_at: Optional[datetime] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None  # Auto-delete after this time
    
    class Settings:
        name = "notifications"
        use_state_management = True
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "all",
                "title": "New Contest Announced!",
                "message": "Weekly Programming Challenge starts tomorrow at 5 PM",
                "notification_type": "contest_created",
                "related_type": "contest",
                "related_id": "contest_123"
            }
        }


class UserNotificationSettings(BaseModel):
    """User notification preferences."""
    email_notifications: bool = True
    push_notifications: bool = True
    contest_reminders: bool = True
    achievement_alerts: bool = True
    weekly_digest: bool = False
