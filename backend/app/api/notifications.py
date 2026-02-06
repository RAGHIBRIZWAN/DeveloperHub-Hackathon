"""
Notifications API Routes
========================
User notification management endpoints.
"""

from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel

from app.core.security import get_current_user
from app.models.user import User
from app.models.notification import Notification

router = APIRouter()


# ============ Schemas ============

class NotificationResponse(BaseModel):
    """Notification response."""
    id: str
    title: str
    title_ur: Optional[str]
    message: str
    message_ur: Optional[str]
    notification_type: str
    is_read: bool
    action_url: Optional[str]
    created_at: datetime


# ============ Routes ============

@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(
    unread_only: bool = False,
    limit: int = 20,
    current_user: User = Depends(get_current_user)
):
    """Get user's notifications including broadcasts."""
    # Query for user-specific notifications OR broadcast notifications
    from beanie.operators import Or, In
    
    query = Notification.find(
        Or(
            Notification.user_id == str(current_user.id),
            Notification.user_id == "all"
        )
    )
    
    if unread_only:
        query = query.find(Notification.is_read == False)
    
    notifications = await query.sort(-Notification.created_at).limit(limit).to_list()
    
    return [
        NotificationResponse(
            id=str(n.id),
            title=n.title,
            title_ur=n.title_ur,
            message=n.message,
            message_ur=n.message_ur,
            notification_type=n.notification_type,
            is_read=n.is_read,
            action_url=n.action_url,
            created_at=n.created_at
        )
        for n in notifications
    ]


@router.get("/unread-count")
async def get_unread_count(current_user: User = Depends(get_current_user)):
    """Get count of unread notifications."""
    from beanie.operators import Or
    
    count = await Notification.find(
        Or(
            Notification.user_id == str(current_user.id),
            Notification.user_id == "all"
        ),
        Notification.is_read == False
    ).count()
    
    return {"unread_count": count}


@router.put("/{notification_id}/read")
async def mark_as_read(
    notification_id: str,
    current_user: User = Depends(get_current_user)
):
    """Mark a notification as read."""
    notification = await Notification.get(notification_id)
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    # Check if user has access to this notification
    if notification.user_id not in [str(current_user.id), "all"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # For broadcast notifications, we need to track read status per user
    # For now, just mark as read
    notification.is_read = True
    notification.read_at = datetime.utcnow()
    await notification.save()
    
    return {"message": "Notification marked as read"}


@router.put("/mark-all-read")
async def mark_all_as_read(current_user: User = Depends(get_current_user)):
    """Mark all notifications as read."""
    from beanie.operators import Or
    
    notifications = await Notification.find(
        Or(
            Notification.user_id == str(current_user.id),
            Notification.user_id == "all"
        ),
        Notification.is_read == False
    ).to_list()
    
    for notification in notifications:
        notification.is_read = True
        notification.read_at = datetime.utcnow()
        await notification.save()
    
    return {"message": f"Marked {len(notifications)} notifications as read"}


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a notification (only user-specific ones)."""
    notification = await Notification.get(notification_id)
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    # Can only delete user-specific notifications, not broadcasts
    if notification.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete broadcast notifications"
        )
    
    await notification.delete()
    
    return {"message": "Notification deleted"}
