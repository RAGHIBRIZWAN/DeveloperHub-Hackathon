"""
Gamification API Routes
======================
Coins, badges, achievements, and rewards.
"""

from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel

from app.core.config import settings
from app.core.security import get_current_user
from app.models.gamification import UserRewards, Badge, Achievement
from app.models.user import User

router = APIRouter()


# ============ Schemas ============

class PurchaseThemeRequest(BaseModel):
    """Request to purchase a theme."""
    theme_id: str
    price: int


class PurchasePowerupRequest(BaseModel):
    """Request to purchase a powerup."""
    powerup_id: str
    price: int


class ClaimRewardRequest(BaseModel):
    """Request to claim a reward."""
    reward_type: str  # daily, streak, achievement
    reward_id: Optional[str] = None


# ============ Theme Definitions ============

AVAILABLE_THEMES = {
    "default": {"name": "Default", "name_ur": "ڈیفالٹ", "price": 0, "color": "#3B82F6"},
    "dark": {"name": "Dark Mode", "name_ur": "ڈارک موڈ", "price": 50, "color": "#1F2937"},
    "nature": {"name": "Nature", "name_ur": "فطرت", "price": 100, "color": "#10B981"},
    "ocean": {"name": "Ocean", "name_ur": "سمندر", "price": 100, "color": "#0EA5E9"},
    "sunset": {"name": "Sunset", "name_ur": "غروب آفتاب", "price": 150, "color": "#F59E0B"},
    "galaxy": {"name": "Galaxy", "name_ur": "کہکشاں", "price": 200, "color": "#8B5CF6"},
    "pakistan": {"name": "Pakistan", "name_ur": "پاکستان", "price": 250, "color": "#01411C"},
    "gold": {"name": "Gold Elite", "name_ur": "گولڈ ایلیٹ", "price": 500, "color": "#EAB308"},
}


# ============ Routes ============

@router.get("/profile")
async def get_gamification_profile(current_user: dict = Depends(get_current_user)):
    """
    Get user's gamification profile.
    """
    user = await User.get(current_user["user_id"])
    rewards = await UserRewards.find_one({"user_id": current_user["user_id"]})
    
    if not rewards:
        # Initialize rewards if not exists
        rewards = UserRewards(user_id=current_user["user_id"])
        await rewards.insert()
    
    # Sync user coins with rewards
    if user.coins != rewards.coin_balance:
        user.coins = rewards.coin_balance
        await user.save()
    
    # Compute rank title based on level
    level = user.level
    if level >= 50:
        rank_title = "Legendary"
    elif level >= 30:
        rank_title = "Grandmaster"
    elif level >= 20:
        rank_title = "Master"
    elif level >= 15:
        rank_title = "Expert"
    elif level >= 10:
        rank_title = "Advanced"
    elif level >= 5:
        rank_title = "Intermediate"
    else:
        rank_title = "Beginner"
    
    return {
        "level": user.level,
        "xp": user.xp,
        "xp_to_next_level": user.level * 100,
        "coins": rewards.coin_balance,
        "total_coins_earned": rewards.total_coins_earned,
        "total_xp_earned": rewards.total_xp_earned,
        "current_streak": rewards.current_streak,
        "longest_streak": rewards.longest_streak,
        "badges_count": len(rewards.earned_badges),
        "achievements_count": len(rewards.earned_achievements),
        "unlocked_themes": rewards.unlocked_themes,
        "active_theme": user.preferences.theme,
        "rank_title": rank_title,
        "rating": user.rating
    }


@router.get("/badges")
async def get_all_badges():
    """
    Get all available badges.
    """
    badges = await Badge.find({"is_active": True}).to_list()
    
    return {
        "badges": [
            {
                "id": b.badge_id,
                "name": b.name,
                "name_ur": b.name_ur,
                "description": b.description,
                "description_ur": b.description_ur,
                "icon": b.icon,
                "color": b.color,
                "rarity": b.rarity,
                "requirement_type": b.requirement_type,
                "requirement_value": b.requirement_value
            }
            for b in badges
        ]
    }


