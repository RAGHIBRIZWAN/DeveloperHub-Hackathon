"""
Gamification Models
==================
Rewards, badges, achievements, and leaderboard models.
"""

from datetime import datetime
from typing import Optional, List
from beanie import Document
from pydantic import Field, BaseModel


class CoinTransaction(BaseModel):
    """Record of a coin transaction."""
    amount: int
    type: str  # earned, spent
    source: str  # lesson, challenge, contest, purchase, streak_bonus
    description: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class Badge(Document):
    """
    Badge definition document.
    """
    
    # Basic Info
    badge_id: str = Field(..., index=True)
    name: str
    name_ur: Optional[str] = None
    description: str
    description_ur: Optional[str] = None
    
    # Visual
    icon: str  # Icon name or URL
    color: str = "#FFD700"  # Badge color
    
    # Requirements
    requirement_type: str  # lessons_completed, challenges_solved, streak_days, 
                          # contests_won, xp_earned, coins_earned
    requirement_value: int
    
    # Rarity
    rarity: str = "common"  # common, rare, epic, legendary
    
    # Rewards
    xp_reward: int = 0
    coin_reward: int = 0
    
    # Metadata
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "badges"


class Achievement(Document):
    """
    Achievement definition document.
    Achievements are major milestones.
    """
    
    # Basic Info
    achievement_id: str = Field(..., index=True)
    name: str
    name_ur: Optional[str] = None
    description: str
    description_ur: Optional[str] = None
    
    # Visual
    icon: str
    
    # Requirements
    requirements: List[dict] = Field(default_factory=list)
    # Each: {type, value} e.g., {type: "lessons_completed", value: 50}
    
    # Rewards
    xp_reward: int = 500
    coin_reward: int = 100
    unlocks_theme: Optional[str] = None  # Theme ID to unlock
    
    # Metadata
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "achievements"


class UserRewards(Document):
    """
    Tracks user's gamification progress.
    """
    
    user_id: str = Field(..., index=True)
    
    # Coins
    total_coins_earned: int = 0
    total_coins_spent: int = 0
    coin_transactions: List[CoinTransaction] = Field(default_factory=list)
    
    # XP & Levels
    total_xp_earned: int = 0
    
    # Badges
    earned_badges: List[dict] = Field(default_factory=list)
    # Each: {badge_id, earned_at}
    
    # Achievements
    earned_achievements: List[dict] = Field(default_factory=list)
    # Each: {achievement_id, earned_at}
    
    # Unlocks
    unlocked_themes: List[str] = Field(default_factory=lambda: ["default"])
    unlocked_avatars: List[str] = Field(default_factory=list)
    
    # Streaks
    current_streak: int = 0
    longest_streak: int = 0
    last_streak_date: Optional[datetime] = None
    
    # Daily Rewards
    last_daily_claim: Optional[datetime] = None
    daily_reward_streak: int = 0
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "user_rewards"
    
    def add_coins(self, amount: int, source: str, description: str):
        """Add coins and record transaction."""
        self.total_coins_earned += amount
        self.coin_transactions.append(CoinTransaction(
            amount=amount,
            type="earned",
            source=source,
            description=description
        ))
        # Keep only last 100 transactions
        if len(self.coin_transactions) > 100:
            self.coin_transactions = self.coin_transactions[-100:]
    
    def spend_coins(self, amount: int, description: str) -> bool:
        """Spend coins if sufficient balance."""
        current_balance = self.total_coins_earned - self.total_coins_spent
        if current_balance >= amount:
            self.total_coins_spent += amount
            self.coin_transactions.append(CoinTransaction(
                amount=amount,
                type="spent",
                source="purchase",
                description=description
            ))
            return True
        return False
    
    @property
    def coin_balance(self) -> int:
        """Get current coin balance."""
        return self.total_coins_earned - self.total_coins_spent
