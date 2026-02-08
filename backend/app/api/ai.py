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


# ============================================================================
# LEARN SECTION — Hardcoded Topics & Lesson Content
# ============================================================================

LEARN_TOPICS = {
    "programming-fundamentals": [
        "Introduction to Programming",
        "Variables and Data Types",
        "Operators and Expressions",
        "Control Flow — If / Else",
        "Loops — For and While",
        "Functions and Scope",
        "Arrays and Strings",
        "Input / Output",
    ],
    "oop": [
        "Introduction to OOP",
        "Classes and Objects",
        "Constructors and Destructors",
        "Encapsulation",
        "Inheritance",
        "Polymorphism",
        "Abstraction",
        "Composition vs Inheritance",
    ],
    "data-structures": [
        "Introduction to Data Structures",
        "Arrays and Dynamic Arrays",
        "Linked Lists",
        "Stacks",
        "Queues",
        "Hash Tables",
        "Trees and Binary Trees",
        "Graphs",
        "Sorting Algorithms",
    ],
}

LESSON_CONTENT = {
    # ── Programming Fundamentals ──────────────────────────────────────
    "Introduction to Programming": """
# Introduction to Programming

## What is Programming?

Programming is the process of giving a computer **step-by-step instructions** to solve a problem. Think of it like writing a recipe — each line tells the computer exactly what to do next.

## Why Learn Programming?

- **Automation** — let the computer do repetitive work for you
- **Problem Solving** — sharpen your logical thinking
- **Career** — software engineering is one of the highest-demand fields
- **Creativity** — build apps, games, websites, anything you imagine

## How a Program Runs

1. You write **source code** in a programming language (Python, C++, etc.)
2. The computer translates it into machine instructions (compilation or interpretation)
3. The CPU executes those instructions one by one

## Your First Program — Hello World

### Python
```python
print("Hello, World!")
print("Welcome to programming!")
```

### C++
```cpp
#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}
```

### JavaScript
```javascript
console.log("Hello, World!");
console.log("Welcome to programming!");
```

## Key Takeaways

| Concept | Description |
|---------|-------------|
| Source Code | Human-readable instructions |
| Compiler / Interpreter | Translates code to machine language |
| Execution | The CPU runs the translated instructions |
| Output | The result the program produces |

> 💡 **Tip:** Don't worry about memorizing syntax right away. Focus on understanding *what* the program is doing logically.
""",

    "Variables and Data Types": """
# Variables and Data Types

## What is a Variable?

A **variable** is a named container that stores a value in memory. You can think of it as a labeled box where you put data.

## Declaring Variables

### Python
```python
name = "Ali"        # string
age = 20            # integer
gpa = 3.85          # float
is_student = True   # boolean
```

### C++
```cpp
string name = "Ali";
int age = 20;
double gpa = 3.85;
bool is_student = true;
```

### JavaScript
```javascript
let name = "Ali";
let age = 20;
let gpa = 3.85;
let isStudent = true;
```

## Common Data Types

| Type | Description | Example |
|------|-------------|---------|
| **Integer** | Whole numbers | `42`, `-7`, `0` |
| **Float / Double** | Decimal numbers | `3.14`, `-0.5` |
| **String** | Text | `"Hello"`, `'World'` |
| **Boolean** | True or False | `True`, `false` |
| **Character** | Single letter (C++) | `'A'`, `'z'` |

## Type Conversion

```python
# Python type conversion
x = "42"
y = int(x)     # string → integer
z = float(x)   # string → float
w = str(y)     # integer → string
```

## Naming Rules

- Start with a letter or underscore
- No spaces — use `camelCase` or `snake_case`
- Case-sensitive (`age` ≠ `Age`)
- Avoid reserved keywords (`if`, `for`, `class`)

> 💡 **Tip:** Choose descriptive variable names. `student_name` is much better than `x`.
""",

    "Operators and Expressions": """
# Operators and Expressions

## Arithmetic Operators

| Operator | Meaning | Example | Result |
|----------|---------|---------|--------|
| `+` | Addition | `5 + 3` | `8` |
| `-` | Subtraction | `10 - 4` | `6` |
| `*` | Multiplication | `6 * 7` | `42` |
| `/` | Division | `15 / 4` | `3.75` |
| `//` | Floor Division | `15 // 4` | `3` |
| `%` | Modulus | `10 % 3` | `1` |
| `**` | Exponent | `2 ** 3` | `8` |

## Comparison Operators

```python
x = 10
y = 20

print(x == y)   # False  — equal?
print(x != y)   # True   — not equal?
print(x < y)    # True   — less than?
print(x >= y)   # False  — greater or equal?
```

## Logical Operators

```python
a = True
b = False

print(a and b)   # False
print(a or b)    # True
print(not a)     # False
```

## Assignment Operators

```python
x = 10
x += 5    # x = x + 5  → 15
x -= 3    # x = x - 3  → 12
x *= 2    # x = x * 2  → 24
x //= 4   # x = x // 4 → 6
```

## Operator Precedence

1. `()` — Parentheses first
2. `**` — Exponents
3. `*`, `/`, `//`, `%` — Multiplication / Division
4. `+`, `-` — Addition / Subtraction
5. Comparison (`<`, `>`, `==`)
6. Logical (`not`, `and`, `or`)

> 💡 **Tip:** When in doubt, use parentheses to make your intent clear!
""",

    "Control Flow — If / Else": """
# Control Flow — If / Else

## What is Control Flow?

Control flow lets your program **make decisions** based on conditions.

## If Statement

### Python
```python
age = 18

if age >= 18:
    print("You can vote!")
```

### C++
```cpp
int age = 18;
if (age >= 18) {
    cout << "You can vote!" << endl;
}
```

## If-Else

```python
temperature = 35

if temperature > 30:
    print("It's hot outside! 🔥")
else:
    print("The weather is pleasant 🌤️")
```

## If-Elif-Else Chain

```python
score = 75

if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
elif score >= 60:
    grade = "D"
else:
    grade = "F"

print(f"Your grade: {grade}")
```

## Nested Conditions

```python
is_student = True
age = 22

if is_student:
    if age < 25:
        print("Student discount: 50% off!")
    else:
        print("Student discount: 30% off!")
else:
    print("Regular price")
```

## Ternary Operator

```python
age = 20
status = "adult" if age >= 18 else "minor"
print(status)  # adult
```

> 💡 **Tip:** Keep your conditions simple. If nesting gets too deep, consider using functions.
""",

    "Loops — For and While": """
# Loops — For and While

## Why Loops?

Loops let you **repeat** a block of code multiple times without writing it over and over.

## For Loop

### Python
```python
# Print numbers 1 to 5
for i in range(1, 6):
    print(i)

# Iterate over a list
fruits = ["apple", "banana", "cherry"]
for fruit in fruits:
    print(f"I like {fruit}")
```

### C++
```cpp
for (int i = 1; i <= 5; i++) {
    cout << i << endl;
}
```

## While Loop

```python
count = 1
while count <= 5:
    print(f"Count: {count}")
    count += 1
```

## Break and Continue

```python
# break — stop the loop entirely
for i in range(10):
    if i == 5:
        break
    print(i)   # prints 0,1,2,3,4

# continue — skip current iteration
for i in range(10):
    if i % 2 == 0:
        continue
    print(i)   # prints 1,3,5,7,9
```

## Nested Loops

```python
# Multiplication table
for i in range(1, 4):
    for j in range(1, 4):
        print(f"{i} x {j} = {i*j}", end="   ")
    print()  # new line
```

**Output:**
```
1 x 1 = 1   1 x 2 = 2   1 x 3 = 3
2 x 1 = 2   2 x 2 = 4   2 x 3 = 6
3 x 1 = 3   3 x 2 = 6   3 x 3 = 9
```

## Common Patterns

| Pattern | Use Case |
|---------|----------|
| `for i in range(n)` | Repeat n times |
| `for item in list` | Process each item |
| `while condition` | Repeat until condition is false |
| `while True` + `break` | Loop with exit condition inside |

> 💡 **Tip:** Always make sure your while loop can eventually end, or you'll get an infinite loop!
""",

    "Functions and Scope": """
# Functions and Scope

## What is a Function?

A **function** is a reusable block of code that performs a specific task. It helps you organize code and avoid repetition.

## Defining Functions

### Python
```python
def greet(name):
    return f"Hello, {name}!"

message = greet("Ali")
print(message)  # Hello, Ali!
```

### C++
```cpp
string greet(string name) {
    return "Hello, " + name + "!";
}
```

## Parameters and Return Values

```python
def calculate_area(length, width):
    area = length * width
    return area

result = calculate_area(5, 3)
print(f"Area: {result}")  # Area: 15
```

## Default Parameters

```python
def power(base, exponent=2):
    return base ** exponent

print(power(5))      # 25 (uses default exponent=2)
print(power(2, 10))  # 1024
```

## Variable Scope

```python
x = "global"  # Global scope

def my_function():
    y = "local"   # Local scope
    print(x)      # Can access global
    print(y)      # Can access local

my_function()
# print(y)  # ERROR! y is not accessible here
```

## Multiple Return Values (Python)

```python
def get_min_max(numbers):
    return min(numbers), max(numbers)

low, high = get_min_max([3, 1, 7, 2, 9])
print(f"Min: {low}, Max: {high}")  # Min: 1, Max: 9
```

## Lambda Functions

```python
square = lambda x: x ** 2
print(square(5))  # 25

numbers = [3, 1, 4, 1, 5]
sorted_nums = sorted(numbers, key=lambda x: -x)
print(sorted_nums)  # [5, 4, 3, 1, 1]
```

> 💡 **Tip:** A function should do one thing and do it well. If it's getting too long, break it into smaller functions.
""",

    "Arrays and Strings": """
# Arrays and Strings

## Arrays (Lists in Python)

An **array** is an ordered collection of elements stored at contiguous memory locations.

### Python Lists
```python
numbers = [10, 20, 30, 40, 50]
print(numbers[0])    # 10  — first element
print(numbers[-1])   # 50  — last element
print(len(numbers))  # 5   — length

# Modify
numbers.append(60)    # add to end
numbers.insert(0, 5)  # insert at index 0
numbers.pop()         # remove last
```

### C++ Arrays
```cpp
int numbers[] = {10, 20, 30, 40, 50};
int size = sizeof(numbers) / sizeof(numbers[0]);

for (int i = 0; i < size; i++) {
    cout << numbers[i] << " ";
}
```

## Slicing (Python)

```python
data = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

print(data[2:5])    # [2, 3, 4]
print(data[:3])     # [0, 1, 2]
print(data[7:])     # [7, 8, 9]
print(data[::2])    # [0, 2, 4, 6, 8] — every 2nd element
```

## Strings

Strings are sequences of characters.

```python
text = "Hello, World!"

print(text.upper())       # HELLO, WORLD!
print(text.lower())       # hello, world!
print(text.split(", "))   # ['Hello', 'World!']
print(text.replace("World", "Python"))  # Hello, Python!
print(len(text))          # 13
```

## Common Array Operations

| Operation | Python | C++ |
|-----------|--------|-----|
| Length | `len(arr)` | `arr.size()` |
| Add | `arr.append(x)` | `arr.push_back(x)` |
| Remove | `arr.pop()` | `arr.pop_back()` |
| Sort | `arr.sort()` | `sort(arr.begin(), arr.end())` |
| Search | `x in arr` | `find(arr.begin(), arr.end(), x)` |

> 💡 **Tip:** In Python, strings are immutable — you can't change individual characters. Create a new string instead.
""",

    "Input / Output": """
# Input / Output

## Reading Input

### Python
```python
name = input("Enter your name: ")
age = int(input("Enter your age: "))
print(f"Hello {name}, you are {age} years old!")
```

### C++
```cpp
#include <iostream>
using namespace std;

int main() {
    string name;
    int age;

    cout << "Enter your name: ";
    cin >> name;
    cout << "Enter your age: ";
    cin >> age;

    cout << "Hello " << name << ", you are " << age << " years old!" << endl;
    return 0;
}
```

## Formatted Output (Python)

```python
name = "Ali"
score = 95.6789

# f-string (recommended)
print(f"Name: {name}, Score: {score:.2f}")

# .format()
print("Name: {}, Score: {:.2f}".format(name, score))

# %-formatting (older style)
print("Name: %s, Score: %.2f" % (name, score))
```

## File I/O

```python
# Writing to a file
with open("output.txt", "w") as f:
    f.write("Hello, File!\\n")
    f.write("Second line\\n")

# Reading from a file
with open("output.txt", "r") as f:
    content = f.read()
    print(content)
```

## Reading Multiple Values

```python
# Read space-separated values on one line
a, b = map(int, input().split())
print(f"Sum: {a + b}")

# Read a list of numbers
numbers = list(map(int, input().split()))
print(f"Average: {sum(numbers) / len(numbers)}")
```

> 💡 **Tip:** Always validate user input in real applications. Users will type unexpected things!
""",

    # ── OOP ───────────────────────────────────────────────────────────
    "Introduction to OOP": """
# Introduction to Object-Oriented Programming

## What is OOP?

**Object-Oriented Programming** is a programming paradigm that organizes code into **objects** — bundles of data (attributes) and behavior (methods).

## Four Pillars of OOP

| Pillar | Description |
|--------|-------------|
| **Encapsulation** | Bundle data and methods together; hide internal details |
| **Inheritance** | Create new classes based on existing ones |
| **Polymorphism** | Same interface, different implementations |
| **Abstraction** | Show only essential features, hide complexity |

## Procedural vs OOP

```python
# Procedural approach
student_name = "Ali"
student_grade = "A"

def print_student(name, grade):
    print(f"{name}: {grade}")

# OOP approach
class Student:
    def __init__(self, name, grade):
        self.name = name
        self.grade = grade

    def display(self):
        print(f"{self.name}: {self.grade}")

s = Student("Ali", "A")
s.display()
```

## Real-World Analogy

Think of a **Car**:
- **Attributes:** color, brand, speed, fuel level
- **Methods:** start(), accelerate(), brake(), refuel()
- **Encapsulation:** You press the gas pedal without knowing how the engine works
- **Inheritance:** A SportsCar *is a* Car with extra features

> 💡 **Tip:** OOP helps you model real-world entities in code, making programs easier to understand and maintain.
""",

    "Classes and Objects": """
# Classes and Objects

## What is a Class?

A **class** is a blueprint for creating objects. An **object** is an instance of a class.

### Python
```python
class Student:
    def __init__(self, name, age, gpa):
        self.name = name
        self.age = age
        self.gpa = gpa

    def is_honor_roll(self):
        return self.gpa >= 3.5

    def display(self):
        status = "⭐ Honor Roll" if self.is_honor_roll() else ""
        print(f"{self.name} (Age: {self.age}, GPA: {self.gpa}) {status}")

# Creating objects
s1 = Student("Ali", 20, 3.8)
s2 = Student("Sara", 19, 3.2)

s1.display()  # Ali (Age: 20, GPA: 3.8) ⭐ Honor Roll
s2.display()  # Sara (Age: 19, GPA: 3.2)
```

### C++
```cpp
class Student {
public:
    string name;
    int age;
    double gpa;

    Student(string n, int a, double g) : name(n), age(a), gpa(g) {}

    bool isHonorRoll() { return gpa >= 3.5; }

    void display() {
        cout << name << " (Age: " << age << ", GPA: " << gpa << ")" << endl;
    }
};
```

## Class vs Object

| Class | Object |
|-------|--------|
| Blueprint / Template | Actual instance |
| Defines structure | Holds real data |
| Created once | Can create many |
| `class Car:` | `my_car = Car()` |

## Instance vs Class Variables

```python
class Counter:
    count = 0  # Class variable (shared by all)

    def __init__(self, name):
        self.name = name   # Instance variable (unique)
        Counter.count += 1

a = Counter("A")
b = Counter("B")
print(Counter.count)  # 2
```

> 💡 **Tip:** Each object has its own copy of instance variables, but class variables are shared.
""",

    "Constructors and Destructors": """
# Constructors and Destructors

## What is a Constructor?

A **constructor** is a special method called automatically when an object is created. It initializes the object's attributes.

### Python
```python
class BankAccount:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance
        print(f"Account created for {owner}")

    def deposit(self, amount):
        self.balance += amount

    def __str__(self):
        return f"{self.owner}'s account: ${self.balance}"

acc = BankAccount("Ali", 1000)  # Constructor called
print(acc)  # Ali's account: $1000
```

### C++
```cpp
class BankAccount {
private:
    string owner;
    double balance;

public:
    // Constructor
    BankAccount(string o, double b = 0) : owner(o), balance(b) {
        cout << "Account created for " << owner << endl;
    }

    // Destructor
    ~BankAccount() {
        cout << "Account for " << owner << " closed" << endl;
    }
};
```

## Types of Constructors

| Type | Description |
|------|-------------|
| **Default** | No parameters, sets defaults |
| **Parameterized** | Takes arguments to initialize |
| **Copy** | Creates a copy of another object |

## Destructor

A **destructor** is called when an object is destroyed — used to clean up resources.

```python
class FileHandler:
    def __init__(self, filename):
        self.file = open(filename, 'w')
        print(f"File {filename} opened")

    def write(self, text):
        self.file.write(text)

    def __del__(self):
        self.file.close()
        print("File closed (destructor called)")
```

> 💡 **Tip:** In Python, use context managers (`with` statement) instead of destructors for resource management.
""",

    "Encapsulation": """
# Encapsulation

## What is Encapsulation?

**Encapsulation** means bundling data and the methods that operate on it into a single unit (class), and **restricting direct access** to some components.

## Access Modifiers

| Modifier | Python Convention | C++ Keyword | Access |
|----------|------------------|-------------|--------|
| Public | `self.name` | `public:` | Anywhere |
| Protected | `self._name` | `protected:` | Class + subclasses |
| Private | `self.__name` | `private:` | Class only |

### Python Example
```python
class Employee:
    def __init__(self, name, salary):
        self.name = name          # public
        self._department = "IT"   # protected (convention)
        self.__salary = salary    # private (name mangling)

    def get_salary(self):
        return self.__salary

    def set_salary(self, amount):
        if amount > 0:
            self.__salary = amount
        else:
            raise ValueError("Salary must be positive")

emp = Employee("Ali", 50000)
print(emp.name)          # ✅ Works
print(emp.get_salary())  # ✅ Works — via getter
# print(emp.__salary)    # ❌ AttributeError!
```

### C++ Example
```cpp
class Employee {
private:
    double salary;

public:
    string name;

    Employee(string n, double s) : name(n), salary(s) {}

    double getSalary() { return salary; }

    void setSalary(double s) {
        if (s > 0) salary = s;
    }
};
```

## Why Encapsulation?

- **Data Protection** — prevent invalid modifications
- **Flexibility** — change internal implementation without affecting external code
- **Debugging** — easier to track where data changes

> 💡 **Tip:** Always use getters/setters for sensitive data. Never expose internal state directly.
""",

    "Inheritance": """
# Inheritance

## What is Inheritance?

**Inheritance** allows a class to **inherit** attributes and methods from another class, promoting code reuse.

- **Parent / Base / Super class** — the class being inherited from
- **Child / Derived / Sub class** — the class that inherits

### Python
```python
class Animal:
    def __init__(self, name, sound):
        self.name = name
        self.sound = sound

    def speak(self):
        print(f"{self.name} says {self.sound}!")

class Dog(Animal):
    def __init__(self, name):
        super().__init__(name, "Woof")

    def fetch(self):
        print(f"{self.name} fetches the ball! 🎾")

class Cat(Animal):
    def __init__(self, name):
        super().__init__(name, "Meow")

dog = Dog("Buddy")
dog.speak()   # Buddy says Woof!
dog.fetch()   # Buddy fetches the ball! 🎾

cat = Cat("Whiskers")
cat.speak()   # Whiskers says Meow!
```

## Types of Inheritance

| Type | Description |
|------|-------------|
| **Single** | One parent, one child |
| **Multiple** | Child inherits from multiple parents (Python supports this) |
| **Multilevel** | A → B → C chain |
| **Hierarchical** | One parent, multiple children |

## Method Overriding

```python
class Shape:
    def area(self):
        return 0

class Circle(Shape):
    def __init__(self, radius):
        self.radius = radius

    def area(self):  # Override parent method
        return 3.14159 * self.radius ** 2

c = Circle(5)
print(f"Area: {c.area():.2f}")  # Area: 78.54
```

> 💡 **Tip:** Use `super()` to call the parent's method when you override it, to extend rather than replace behavior.
""",

    "Polymorphism": """
# Polymorphism

## What is Polymorphism?

**Polymorphism** means "many forms" — the same method name can behave differently depending on the object calling it.

## Method Overriding (Runtime Polymorphism)

```python
class Shape:
    def area(self):
        raise NotImplementedError

    def describe(self):
        print(f"This shape has area: {self.area():.2f}")

class Circle(Shape):
    def __init__(self, radius):
        self.radius = radius

    def area(self):
        return 3.14159 * self.radius ** 2

class Rectangle(Shape):
    def __init__(self, width, height):
        self.width = width
        self.height = height

    def area(self):
        return self.width * self.height

# Same method, different behavior
shapes = [Circle(5), Rectangle(4, 6), Circle(3)]

for shape in shapes:
    shape.describe()
```

**Output:**
```
This shape has area: 78.54
This shape has area: 24.00
This shape has area: 28.27
```

## Operator Overloading

```python
class Vector:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __add__(self, other):
        return Vector(self.x + other.x, self.y + other.y)

    def __str__(self):
        return f"Vector({self.x}, {self.y})"

v1 = Vector(2, 3)
v2 = Vector(4, 1)
v3 = v1 + v2  # Uses __add__
print(v3)      # Vector(6, 4)
```

## Duck Typing (Python)

```python
class Duck:
    def quack(self):
        print("Quack!")

class Person:
    def quack(self):
        print("I'm quacking like a duck!")

def make_it_quack(thing):
    thing.quack()  # Works for both!

make_it_quack(Duck())    # Quack!
make_it_quack(Person())  # I'm quacking like a duck!
```

> 💡 **Tip:** "If it walks like a duck and quacks like a duck, then it must be a duck." — Duck Typing principle.
""",

    "Abstraction": """
# Abstraction

## What is Abstraction?

**Abstraction** means hiding complex implementation details and showing only the essential features to the user.

## Abstract Classes in Python

```python
from abc import ABC, abstractmethod

class PaymentMethod(ABC):
    @abstractmethod
    def pay(self, amount):
        pass

    @abstractmethod
    def refund(self, amount):
        pass

class CreditCard(PaymentMethod):
    def __init__(self, card_number):
        self.card_number = card_number

    def pay(self, amount):
        print(f"Paid ${amount} with card ending in {self.card_number[-4:]}")

    def refund(self, amount):
        print(f"Refunded ${amount} to card ending in {self.card_number[-4:]}")

class JazzCash(PaymentMethod):
    def __init__(self, phone):
        self.phone = phone

    def pay(self, amount):
        print(f"Paid Rs.{amount} via JazzCash to {self.phone}")

    def refund(self, amount):
        print(f"Refunded Rs.{amount} to JazzCash {self.phone}")

# payment = PaymentMethod()  # ❌ Cannot instantiate abstract class!

cc = CreditCard("1234567890123456")
cc.pay(100)    # Paid $100 with card ending in 3456

jc = JazzCash("03001234567")
jc.pay(5000)   # Paid Rs.5000 via JazzCash to 03001234567
```

## Abstract vs Interface

| Feature | Abstract Class | Interface (Protocol) |
|---------|---------------|---------------------|
| Can have implementations | ✅ Yes | ❌ No |
| Multiple inheritance | ⚠️ Limited | ✅ Yes |
| Constructor | ✅ Yes | ❌ No |
| Use case | Shared base behavior | Define contracts |

> 💡 **Tip:** Use abstraction to define "what" something does, and let subclasses decide "how" it does it.
""",

    "Composition vs Inheritance": """
# Composition vs Inheritance

## Inheritance: "IS-A" Relationship

```python
class Animal:
    def breathe(self):
        print("Breathing...")

class Dog(Animal):   # Dog IS-A Animal
    def bark(self):
        print("Woof!")
```

## Composition: "HAS-A" Relationship

```python
class Engine:
    def __init__(self, horsepower):
        self.horsepower = horsepower

    def start(self):
        print(f"Engine ({self.horsepower}hp) started! 🚗")

class Car:
    def __init__(self, brand, hp):
        self.brand = brand
        self.engine = Engine(hp)  # Car HAS-A Engine

    def drive(self):
        self.engine.start()
        print(f"{self.brand} is driving!")

car = Car("Toyota", 150)
car.drive()
# Engine (150hp) started! 🚗
# Toyota is driving!
```

## When to Use Which?

| Use Inheritance When | Use Composition When |
|---------------------|---------------------|
| True "is-a" relationship | "has-a" relationship |
| Share behavior in a hierarchy | Combine independent features |
| Few levels of depth | Need flexibility |

## Favor Composition

```python
# ❌ Deep inheritance (fragile)
class Animal: ...
class Mammal(Animal): ...
class DomesticAnimal(Mammal): ...
class Pet(DomesticAnimal): ...
class Dog(Pet): ...

# ✅ Composition (flexible)
class Dog:
    def __init__(self):
        self.movement = WalkBehavior()
        self.sound = BarkBehavior()
        self.diet = OmnivoreDiet()
```

> 💡 **Tip:** "Favor composition over inheritance" — this is one of the most important OOP design principles.
""",

    # ── Data Structures ───────────────────────────────────────────────
    "Introduction to Data Structures": """
# Introduction to Data Structures

## What is a Data Structure?

A **data structure** is a way of organizing and storing data so that it can be accessed and modified efficiently.

## Why Data Structures Matter

Choosing the right data structure can make your program:
- **Faster** — reduce time complexity
- **Memory-efficient** — use less space
- **Simpler** — cleaner, more readable code

## Common Data Structures Overview

| Data Structure | Best For | Access | Search | Insert | Delete |
|----------------|----------|--------|--------|--------|--------|
| **Array** | Index-based access | O(1) | O(n) | O(n) | O(n) |
| **Linked List** | Frequent insertions | O(n) | O(n) | O(1) | O(1) |
| **Stack** | LIFO operations | O(1) | O(n) | O(1) | O(1) |
| **Queue** | FIFO operations | O(1) | O(n) | O(1) | O(1) |
| **Hash Table** | Key-value lookups | — | O(1) | O(1) | O(1) |
| **Binary Tree** | Hierarchical data | — | O(log n) | O(log n) | O(log n) |
| **Graph** | Relationships | — | varies | varies | varies |

## Linear vs Non-Linear

- **Linear:** Arrays, Linked Lists, Stacks, Queues — elements in sequence
- **Non-Linear:** Trees, Graphs — elements in hierarchy or network

> 💡 **Tip:** There is no "best" data structure. The right choice depends on what operations you need to perform most often.
""",

    "Arrays and Dynamic Arrays": """
# Arrays and Dynamic Arrays

## Static Arrays

A **static array** has a fixed size set at creation time.

```cpp
// C++ static array
int scores[5] = {90, 85, 78, 92, 88};
cout << scores[0];  // 90
```

## Dynamic Arrays

A **dynamic array** can grow and shrink as needed.

### Python List (dynamic by default)
```python
numbers = []
numbers.append(10)   # [10]
numbers.append(20)   # [10, 20]
numbers.append(30)   # [10, 20, 30]
numbers.pop()        # [10, 20]

# List comprehension
squares = [x**2 for x in range(1, 6)]
print(squares)  # [1, 4, 9, 16, 25]
```

### C++ Vector
```cpp
#include <vector>

vector<int> numbers;
numbers.push_back(10);
numbers.push_back(20);
numbers.push_back(30);
numbers.pop_back();
```

## How Dynamic Arrays Work

1. Start with a small internal array (e.g., size 4)
2. When full, create a **new array double the size**
3. Copy all elements over
4. This gives **amortized O(1)** append time

## Time Complexity

| Operation | Static Array | Dynamic Array |
|-----------|-------------|---------------|
| Access by index | O(1) | O(1) |
| Append | N/A | O(1) amortized |
| Insert at middle | O(n) | O(n) |
| Delete at middle | O(n) | O(n) |
| Search | O(n) | O(n) |

## 2D Arrays

```python
# Matrix (2D array)
matrix = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
]

print(matrix[1][2])  # 6 (row 1, col 2)

# Iterate
for row in matrix:
    for val in row:
        print(val, end=" ")
    print()
```

> 💡 **Tip:** Use dynamic arrays (Python lists, C++ vectors) unless you have a specific reason to use static arrays.
""",

    "Linked Lists": """
# Linked Lists

## What is a Linked List?

A **linked list** is a sequence of nodes where each node contains data and a pointer to the next node.

## Node Structure

```python
class Node:
    def __init__(self, data):
        self.data = data
        self.next = None
```

## Singly Linked List

```python
class LinkedList:
    def __init__(self):
        self.head = None

    def append(self, data):
        new_node = Node(data)
        if not self.head:
            self.head = new_node
            return
        current = self.head
        while current.next:
            current = current.next
        current.next = new_node

    def display(self):
        current = self.head
        while current:
            print(current.data, end=" → ")
            current = current.next
        print("None")

    def delete(self, data):
        if self.head and self.head.data == data:
            self.head = self.head.next
            return
        current = self.head
        while current.next:
            if current.next.data == data:
                current.next = current.next.next
                return
            current = current.next

ll = LinkedList()
ll.append(10)
ll.append(20)
ll.append(30)
ll.display()    # 10 → 20 → 30 → None
ll.delete(20)
ll.display()    # 10 → 30 → None
```

## Array vs Linked List

| Feature | Array | Linked List |
|---------|-------|-------------|
| Access | O(1) by index | O(n) traversal |
| Insert at front | O(n) shift | O(1) |
| Memory | Contiguous | Scattered (uses pointers) |
| Cache performance | Excellent | Poor |

> 💡 **Tip:** Use linked lists when you need frequent insertions/deletions at the beginning. Use arrays for random access.
""",

    "Stacks": """
# Stacks

## What is a Stack?

A **stack** is a Last-In-First-Out (LIFO) data structure. Think of a stack of plates — you add and remove from the top.

## Operations

| Operation | Description | Time |
|-----------|-------------|------|
| `push(x)` | Add element to top | O(1) |
| `pop()` | Remove top element | O(1) |
| `peek()` / `top()` | View top element | O(1) |
| `isEmpty()` | Check if empty | O(1) |

## Implementation

```python
class Stack:
    def __init__(self):
        self.items = []

    def push(self, item):
        self.items.append(item)

    def pop(self):
        if self.is_empty():
            raise IndexError("Stack is empty")
        return self.items.pop()

    def peek(self):
        if self.is_empty():
            raise IndexError("Stack is empty")
        return self.items[-1]

    def is_empty(self):
        return len(self.items) == 0

    def size(self):
        return len(self.items)

# Usage
stack = Stack()
stack.push(10)
stack.push(20)
stack.push(30)
print(stack.peek())  # 30
print(stack.pop())   # 30
print(stack.pop())   # 20
```

## Classic Application: Balanced Parentheses

```python
def is_balanced(expression):
    stack = []
    pairs = {')': '(', ']': '[', '}': '{'}

    for char in expression:
        if char in '([{':
            stack.append(char)
        elif char in ')]}':
            if not stack or stack[-1] != pairs[char]:
                return False
            stack.pop()

    return len(stack) == 0

print(is_balanced("({[]})"))   # True
print(is_balanced("({[})"))    # False
```

> 💡 **Tip:** Stacks are used in function call management (call stack), undo operations, and expression evaluation.
""",

    "Queues": """
# Queues

## What is a Queue?

A **queue** is a First-In-First-Out (FIFO) data structure. Like a line at a ticket counter — first person in line gets served first.

## Operations

| Operation | Description | Time |
|-----------|-------------|------|
| `enqueue(x)` | Add to back | O(1) |
| `dequeue()` | Remove from front | O(1) |
| `peek()` / `front()` | View front element | O(1) |
| `isEmpty()` | Check if empty | O(1) |

## Implementation

```python
from collections import deque

class Queue:
    def __init__(self):
        self.items = deque()

    def enqueue(self, item):
        self.items.append(item)

    def dequeue(self):
        if self.is_empty():
            raise IndexError("Queue is empty")
        return self.items.popleft()

    def peek(self):
        if self.is_empty():
            raise IndexError("Queue is empty")
        return self.items[0]

    def is_empty(self):
        return len(self.items) == 0

# Usage
q = Queue()
q.enqueue("Ali")
q.enqueue("Sara")
q.enqueue("Ahmed")
print(q.dequeue())  # Ali (first in, first out)
print(q.dequeue())  # Sara
```

## Variants

| Type | Description |
|------|-------------|
| **Simple Queue** | Basic FIFO |
| **Circular Queue** | Wraps around to reuse space |
| **Priority Queue** | Highest priority dequeued first |
| **Double-Ended Queue (Deque)** | Insert/remove from both ends |

> 💡 **Tip:** Use `collections.deque` in Python for efficient queue operations. Regular lists are O(n) for `pop(0)`.
""",

    "Hash Tables": """
# Hash Tables

## What is a Hash Table?

A **hash table** (dictionary in Python, map in C++) stores **key-value** pairs for ultra-fast lookups.

## How It Works

1. The key goes through a **hash function** → produces an index
2. The value is stored at that index in an internal array
3. Lookup by key is **O(1)** on average

## Python Dictionaries

```python
# Creating a dictionary
student = {
    "name": "Ali",
    "age": 20,
    "gpa": 3.8,
    "courses": ["CS101", "MATH201"]
}

# Access
print(student["name"])        # Ali
print(student.get("email", "N/A"))  # N/A (default)

# Modify
student["age"] = 21
student["email"] = "ali@ned.edu.pk"

# Iterate
for key, value in student.items():
    print(f"{key}: {value}")
```

## Common Use Cases

```python
# Word frequency counter
text = "the cat sat on the mat the cat"
freq = {}
for word in text.split():
    freq[word] = freq.get(word, 0) + 1
print(freq)  # {'the': 3, 'cat': 2, 'sat': 1, 'on': 1, 'mat': 1}

# Two Sum problem
def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i

print(two_sum([2, 7, 11, 15], 9))  # [0, 1]
```

## Time Complexity

| Operation | Average | Worst Case |
|-----------|---------|------------|
| Search | O(1) | O(n) |
| Insert | O(1) | O(n) |
| Delete | O(1) | O(n) |

> 💡 **Tip:** Hash tables are your best friend for problems that need fast lookups. Think "Can I use a dictionary here?" first.
""",

    "Trees and Binary Trees": """
# Trees and Binary Trees

## What is a Tree?

A **tree** is a hierarchical data structure with nodes connected by edges. The top node is the **root**.

## Binary Tree

Each node has **at most two children** (left and right).

```python
class TreeNode:
    def __init__(self, val):
        self.val = val
        self.left = None
        self.right = None

# Build a tree
root = TreeNode(1)
root.left = TreeNode(2)
root.right = TreeNode(3)
root.left.left = TreeNode(4)
root.left.right = TreeNode(5)
```

## Traversals

```python
def inorder(node):
    if node:
        inorder(node.left)
        print(node.val, end=" ")
        inorder(node.right)

def preorder(node):
    if node:
        print(node.val, end=" ")
        preorder(node.left)
        preorder(node.right)

def postorder(node):
    if node:
        postorder(node.left)
        postorder(node.right)
        print(node.val, end=" ")

inorder(root)    # 4 2 5 1 3
preorder(root)   # 1 2 4 5 3
postorder(root)  # 4 5 2 3 1
```

## Binary Search Tree (BST)

Left child < Parent < Right child

```python
class BST:
    def __init__(self):
        self.root = None

    def insert(self, val):
        self.root = self._insert(self.root, val)

    def _insert(self, node, val):
        if not node:
            return TreeNode(val)
        if val < node.val:
            node.left = self._insert(node.left, val)
        else:
            node.right = self._insert(node.right, val)
        return node

    def search(self, val):
        return self._search(self.root, val)

    def _search(self, node, val):
        if not node or node.val == val:
            return node
        if val < node.val:
            return self._search(node.left, val)
        return self._search(node.right, val)
```

## BST Time Complexity

| Operation | Average | Worst (unbalanced) |
|-----------|---------|-------------------|
| Search | O(log n) | O(n) |
| Insert | O(log n) | O(n) |
| Delete | O(log n) | O(n) |

> 💡 **Tip:** BSTs are the foundation for many advanced structures like AVL trees, Red-Black trees, and B-trees.
""",

    "Graphs": """
# Graphs

## What is a Graph?

A **graph** is a set of **vertices (nodes)** connected by **edges**. Graphs model relationships — social networks, maps, dependencies.

## Types

| Type | Description |
|------|-------------|
| **Directed** | Edges have direction (A → B) |
| **Undirected** | Edges go both ways (A — B) |
| **Weighted** | Edges have costs/distances |
| **Unweighted** | All edges equal |

## Representation

### Adjacency List (most common)
```python
graph = {
    'A': ['B', 'C'],
    'B': ['A', 'D', 'E'],
    'C': ['A', 'F'],
    'D': ['B'],
    'E': ['B', 'F'],
    'F': ['C', 'E']
}
```

## BFS (Breadth-First Search)

```python
from collections import deque

def bfs(graph, start):
    visited = set()
    queue = deque([start])
    visited.add(start)
    order = []

    while queue:
        node = queue.popleft()
        order.append(node)
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)

    return order

print(bfs(graph, 'A'))  # ['A', 'B', 'C', 'D', 'E', 'F']
```

## DFS (Depth-First Search)

```python
def dfs(graph, start, visited=None):
    if visited is None:
        visited = set()
    visited.add(start)
    print(start, end=" ")
    for neighbor in graph[start]:
        if neighbor not in visited:
            dfs(graph, neighbor, visited)

dfs(graph, 'A')  # A B D E F C
```

## BFS vs DFS

| Feature | BFS | DFS |
|---------|-----|-----|
| Data structure | Queue | Stack/Recursion |
| Shortest path? | ✅ Yes (unweighted) | ❌ No |
| Memory | O(V) | O(V) |
| Use case | Shortest path, level-order | Cycle detection, topological sort |

> 💡 **Tip:** BFS finds the shortest path in unweighted graphs. DFS is great for exploring all possibilities.
""",

    "Sorting Algorithms": """
# Sorting Algorithms

## Why Sorting Matters

Sorting is one of the most fundamental operations in computer science. Efficient sorting enables faster searching, merging, and data analysis.

## Bubble Sort — O(n²)

```python
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

print(bubble_sort([64, 34, 25, 12, 22, 11, 90]))
```

## Selection Sort — O(n²)

```python
def selection_sort(arr):
    for i in range(len(arr)):
        min_idx = i
        for j in range(i + 1, len(arr)):
            if arr[j] < arr[min_idx]:
                min_idx = j
        arr[i], arr[min_idx] = arr[min_idx], arr[i]
    return arr
```

## Merge Sort — O(n log n)

```python
def merge_sort(arr):
    if len(arr) <= 1:
        return arr

    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])

    return merge(left, right)

def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    result.extend(left[i:])
    result.extend(right[j:])
    return result
```

## Quick Sort — O(n log n) average

```python
def quick_sort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quick_sort(left) + middle + quick_sort(right)
```

## Comparison

| Algorithm | Best | Average | Worst | Space | Stable? |
|-----------|------|---------|-------|-------|---------|
| Bubble Sort | O(n) | O(n²) | O(n²) | O(1) | ✅ |
| Selection Sort | O(n²) | O(n²) | O(n²) | O(1) | ❌ |
| Merge Sort | O(n log n) | O(n log n) | O(n log n) | O(n) | ✅ |
| Quick Sort | O(n log n) | O(n log n) | O(n²) | O(log n) | ❌ |

> 💡 **Tip:** Python's built-in `sorted()` uses **Timsort** (hybrid of merge + insertion sort) — O(n log n) and stable. Use it in production!
""",
}


# ============ Learn Endpoints ============

class LearnLessonRequest(BaseModel):
    module_id: str
    topic: str


@router.get("/learn/topics/{module_id}")
async def get_learn_topics(module_id: str, current_user: dict = Depends(get_current_user)):
    """Get available topics for a module."""
    topics_list = LEARN_TOPICS.get(module_id, [])
    topics = [
        {"id": f"{module_id}-{i}", "name": t, "available": True}
        for i, t in enumerate(topics_list)
    ]
    return {"module_id": module_id, "topics": topics}


@router.post("/learn/generate")
async def generate_lesson(req: LearnLessonRequest, current_user: dict = Depends(get_current_user)):
    """Return hardcoded lesson content for a topic."""
    content = LESSON_CONTENT.get(req.topic)
    if not content:
        raise HTTPException(status_code=404, detail=f"No content found for topic: {req.topic}")
    return {"topic": req.topic, "module_id": req.module_id, "content": content.strip()}