@router.get("/badges/user")
async def get_user_badges(current_user: dict = Depends(get_current_user)):
    """
    Get user's earned badges.
    """
    rewards = await UserRewards.find_one({"user_id": current_user["user_id"]})
    
    if not rewards:
        return {"earned_badges": [], "progress": []}
    
    # Get badge details
    earned_badges = []
    for earned in rewards.earned_badges:
        badge = await Badge.find_one({"badge_id": earned["badge_id"]})
        if badge:
            earned_badges.append({
                "badge_id": badge.badge_id,
                "name": badge.name,
                "name_ur": badge.name_ur,
                "icon": badge.icon,
                "color": badge.color,
                "rarity": badge.rarity,
                "earned_at": earned["earned_at"]
            })
    
    # Calculate progress for unearned badges
    user = await User.get(current_user["user_id"])
    all_badges = await Badge.find({"is_active": True}).to_list()
    earned_ids = [b["badge_id"] for b in rewards.earned_badges]
    
    progress = []
    for badge in all_badges:
        if badge.badge_id not in earned_ids:
            current_value = 0
            if badge.requirement_type == "lessons_completed":
                current_value = user.stats.total_lessons_completed
            elif badge.requirement_type == "challenges_solved":
                current_value = user.stats.total_challenges_solved
            elif badge.requirement_type == "streak_days":
                current_value = user.stats.current_streak
            elif badge.requirement_type == "xp_earned":
                current_value = rewards.total_xp_earned
            
            progress.append({
                "badge_id": badge.badge_id,
                "name": badge.name,
                "current": current_value,
                "required": badge.requirement_value,
                "percentage": min(100, int((current_value / badge.requirement_value) * 100))
            })
    
    return {
        "earned_badges": earned_badges,
        "progress": progress
    }


@router.get("/achievements")
async def get_all_achievements():
    """
    Get all available achievements.
    """
    achievements = await Achievement.find({"is_active": True}).to_list()
    
    return {
        "achievements": [
            {
                "id": a.achievement_id,
                "name": a.name,
                "name_ur": a.name_ur,
                "description": a.description,
                "description_ur": a.description_ur,
                "icon": a.icon,
                "requirements": a.requirements,
                "xp_reward": a.xp_reward,
                "coin_reward": a.coin_reward,
                "unlocks_theme": a.unlocks_theme
            }
            for a in achievements
        ]
    }


@router.get("/themes")
async def get_themes(current_user: dict = Depends(get_current_user)):
    """
    Get all themes with purchase status.
    """
    rewards = await UserRewards.find_one({"user_id": current_user["user_id"]})
    unlocked = rewards.unlocked_themes if rewards else ["default"]
    
    return {
        "themes": [
            {
                "id": theme_id,
                **theme_data,
                "is_unlocked": theme_id in unlocked
            }
            for theme_id, theme_data in AVAILABLE_THEMES.items()
        ]
    }


