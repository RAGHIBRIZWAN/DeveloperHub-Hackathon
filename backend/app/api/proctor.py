"""
Proctoring API Routes
====================
AI-powered exam proctoring and monitoring.
"""

from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, status, Depends, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
import json

from app.core.security import get_current_user
from app.models.proctoring import ExamSession, ProctoringEvent, ProctoringSettings
from app.models.user import User

router = APIRouter()


# ============ Schemas ============

class StartExamRequest(BaseModel):
    """Request to start a proctored exam."""
    exam_type: str  # mcq, coding, mixed
    exam_id: str
    duration_minutes: int = 60
    webcam_required: bool = True
    face_detection_enabled: bool = True
    tab_switch_detection: bool = True
    copy_paste_detection: bool = True


class ReportViolationRequest(BaseModel):
    """Request to report a proctoring violation."""
    session_id: str
    violation_type: str  # tab_switch, copy_paste, face_away, fullscreen_exit
    description: Optional[str] = None
    metadata: Optional[dict] = None


class UpdateSessionRequest(BaseModel):
    """Request to update session state."""
    webcam_active: Optional[bool] = None
    face_detected: Optional[bool] = None
    is_fullscreen: Optional[bool] = None


# ============ Active Sessions Manager ============

class SessionManager:
    """Manages active WebSocket connections for proctoring."""
    
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}
    
    async def connect(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[session_id] = websocket
    
    def disconnect(self, session_id: str):
        if session_id in self.active_connections:
            del self.active_connections[session_id]
    
    async def send_alert(self, session_id: str, message: dict):
        if session_id in self.active_connections:
            await self.active_connections[session_id].send_json(message)


session_manager = SessionManager()


# ============ Routes ============

@router.post("/sessions/start")
async def start_exam_session(
    request: StartExamRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Start a new proctored exam session.
    """
    # Check for existing active session
    existing = await ExamSession.find_one({
        "user_id": current_user["user_id"],
        "status": {"$in": ["not_started", "active"]}
    })
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have an active exam session"
        )
    
    # Create proctoring settings
    settings = ProctoringSettings(
        webcam_required=request.webcam_required,
        face_detection_enabled=request.face_detection_enabled,
        tab_switch_detection=request.tab_switch_detection,
        copy_paste_detection=request.copy_paste_detection
    )
    
    # Create session
    session = ExamSession(
        user_id=current_user["user_id"],
        exam_type=request.exam_type,
        exam_id=request.exam_id,
        settings=settings,
        duration_minutes=request.duration_minutes,
        time_remaining_seconds=request.duration_minutes * 60,
        status="not_started"
    )
    await session.insert()
    
    # Log session start
    event = ProctoringEvent(
        session_id=str(session.id),
        user_id=current_user["user_id"],
        event_type="session_created",
        severity="info",
        description="Exam session created"
    )
    await event.insert()
    
    return {
        "session_id": str(session.id),
        "settings": settings.dict(),
        "duration_minutes": request.duration_minutes,
        "status": "not_started"
    }


@router.post("/sessions/{session_id}/activate")
async def activate_session(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Activate a proctored session (user has completed setup).
    """
    session = await ExamSession.get(session_id)
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    if session.user_id != current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    if session.status != "not_started":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session already activated"
        )
    
    session.status = "active"
    session.actual_start = datetime.utcnow()
    session.webcam_active = True
    session.is_fullscreen = True
    await session.save()
    
    # Log activation
    event = ProctoringEvent(
        session_id=session_id,
        user_id=current_user["user_id"],
        event_type="session_start",
        severity="info",
        description="Exam session activated"
    )
    await event.insert()
    
    return {
        "message": "Session activated",
        "session_id": session_id,
        "start_time": session.actual_start,
        "duration_minutes": session.duration_minutes
    }


@router.post("/sessions/{session_id}/violations")
async def report_violation(
    session_id: str,
    request: ReportViolationRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Report a proctoring violation.
    """
    session = await ExamSession.get(session_id)
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    if session.user_id != current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    if session.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session not active"
        )
    
    # Record violation
    session.record_violation(request.violation_type)
    await session.save()
    
    # Log event
    event = ProctoringEvent(
        session_id=session_id,
        user_id=current_user["user_id"],
        event_type=request.violation_type,
        severity="violation",
        description=request.description or f"{request.violation_type} detected",
        metadata=request.metadata
    )
    await event.insert()
    
    # Check if should auto-terminate
    should_terminate = False
    terminate_reason = None
    
    if session.settings.max_tab_switches and session.tab_switch_count >= session.settings.max_tab_switches:
        should_terminate = True
        terminate_reason = "Maximum tab switches exceeded"
    
    if session.trust_score < 30:
        should_terminate = True
        terminate_reason = "Trust score too low"
    
    if should_terminate and session.settings.auto_submit_on_violation:
        session.status = "terminated"
        session.flag_reason = terminate_reason
        session.is_flagged = True
        session.end_time = datetime.utcnow()
        await session.save()
        
        return {
            "warning": "Session terminated",
            "reason": terminate_reason,
            "trust_score": session.trust_score
        }
    
    return {
        "warning": f"Violation recorded: {request.violation_type}",
        "total_violations": session.total_violations,
        "trust_score": session.trust_score,
        "tab_switches": session.tab_switch_count,
        "is_flagged": session.is_flagged
    }


@router.put("/sessions/{session_id}/state")
async def update_session_state(
    session_id: str,
    request: UpdateSessionRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Update session proctoring state (webcam, face, fullscreen).
    """
    session = await ExamSession.get(session_id)
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    if session.user_id != current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    if request.webcam_active is not None:
        session.webcam_active = request.webcam_active
    
    if request.face_detected is not None:
        old_state = session.face_detected
        session.face_detected = request.face_detected
        
        # Log face state changes
        if old_state and not request.face_detected:
            event = ProctoringEvent(
                session_id=session_id,
                user_id=current_user["user_id"],
                event_type="face_lost",
                severity="warning",
                description="Face not detected"
            )
            await event.insert()
    
    if request.is_fullscreen is not None:
        old_state = session.is_fullscreen
        session.is_fullscreen = request.is_fullscreen
        
        # Log fullscreen exit
        if old_state and not request.is_fullscreen:
            session.record_violation("fullscreen_exit")
            event = ProctoringEvent(
                session_id=session_id,
                user_id=current_user["user_id"],
                event_type="fullscreen_exit",
                severity="violation",
                description="Exited fullscreen mode"
            )
            await event.insert()
    
    session.updated_at = datetime.utcnow()
    await session.save()
    
    return {
        "webcam_active": session.webcam_active,
        "face_detected": session.face_detected,
        "is_fullscreen": session.is_fullscreen,
        "trust_score": session.trust_score
    }


@router.post("/sessions/{session_id}/end")
async def end_session(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    End a proctored exam session.
    """
    session = await ExamSession.get(session_id)
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    if session.user_id != current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    if session.status not in ["active", "paused"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session not active"
        )
    
    session.status = "completed"
    session.end_time = datetime.utcnow()
    await session.save()
    
    # Log session end
    event = ProctoringEvent(
        session_id=session_id,
        user_id=current_user["user_id"],
        event_type="session_end",
        severity="info",
        description="Exam session ended normally"
    )
    await event.insert()
    
    return {
        "message": "Session ended",
        "trust_score": session.trust_score,
        "total_violations": session.total_violations,
        "is_flagged": session.is_flagged,
        "needs_review": session.needs_review
    }


@router.get("/sessions/{session_id}")
async def get_session(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get session details.
    """
    session = await ExamSession.get(session_id)
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Users can see their own sessions, admins can see all
    user = await User.get(current_user["user_id"])
    if session.user_id != current_user["user_id"] and user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return {
        "id": str(session.id),
        "exam_type": session.exam_type,
        "exam_id": session.exam_id,
        "status": session.status,
        "settings": session.settings.dict(),
        "duration_minutes": session.duration_minutes,
        "time_remaining_seconds": session.time_remaining_seconds,
        "actual_start": session.actual_start,
        "end_time": session.end_time,
        "webcam_active": session.webcam_active,
        "face_detected": session.face_detected,
        "is_fullscreen": session.is_fullscreen,
        "total_violations": session.total_violations,
        "tab_switch_count": session.tab_switch_count,
        "copy_paste_count": session.copy_paste_count,
        "trust_score": session.trust_score,
        "is_flagged": session.is_flagged,
        "flag_reason": session.flag_reason,
        "needs_review": session.needs_review
    }


@router.get("/sessions/{session_id}/events")
async def get_session_events(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get all events for a session (admin only).
    """
    user = await User.get(current_user["user_id"])
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    events = await ProctoringEvent.find(
        {"session_id": session_id}
    ).sort("-timestamp").to_list()
    
    return {
        "events": [
            {
                "id": str(e.id),
                "event_type": e.event_type,
                "severity": e.severity,
                "description": e.description,
                "metadata": e.metadata,
                "timestamp": e.timestamp
            }
            for e in events
        ]
    }


@router.get("/sessions/flagged")
async def get_flagged_sessions(current_user: dict = Depends(get_current_user)):
    """
    Get all flagged sessions for review (admin only).
    """
    user = await User.get(current_user["user_id"])
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    sessions = await ExamSession.find(
        {"is_flagged": True, "needs_review": True}
    ).sort("-updated_at").to_list()
    
    flagged_list = []
    for s in sessions:
        exam_user = await User.get(s.user_id)
        flagged_list.append({
            "session_id": str(s.id),
            "user_id": s.user_id,
            "username": exam_user.username if exam_user else "Unknown",
            "exam_type": s.exam_type,
            "exam_id": s.exam_id,
            "trust_score": s.trust_score,
            "total_violations": s.total_violations,
            "flag_reason": s.flag_reason,
            "status": s.status,
            "created_at": s.created_at
        })
    
    return {"flagged_sessions": flagged_list}


@router.post("/sessions/{session_id}/review")
async def review_flagged_session(
    session_id: str,
    approved: bool,
    notes: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Review and resolve a flagged session (admin only).
    """
    user = await User.get(current_user["user_id"])
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    session = await ExamSession.get(session_id)
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    session.needs_review = False
    await session.save()
    
    # Log review
    event = ProctoringEvent(
        session_id=session_id,
        user_id=current_user["user_id"],
        event_type="admin_review",
        severity="info",
        description=f"Session {'approved' if approved else 'rejected'} by admin",
        metadata={"approved": approved, "notes": notes, "reviewer": current_user["user_id"]}
    )
    await event.insert()
    
    return {
        "message": f"Session {'approved' if approved else 'rejected'}",
        "session_id": session_id
    }


# ============ WebSocket for Real-time Proctoring ============

@router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """
    WebSocket connection for real-time proctoring updates.
    """
    await session_manager.connect(session_id, websocket)
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Process incoming proctoring data
            if message.get("type") == "face_detection":
                # Handle face detection updates
                session = await ExamSession.get(session_id)
                if session:
                    session.face_detected = message.get("detected", False)
                    if not session.face_detected:
                        session.face_away_count += 1
                    await session.save()
            
            elif message.get("type") == "heartbeat":
                # Respond to heartbeat
                await websocket.send_json({"type": "heartbeat_ack"})
            
    except WebSocketDisconnect:
        session_manager.disconnect(session_id)
