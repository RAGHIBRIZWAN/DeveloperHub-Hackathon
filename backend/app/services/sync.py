"""
Sync Service
============
Service to synchronize data between User and UserRewards models.
"""

from app.models.user import User
from app.models.gamification import UserRewards


async def sync_user_stats(user_id: str):
    """
    Synchronize user stats between User and UserRewards models.
    Ensures consistency across the system.
    """
    user = await User.get(user_id)
    rewards = await UserRewards.find_one({"user_id": user_id})
    
    if not user or not rewards:
        return False
    
    # Sync coins
    user.coins = rewards.coin_balance
    
    # Sync streak
    user.stats.current_streak = rewards.current_streak
    user.stats.longest_streak = rewards.longest_streak
    
    # Save user
    await user.save()
    
    return True


async def get_unified_stats(user_id: str):
    """
    Get unified user stats from both User and UserRewards.
    Returns a complete view of user progress.
    """
    user = await User.get(user_id)
    rewards = await UserRewards.find_one({"user_id": user_id})
    
    if not user:
        return None
    
    if not rewards:
        rewards = UserRewards(user_id=user_id)
        await rewards.insert()
    
    return {
        # Profile
        "id": str(user.id),
        "username": user.username,
        "full_name": user.full_name,
        "email": user.email,
        "avatar_url": user.avatar_url,
        "profile_picture": user.profile_picture,
        "bio": user.bio,
        "institution": user.institution,
        
        # Gamification
        "level": user.level,
        "xp": user.xp,
        "coins": rewards.coin_balance,  # Use rewards as source of truth
        "rating": user.rating,
        "max_rating": user.max_rating,
        
        # Stats
        "lessons_completed": user.stats.total_lessons_completed,
        "challenges_solved": user.stats.total_challenges_solved,
        "contests_participated": user.stats.total_contests_participated,
        "contests_won": user.stats.total_contests_won,
        "current_streak": rewards.current_streak,
        "longest_streak": rewards.longest_streak,
        
        # Rewards
        "total_xp_earned": rewards.total_xp_earned,
        "total_coins_earned": rewards.total_coins_earned,
        "badges_count": len(rewards.earned_badges),
        "achievements_count": len(rewards.earned_achievements),
        "unlocked_themes": rewards.unlocked_themes,
    }