@router.post("/themes/purchase")
async def purchase_theme(
    request: PurchaseThemeRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Purchase a theme using coins.
    """
    if request.theme_id not in AVAILABLE_THEMES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid theme"
        )
    
    theme = AVAILABLE_THEMES[request.theme_id]
    
    rewards = await UserRewards.find_one({"user_id": current_user["user_id"]})
    if not rewards:
        rewards = UserRewards(user_id=current_user["user_id"])
        await rewards.insert()
    
    # Check if already unlocked
    if request.theme_id in rewards.unlocked_themes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Theme already unlocked"
        )
    
    # Check if enough coins
    if rewards.coin_balance < theme["price"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not enough coins"
        )
    
    # Purchase - spend coins
    success = rewards.spend_coins(theme["price"], f"Purchased {theme['name']} theme")
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient coins"
        )
    
    rewards.unlocked_themes.append(request.theme_id)
    await rewards.save()
    
    # Synchronize with user model
    user = await User.get(current_user["user_id"])
    user.coins = rewards.coin_balance  # Sync coin balance
    user.unlocked_themes.append(request.theme_id)
    user.updated_at = datetime.utcnow()
    await user.save()
    
    return {
        "message": f"Successfully purchased {theme['name']} theme!",
        "remaining_coins": rewards.coin_balance
    }


@router.post("/themes/activate")
async def activate_theme(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Activate a purchased theme for the user.
    """
    theme_id = request.get("theme_id")
    if not theme_id:
        raise HTTPException(status_code=400, detail="theme_id is required")
    
    if theme_id not in AVAILABLE_THEMES:
        raise HTTPException(status_code=400, detail="Invalid theme")
    
    rewards = await UserRewards.find_one({"user_id": current_user["user_id"]})
    if not rewards or theme_id not in rewards.unlocked_themes:
        raise HTTPException(status_code=400, detail="Theme not unlocked")
    
    # Update user preferences with the active theme
    user = await User.get(current_user["user_id"])
    user.preferences.theme = theme_id
    user.updated_at = datetime.utcnow()
    await user.save()
    
    theme = AVAILABLE_THEMES[theme_id]
    return {
        "message": f"{theme['name']} theme activated!",
        "active_theme": theme_id,
        "theme_color": theme["color"]
    }


# ============ Powerup Definitions ============

AVAILABLE_POWERUPS = {
    "xp_boost": {"name": "XP Boost", "description": "Double XP for 1 hour", "price": 100},
    "hint_pack": {"name": "Hint Pack", "description": "5 free AI hints", "price": 50},
    "streak_freeze": {"name": "Streak Freeze", "description": "Protect your streak for 1 day", "price": 75},
}


@router.post("/powerups/purchase")
async def purchase_powerup(
    request: PurchasePowerupRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Purchase a powerup using coins.
    """
    if request.powerup_id not in AVAILABLE_POWERUPS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid powerup"
        )
    
    powerup = AVAILABLE_POWERUPS[request.powerup_id]
    
    rewards = await UserRewards.find_one({"user_id": current_user["user_id"]})
    if not rewards:
        rewards = UserRewards(user_id=current_user["user_id"])
        await rewards.insert()
    
    # Check if enough coins
    if rewards.coin_balance < powerup["price"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not enough coins"
        )
    
    # Spend coins
    success = rewards.spend_coins(powerup["price"], f"Purchased powerup: {powerup['name']}")
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient coins"
        )
    
    await rewards.save()
    
    # Sync with user model
    user = await User.get(current_user["user_id"])
    user.coins = rewards.coin_balance
    user.updated_at = datetime.utcnow()
    await user.save()
    
    return {
        "message": f"Successfully purchased {powerup['name']}!",
        "remaining_coins": rewards.coin_balance,
        "powerup_id": request.powerup_id
    }


@router.post("/daily-reward")
async def claim_daily_reward(current_user: dict = Depends(get_current_user)):
    """
    Claim daily login reward.
    """
    rewards = await UserRewards.find_one({"user_id": current_user["user_id"]})
    if not rewards:
        rewards = UserRewards(user_id=current_user["user_id"])
    
    now = datetime.utcnow()
    
    # Check if already claimed today
    if rewards.last_daily_claim:
        last_claim_date = rewards.last_daily_claim.date()
        today = now.date()
        
        if last_claim_date == today:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Already claimed today"
            )
        
        # Check if consecutive day
        yesterday = today - timedelta(days=1)
        if last_claim_date == yesterday:
            rewards.daily_reward_streak += 1
        else:
            rewards.daily_reward_streak = 1
    else:
        rewards.daily_reward_streak = 1
    
    # Calculate reward (increases with streak, max 7 days)
    streak_day = min(rewards.daily_reward_streak, 7)
    base_coins = 10
    bonus_coins = (streak_day - 1) * 5
    total_coins = base_coins + bonus_coins
    
    # Apply reward
    rewards.add_coins(total_coins, "daily", f"Day {streak_day} daily reward")
    rewards.last_daily_claim = now
    await rewards.save()
    
    # Synchronize with user model
    user = await User.get(current_user["user_id"])
    user.coins = rewards.coin_balance
    user.add_coins(0)  # Update timestamp
    user.updated_at = datetime.utcnow()
    await user.save()
    
    return {
        "message": "Daily reward claimed!",
        "coins_earned": total_coins,
        "streak_day": streak_day,
        "total_coins": rewards.coin_balance
    }


@router.get("/transactions")
async def get_coin_transactions(
    current_user: dict = Depends(get_current_user),
    limit: int = 20
):
    """
    Get user's coin transaction history.
    """
    rewards = await UserRewards.find_one({"user_id": current_user["user_id"]})
    
    if not rewards:
        return {"transactions": [], "balance": 0}
    
    # Get last N transactions
    transactions = rewards.coin_transactions[-limit:]
    transactions.reverse()  # Most recent first
    
    return {
        "transactions": [
            {
                "amount": t.amount,
                "type": t.type,
                "source": t.source,
                "description": t.description,
                "timestamp": t.timestamp
            }
            for t in transactions
        ],
        "balance": rewards.coin_balance
    }


@router.post("/check-badges")
async def check_and_award_badges(current_user: dict = Depends(get_current_user)):
    """
    Check if user has earned any new badges.
    """
    user = await User.get(current_user["user_id"])
    rewards = await UserRewards.find_one({"user_id": current_user["user_id"]})
    
    if not rewards:
        rewards = UserRewards(user_id=current_user["user_id"])
        await rewards.insert()
    
    earned_ids = [b["badge_id"] for b in rewards.earned_badges]
    all_badges = await Badge.find({"is_active": True}).to_list()
    
    newly_earned = []
    
    for badge in all_badges:
        if badge.badge_id in earned_ids:
            continue
        
        # Check if requirement is met
        current_value = 0
        if badge.requirement_type == "lessons_completed":
            current_value = user.stats.total_lessons_completed
        elif badge.requirement_type == "challenges_solved":
            current_value = user.stats.total_challenges_solved
        elif badge.requirement_type == "streak_days":
            current_value = user.stats.current_streak
        elif badge.requirement_type == "contests_won":
            current_value = user.stats.total_contests_won
        elif badge.requirement_type == "xp_earned":
            current_value = rewards.total_xp_earned
        elif badge.requirement_type == "coins_earned":
            current_value = rewards.total_coins_earned
        
        if current_value >= badge.requirement_value:
            # Award badge
            rewards.earned_badges.append({
                "badge_id": badge.badge_id,
                "earned_at": datetime.utcnow()
            })
            
            # Award rewards
            if badge.xp_reward > 0:
                leveled_up = user.add_xp(badge.xp_reward)
                rewards.total_xp_earned += badge.xp_reward
            if badge.coin_reward > 0:
                rewards.add_coins(badge.coin_reward, "badge", f"Earned {badge.name} badge")
                user.coins = rewards.coin_balance
            
            user.badges.append(badge.badge_id)
            user.updated_at = datetime.utcnow()
            
            newly_earned.append({
                "badge_id": badge.badge_id,
                "name": badge.name,
                "name_ur": badge.name_ur,
                "icon": badge.icon,
                "color": badge.color,
                "rarity": badge.rarity,
                "xp_reward": badge.xp_reward,
                "coin_reward": badge.coin_reward
            })
    
    if newly_earned:
        await rewards.save()
        await user.save()
    
    return {
        "newly_earned": newly_earned,
        "message": f"Earned {len(newly_earned)} new badges!" if newly_earned else "No new badges"
    }


@router.get("/leaderboard/coins")
async def get_coins_leaderboard(limit: int = 50):
    """
    Get top users by coins earned.
    """
    rewards_list = await UserRewards.find().sort("-total_coins_earned").limit(limit).to_list()
    
    leaderboard = []
    for i, r in enumerate(rewards_list):
        user = await User.get(r.user_id)
        if user:
            leaderboard.append({
                "rank": i + 1,
                "username": user.username,
                "full_name": user.full_name,
                "total_coins_earned": r.total_coins_earned,
                "level": user.level
            })
    
    return {"leaderboard": leaderboard}
