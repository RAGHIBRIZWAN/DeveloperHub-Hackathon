"""
AI Tutor API Routes
==================
Bilingual AI tutoring with voice support.
"""

from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from pydantic import BaseModel
import aiohttp
import json

from app.core.config import settings
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()


# ============ Schemas ============

class ChatMessage(BaseModel):
    """Chat message."""
    role: str  # user, assistant
    content: str


class TutorChatRequest(BaseModel):
    """AI tutor chat request."""
    message: str
    context: Optional[str] = None  # Current lesson/code context
    language: str = "en"  # en, ur
    history: List[ChatMessage] = []


class CodeHelpRequest(BaseModel):
    """Request for code help."""
    code: str
    error_message: Optional[str] = None
    question: Optional[str] = None
    programming_language: str = "python"
    instruction_language: str = "en"


class ExplainConceptRequest(BaseModel):
    """Request to explain a concept."""
    concept: str
    programming_language: str = "python"
    instruction_language: str = "en"
    difficulty_level: str = "beginner"


# ============ System Prompts ============

SYSTEM_PROMPT_EN = """You are CodeMentor, a friendly and patient AI programming tutor for CodeHub, 
an educational platform for students in Pakistan. You teach C++, Python, and JavaScript.

Guidelines:
1. Always be encouraging and supportive
2. Explain concepts in simple terms suitable for beginners
3. Use real-world analogies when possible
4. Provide code examples when helpful
5. If code has errors, explain what's wrong and how to fix it
6. Encourage students to try solutions themselves before giving full answers
7. Keep responses concise but informative

You understand the Pakistani educational context and can relate to local examples when helpful."""

SYSTEM_PROMPT_UR = """آپ CodeMentor ہیں، CodeHub کے لیے ایک دوستانہ اور صبر والے AI پروگرامنگ ٹیوٹر، 
پاکستان کے طلباء کے لیے ایک تعلیمی پلیٹ فارم۔ آپ C++، Python، اور JavaScript سکھاتے ہیں۔

ہدایات:
1. ہمیشہ حوصلہ افزائی اور مدد کریں
2. تصورات کو آسان الفاظ میں سمجھائیں جو beginners کے لیے موزوں ہوں
3. جب ممکن ہو حقیقی دنیا کی مثالیں استعمال کریں
4. جب مددگار ہو کوڈ کی مثالیں دیں
5. اگر کوڈ میں غلطیاں ہیں تو وضاحت کریں کہ کیا غلط ہے اور اسے کیسے ٹھیک کریں
6. طلباء کو مکمل جواب دینے سے پہلے خود حل کرنے کی کوشش کرنے کی ترغیب دیں
7. جوابات مختصر لیکن معلوماتی رکھیں

آپ پاکستانی تعلیمی سیاق و سباق کو سمجھتے ہیں۔"""


# ============ AI Service Functions ============

async def chat_with_groq(
    messages: List[dict],
    system_prompt: str,
    max_tokens: int = 1024
) -> str:
    """
    Chat with Groq LLM.
    """
    url = "https://api.groq.com/openai/v1/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "llama-3.1-70b-versatile",
        "messages": [
            {"role": "system", "content": system_prompt},
            *messages
        ],
        "max_tokens": max_tokens,
        "temperature": 0.7
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=payload, headers=headers) as response:
            if response.status != 200:
                error_text = await response.text()
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"AI service error: {error_text}"
                )
            
            data = await response.json()
            return data["choices"][0]["message"]["content"]


async def generate_voice_response(text: str, language: str = "en") -> bytes:
    """
    Generate voice response using Edge TTS.
    Returns audio bytes.
    """
    import edge_tts
    import io
    
    # Select voice based on language
    if language == "ur":
        voice = "ur-PK-UzmaNeural"  # Urdu female voice
    else:
        voice = "en-US-JennyNeural"  # English female voice
    
    communicate = edge_tts.Communicate(text, voice)
    audio_data = io.BytesIO()
    
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_data.write(chunk["data"])
    
    return audio_data.getvalue()


async def transcribe_audio(audio_file: UploadFile) -> str:
    """
    Transcribe audio using OpenAI Whisper API.
    """
    url = "https://api.openai.com/v1/audio/transcriptions"
    
    headers = {
        "Authorization": f"Bearer {settings.OPENAI_API_KEY}"
    }
    
    async with aiohttp.ClientSession() as session:
        data = aiohttp.FormData()
        content = await audio_file.read()
        data.add_field(
            "file",
            content,
            filename=audio_file.filename,
            content_type=audio_file.content_type
        )
        data.add_field("model", "whisper-1")
        
        async with session.post(url, data=data, headers=headers) as response:
            if response.status != 200:
                error_text = await response.text()
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Transcription error: {error_text}"
                )
            
            result = await response.json()
            return result["text"]


# ============ Routes ============

