"""
Core module - Contains configuration, database, and security utilities.
"""

from .config import settings
from .database import get_database

__all__ = ["settings", "get_database"]
