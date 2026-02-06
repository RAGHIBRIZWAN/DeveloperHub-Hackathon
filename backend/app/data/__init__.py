"""
Data package initialization.
"""
from app.data.cp_problems import CP_PROBLEMS, get_problems_by_rating, get_problems_by_difficulty, get_problem_by_id
from app.data.module_problems import (
    PF_MCQ_QUESTIONS, OOP_MCQ_QUESTIONS, DSA_MCQ_QUESTIONS,
    PF_CODING_PROBLEMS, OOP_CODING_PROBLEMS, DSA_CODING_PROBLEMS,
    get_all_mcqs, get_mcqs_by_module, get_all_coding_problems,
    get_coding_problems_by_module, get_mcq_by_id, get_coding_problem_by_id
)

__all__ = [
    'CP_PROBLEMS',
    'get_problems_by_rating',
    'get_problems_by_difficulty', 
    'get_problem_by_id',
    'PF_MCQ_QUESTIONS',
    'OOP_MCQ_QUESTIONS',
    'DSA_MCQ_QUESTIONS',
    'PF_CODING_PROBLEMS',
    'OOP_CODING_PROBLEMS',
    'DSA_CODING_PROBLEMS',
    'get_all_mcqs',
    'get_mcqs_by_module',
    'get_all_coding_problems',
    'get_coding_problems_by_module',
    'get_mcq_by_id',
    'get_coding_problem_by_id'
]
