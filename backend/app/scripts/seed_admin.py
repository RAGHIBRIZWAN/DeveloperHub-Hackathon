"""
Admin User Seeder Script
========================
Creates a default admin user in the database.

Run this script to create the admin user:
    python -m app.scripts.seed_admin
"""

import asyncio
from datetime import datetime

from app.core.database import connect_db, close_db
from app.core.security import hash_password
from app.models.user import User, UserPreferences, UserStats


# Default admin credentials - CHANGE THESE IN PRODUCTION!
ADMIN_EMAIL = "admin@codehub.com"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "Admin@123456"  # Change this in production!
ADMIN_FULL_NAME = "CodeHub Admin"


async def seed_admin():
    """Create the default admin user if it doesn't exist."""
    
    # Connect to database
    connected = await connect_db()
    if not connected:
        print("❌ Failed to connect to database. Make sure MongoDB is running.")
        return False
    
    try:
        # Check if admin already exists
        existing_admin = await User.find_one(User.email == ADMIN_EMAIL)
        if existing_admin:
            print(f"⚠️  Admin user already exists: {ADMIN_EMAIL}")
            print(f"   Username: {existing_admin.username}")
            print(f"   Role: {existing_admin.role}")
            
            # Ensure the role is 'admin'
            if existing_admin.role != "admin":
                existing_admin.role = "admin"
                await existing_admin.save()
                print("✅ Updated user role to 'admin'")
            
            return True
        
        # Create admin user
        admin_user = User(
            email=ADMIN_EMAIL,
            username=ADMIN_USERNAME,
            hashed_password=hash_password(ADMIN_PASSWORD),
            full_name=ADMIN_FULL_NAME,
            role="admin",
            is_active=True,
            is_verified=True,
            preferences=UserPreferences(
                programming_language="python",
                instruction_language="en",
                theme="default",
                notifications_enabled=True
            ),
            stats=UserStats(),
            level=10,
            xp=5000,
            coins=1000,
            rating=2000,
            max_rating=2000,
            badges=["admin", "founder"],
            unlocked_themes=["default", "dark", "neon"],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        await admin_user.insert()
        
        print("✅ Admin user created successfully!")
        print(f"   Email: {ADMIN_EMAIL}")
        print(f"   Username: {ADMIN_USERNAME}")
        print(f"   Password: {ADMIN_PASSWORD}")
        print("\n⚠️  IMPORTANT: Change the admin password in production!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        return False
    
    finally:
        await close_db()


async def list_admins():
    """List all admin users."""
    connected = await connect_db()
    if not connected:
        print("❌ Failed to connect to database.")
        return
    
    try:
        admins = await User.find(User.role == "admin").to_list()
        
        if not admins:
            print("No admin users found.")
            return
        
        print(f"\n📋 Admin Users ({len(admins)} total):")
        print("-" * 50)
        for admin in admins:
            print(f"  • {admin.username} ({admin.email})")
            print(f"    Full Name: {admin.full_name}")
            print(f"    Created: {admin.created_at}")
            print()
            
    finally:
        await close_db()


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--list":
        asyncio.run(list_admins())
    else:
        asyncio.run(seed_admin())
