"""
Background Scheduler
===================
Handles scheduled tasks like contest status updates.
"""

import asyncio
from datetime import datetime
from typing import Optional
import logging

from app.models.contest import Contest

logger = logging.getLogger(__name__)


class ContestScheduler:
    """Background scheduler for contest status updates."""
    
    def __init__(self):
        self.task: Optional[asyncio.Task] = None
        self.running = False
    
    async def update_contest_statuses(self):
        """Update contest statuses based on current time."""
        try:
            now = datetime.utcnow()
            
            # Update upcoming contests to ongoing
            upcoming_contests = await Contest.find({"status": "upcoming"}).to_list()
            for contest in upcoming_contests:
                if contest.start_time <= now < contest.end_time:
                    contest.status = "ongoing"
                    await contest.save()
                    logger.info(f"Contest {contest.title} ({contest.id}) started")
            
            # Update ongoing contests to completed
            ongoing_contests = await Contest.find({"status": "ongoing"}).to_list()
            for contest in ongoing_contests:
                if now >= contest.end_time:
                    contest.status = "completed"
                    await contest.save()
                    logger.info(f"Contest {contest.title} ({contest.id}) completed")
            
        except Exception as e:
            logger.error(f"Error updating contest statuses: {e}")
    
    async def run(self):
        """Main scheduler loop."""
        logger.info("Contest scheduler started")
        self.running = True
        
        while self.running:
            try:
                await self.update_contest_statuses()
                # Run every 30 seconds
                await asyncio.sleep(30)
            except Exception as e:
                logger.error(f"Scheduler error: {e}")
                await asyncio.sleep(30)
    
    def start(self):
        """Start the scheduler."""
        if not self.task or self.task.done():
            self.task = asyncio.create_task(self.run())
            logger.info("Contest scheduler task created")
    
    async def stop(self):
        """Stop the scheduler."""
        self.running = False
        if self.task and not self.task.done():
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
            logger.info("Contest scheduler stopped")


# Global scheduler instance
contest_scheduler = ContestScheduler()
