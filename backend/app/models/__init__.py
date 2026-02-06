"""
Database Models Package
======================
Beanie ODM document models for MongoDB.
"""

from .user import User, UserRole
from .lesson import Lesson, LessonProgress
from .challenge import Challenge, Submission
from .mcq import MCQQuestion, MCQAttempt
from .gamification import UserRewards, Badge, Achievement
from .contest import Contest, ContestParticipation
from .proctoring import ExamSession, ProctoringEvent
from .notification import Notification, NotificationType

__all__ = [
    "User",
    "UserRole",
    "Lesson",
    "LessonProgress",
    "Challenge",
    "Submission",
    "MCQQuestion",
    "MCQAttempt",
    "UserRewards",
    "Badge",
    "Achievement",
    "Contest",
    "ContestParticipation",
    "ExamSession",
    "ProctoringEvent",
    "Notification",
    "NotificationType",
]