@router.post("/chat")
async def chat_with_tutor(
    request: TutorChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Chat with AI tutor.
    Supports bilingual (English/Urdu) responses.
    """
    # Select system prompt based on language
    system_prompt = SYSTEM_PROMPT_UR if request.language == "ur" else SYSTEM_PROMPT_EN
    
    # Add context if provided
    if request.context:
        system_prompt += f"\n\nCurrent context:\n{request.context}"
    
    # Build message history
    messages = [
        {"role": msg.role, "content": msg.content}
        for msg in request.history[-10:]  # Keep last 10 messages for context
    ]
    messages.append({"role": "user", "content": request.message})
    
    try:
        response = await chat_with_groq(messages, system_prompt)
        
        return {
            "response": response,
            "language": request.language
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get AI response: {str(e)}"
        )


@router.post("/chat/voice")
async def chat_with_voice_response(
    request: TutorChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Chat with AI tutor and get voice response.
    """
    # Get text response first
    system_prompt = SYSTEM_PROMPT_UR if request.language == "ur" else SYSTEM_PROMPT_EN
    
    if request.context:
        system_prompt += f"\n\nCurrent context:\n{request.context}"
    
    messages = [
        {"role": msg.role, "content": msg.content}
        for msg in request.history[-10:]
    ]
    messages.append({"role": "user", "content": request.message})
    
    try:
        text_response = await chat_with_groq(messages, system_prompt)
        
        # Generate voice (limit text length for voice)
        voice_text = text_response[:500] if len(text_response) > 500 else text_response
        audio_bytes = await generate_voice_response(voice_text, request.language)
        
        import base64
        audio_base64 = base64.b64encode(audio_bytes).decode()
        
        return {
            "response": text_response,
            "audio": audio_base64,
            "language": request.language
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate response: {str(e)}"
        )


@router.post("/help/code")
async def get_code_help(
    request: CodeHelpRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Get help with code - explain errors, suggest fixes.
    """
    system_prompt = SYSTEM_PROMPT_UR if request.instruction_language == "ur" else SYSTEM_PROMPT_EN
    
    prompt = f"""Programming Language: {request.programming_language}

Code:
```{request.programming_language}
{request.code}
```
"""
    
    if request.error_message:
        prompt += f"\nError Message: {request.error_message}\n"
    
    if request.question:
        prompt += f"\nStudent's Question: {request.question}\n"
    else:
        prompt += "\nPlease analyze this code and help the student understand any issues."
    
    messages = [{"role": "user", "content": prompt}]
    
    try:
        response = await chat_with_groq(messages, system_prompt)
        
        return {
            "explanation": response,
            "language": request.instruction_language
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze code: {str(e)}"
        )


@router.post("/explain")
async def explain_concept(
    request: ExplainConceptRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Explain a programming concept.
    """
    system_prompt = SYSTEM_PROMPT_UR if request.instruction_language == "ur" else SYSTEM_PROMPT_EN
    
    if request.instruction_language == "ur":
        prompt = f"""براہ کرم {request.programming_language} میں "{request.concept}" کا تصور سمجھائیں۔
سطح: {request.difficulty_level}
آسان الفاظ اور کوڈ کی مثالوں کے ساتھ وضاحت کریں۔"""
    else:
        prompt = f"""Please explain the concept of "{request.concept}" in {request.programming_language}.
Level: {request.difficulty_level}
Explain with simple terms and code examples."""
    
    messages = [{"role": "user", "content": prompt}]
    
    try:
        response = await chat_with_groq(messages, system_prompt)
        
        return {
            "explanation": response,
            "concept": request.concept,
            "language": request.instruction_language
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to explain concept: {str(e)}"
        )


@router.post("/transcribe")
async def transcribe_voice_message(
    audio: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Transcribe voice message to text.
    Supports both English and Urdu.
    """
    # Validate file type
    allowed_types = ["audio/webm", "audio/mp3", "audio/wav", "audio/ogg", "audio/mpeg"]
    if audio.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid audio format. Allowed: {allowed_types}"
        )
    
    try:
        transcript = await transcribe_audio(audio)
        
        return {
            "transcript": transcript
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Transcription failed: {str(e)}"
        )


@router.post("/translate")
async def translate_text(
    text: str,
    source_language: str = "en",
    target_language: str = "ur",
    current_user: dict = Depends(get_current_user)
):
    """
    Translate text between English and Urdu.
    """
    if source_language == "en" and target_language == "ur":
        prompt = f"Translate the following English text to Urdu:\n\n{text}"
    elif source_language == "ur" and target_language == "en":
        prompt = f"Translate the following Urdu text to English:\n\n{text}"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only English-Urdu translation is supported"
        )
    
    system_prompt = "You are a translator. Provide only the translation without any additional text."
    
    messages = [{"role": "user", "content": prompt}]
    
    try:
        translation = await chat_with_groq(messages, system_prompt, max_tokens=2048)
        
        return {
            "original": text,
            "translation": translation,
            "source_language": source_language,
            "target_language": target_language
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Translation failed: {str(e)}"
        )
