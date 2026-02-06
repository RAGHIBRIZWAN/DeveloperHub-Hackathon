"""
Codeforces API Integration
=========================
Fetch problems from Codeforces for practice and contest creation.
"""

import httpx
import hashlib
import random
import time
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, HTTPException, status, Query
from pydantic import BaseModel
from app.core.config import settings

router = APIRouter()

# Cache for Codeforces problems
_problems_cache = {
    "data": None,
    "last_updated": None,
    "cache_duration": timedelta(minutes=30)  # Cache for 30 minutes
}


def generate_api_sig(method_name: str, params: dict = None) -> dict:
    """
    Generate Codeforces API signature for authenticated requests.
    
    Args:
        method_name: API method name (e.g., 'problemset.problems')
        params: Additional parameters for the request
    
    Returns:
        Dictionary with apiKey, time, and apiSig parameters
    """
    if params is None:
        params = {}
    
    # Generate random string (6 characters)
    rand = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    
    # Current UNIX timestamp
    current_time = int(time.time())
    
    # Add required parameters
    params['apiKey'] = settings.CODEFORCES_API_KEY
    params['time'] = str(current_time)
    
    # Sort parameters alphabetically
    sorted_params = sorted(params.items())
    
    # Create parameter string
    param_string = '&'.join([f'{key}={value}' for key, value in sorted_params])
    
    # Create hash string: rand/methodName?param1=value1&param2=value2#secret
    hash_string = f"{rand}/{method_name}?{param_string}#{settings.CODEFORCES_API_SECRET}"
    
    # Generate SHA-512 hash
    api_sig = rand + hashlib.sha512(hash_string.encode()).hexdigest()
    
    return {
        'apiKey': settings.CODEFORCES_API_KEY,
        'time': str(current_time),
        'apiSig': api_sig
    }


class CodeforcesProblem(BaseModel):
    """Codeforces problem model."""
    contest_id: int
    index: str
    name: str
    rating: Optional[int] = None
    tags: List[str] = []
    solved_count: int = 0


async def fetch_codeforces_problems():
    """
    Fetch all problems from Codeforces API.
    Uses caching to reduce API calls.
    """
    global _problems_cache
    
    # Check cache
    if _problems_cache["data"] is not None:
        if datetime.utcnow() - _problems_cache["last_updated"] < _problems_cache["cache_duration"]:
            return _problems_cache["data"]
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Generate authenticated API signature
            auth_params = generate_api_sig('problemset.problems')
            
            # Make authenticated request
            response = await client.get(
                f"{settings.CODEFORCES_API_URL}/problemset.problems",
                params=auth_params
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Failed to fetch problems from Codeforces"
                )
            
            data = response.json()
            
            if data.get("status") != "OK":
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=data.get("comment", "Codeforces API error")
                )
            
            problems = data.get("result", {}).get("problems", [])
            problem_statistics = data.get("result", {}).get("problemStatistics", [])
            
            # Create a map of solved counts
            solved_map = {
                (stat.get("contestId"), stat.get("index")): stat.get("solvedCount", 0)
                for stat in problem_statistics
            }
            
            # Process problems
            processed_problems = []
            for prob in problems:
                contest_id = prob.get("contestId")
                index = prob.get("index")
                
                if contest_id is None:
                    continue
                    
                processed_problems.append({
                    "contest_id": contest_id,
                    "index": index,
                    "name": prob.get("name", ""),
                    "rating": prob.get("rating"),
                    "tags": prob.get("tags", []),
                    "solved_count": solved_map.get((contest_id, index), 0)
                })
            
            # Update cache
            _problems_cache["data"] = processed_problems
            _problems_cache["last_updated"] = datetime.utcnow()
            
            return processed_problems
            
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to connect to Codeforces: {str(e)}"
        )


@router.get("/problems")
async def get_codeforces_problems(
    rating_min: Optional[int] = Query(None, ge=800, le=3500),
    rating_max: Optional[int] = Query(None, ge=800, le=3500),
    tags: Optional[str] = Query(None, description="Comma-separated tags"),
    search: Optional[str] = Query(None, description="Search by problem name"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """
    Get Codeforces problems with filtering and pagination.
    
    - **rating_min**: Minimum problem rating (800-3500)
    - **rating_max**: Maximum problem rating (800-3500)
    - **tags**: Comma-separated tags (e.g., "dp,graphs,binary search")
    - **search**: Search by problem name
    - **page**: Page number
    - **limit**: Results per page (max 100)
    """
    problems = await fetch_codeforces_problems()
    
    # Filter by rating
    if rating_min is not None:
        problems = [p for p in problems if p.get("rating") and p["rating"] >= rating_min]
    
    if rating_max is not None:
        problems = [p for p in problems if p.get("rating") and p["rating"] <= rating_max]
    
    # Filter by tags
    if tags:
        tag_list = [t.strip().lower() for t in tags.split(",") if t.strip()]
        problems = [
            p for p in problems 
            if any(tag.lower() in [t.lower() for t in p.get("tags", [])] for tag in tag_list)
        ]
    
    # Search by name
    if search:
        search_lower = search.lower()
        problems = [p for p in problems if search_lower in p.get("name", "").lower()]
    
    # Sort by rating (descending) and then by solved count
    problems.sort(key=lambda x: (x.get("rating") or 0, -x.get("solved_count", 0)), reverse=False)
    
    # Pagination
    total = len(problems)
    start = (page - 1) * limit
    end = start + limit
    paginated_problems = problems[start:end]
    
    return {
        "problems": paginated_problems,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit
    }


@router.get("/problems/tags")
async def get_problem_tags():
    """
    Get all unique tags from Codeforces problems.
    """
    problems = await fetch_codeforces_problems()
    
    tags_count = {}
    for problem in problems:
        for tag in problem.get("tags", []):
            tags_count[tag] = tags_count.get(tag, 0) + 1
    
    # Sort by count
    sorted_tags = sorted(tags_count.items(), key=lambda x: x[1], reverse=True)
    
    return {
        "tags": [{"name": tag, "count": count} for tag, count in sorted_tags]
    }


@router.get("/problems/search")
async def search_problems(
    query: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(10, ge=1, le=50)
):
    """
    Search Codeforces problems by name (for admin contest creation).
    
    Returns problems matching the query for quick selection.
    """
    problems = await fetch_codeforces_problems()
    
    query_lower = query.lower()
    matched = [
        p for p in problems 
        if query_lower in p.get("name", "").lower() or 
           query_lower in f"{p.get('contest_id')}{p.get('index')}".lower()
    ][:limit]
    
    return {
        "problems": matched,
        "total": len(matched)
    }
