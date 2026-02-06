"""
API Routes Package
=================
Main API router that includes all feature routers.
"""

from fastapi import APIRouter

from .auth import router as auth_router
from .lessons import router as lessons_router
from .code import router as code_router
from .ai import router as ai_router
from .mcq import router as mcq_router
from .compete import router as compete_router
from .gamify import router as gamify_router
from .proctor import router as proctor_router
from .admin import router as admin_router
from .notifications import router as notifications_router
from .codeforces import router as codeforces_router
from .practice import router as practice_router
from .problems import router as problems_router

router = APIRouter()

# Include all feature routers
router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
router.include_router(lessons_router, prefix="/lessons", tags=["Lessons"])
router.include_router(code_router, prefix="/code", tags=["Code Execution"])
router.include_router(ai_router, prefix="/ai", tags=["AI Tutor"])
router.include_router(mcq_router, prefix="/mcq", tags=["MCQ"])
router.include_router(compete_router, prefix="/compete", tags=["Competitions"])
router.include_router(gamify_router, prefix="/gamify", tags=["Gamification"])
router.include_router(proctor_router, prefix="/proctor", tags=["Proctoring"])
router.include_router(admin_router, prefix="/admin", tags=["Admin"])
router.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])
router.include_router(codeforces_router, prefix="/codeforces", tags=["Codeforces"])
router.include_router(practice_router, prefix="/practice", tags=["Practice & Submissions"])
router.include_router(problems_router, prefix="/problems", tags=["Problems & Code Execution"])
