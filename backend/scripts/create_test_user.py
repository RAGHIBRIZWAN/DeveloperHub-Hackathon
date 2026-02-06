"""
Create a test user account directly in the database
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.models.user import User, UserPreferences, UserStats
from app.models.gamification import UserRewards
from app.core.security import hash_password
from app.core.config import settings


async def create_test_user():
    """Create a test user account."""
    print("🔧 Creating test user...")
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    database = client[settings.MONGODB_DB_NAME]
    
    # Initialize Beanie
    await init_beanie(database=database, document_models=[User, UserRewards])
    
    # Test user credentials
    test_email = "test@codehub.com"
    test_username = "testuser"
    test_password = "test123456"  # Simple password for testing
    
    # Check if user exists
    existing = await User.find_one(User.email == test_email)
    if existing:
        print(f"⚠️  User {test_email} already exists. Deleting...")
        await existing.delete()
    
    # Create new test user
    user = User(
        email=test_email,
        username=test_username,
        hashed_password=hash_password(test_password),
        full_name="Test User",
        role="user",
        preferences=UserPreferences(
            programming_language="python",
            instruction_language="en"
        ),
        stats=UserStats()
    )
    await user.insert()
    
    # Create gamification rewards
    rewards = UserRewards(user_id=str(user.id))
    await rewards.insert()
    
    print(f"✅ Test user created successfully!")
    print(f"\nLogin Credentials:")
    print(f"  Email: {test_email}")
    print(f"  Password: {test_password}")
    print(f"\nYou can now login at: http://localhost:5173")
    
    # Close connection
    client.close()


if __name__ == "__main__":
    asyncio.run(create_test_user())
