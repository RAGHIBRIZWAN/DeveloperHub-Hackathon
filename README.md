# 🎓 CodeHub - AI-Powered Programming Education Platform

<div align="center">

![CodeHub Banner](https://img.shields.io/badge/CodeHub-AI%20Powered%20Learning-blue?style=for-the-badge&logo=python)

**Learn → Practice → Compete → Excel**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python)](https://python.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)](https://mongodb.com/)
[![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=flat-square&logo=jsonwebtokens)](https://jwt.io/)

*AI-Powered Programming Education for Aspiring Developers*

</div>---

## 🌟 Overview

CodeHub is a next-generation learning platform that teaches **C++, Python, and JavaScript** through:

- 💻 **Interactive Learning** - Structured lessons with hands-on coding exercises
- 🤖 **AI Tutoring** - Intelligent assistance and code explanations
- 💻 **Real-time Code Execution** - Integrated Monaco Editor with Judge0
- 📝 **MCQ Assessments** - Dynamic question generation
- 🏆 **Competitive Programming** - Contests and leaderboards
- 👁️ **AI Proctoring** - Secure exam monitoring

---

## 🔑 Key Features

### 1. 🎯 Multi-Language Code Editor
- **Monaco Editor** with syntax highlighting for C++, Python, JavaScript
- **Hidden Test Cases** for coding challenges
- **Real-time Feedback** on code submission

### 2. 🤖 AI Tutor
- **Intelligent Assistance** - Context-aware help and explanations
- **Code Analysis** - Automatic error detection and suggestions
- **Concept Explanations** - Clear explanations for complex topics
- **Beginner-Friendly** - Simple explanations for all skill levels

### 3. 📝 Dynamic MCQ Generation
- **Smart Questions** - Auto-generated from curriculum content
- **Syllabus-Aligned** - Follows course structure
- **Difficulty Scaling** - Adapts to student level
- **Varied Content** - Fresh questions for each session

### 4. 🎯 Progress Tracking
- **Learning Dashboard** - Visual overview of progress
- **Performance Analytics** - Track improvement over time
- **Module Completion** - Monitor course advancement
- **Achievement System** - Recognize milestones

### 5. 🏆 Competitive Programming
- **Live Contests** - Real-time competitions
- **Leaderboards** - Global and local rankings
- **Problem Archive** - Practice past problems
- **Rating System** - Track competitive performance

### 6. 👁️ AI Proctoring
- **Tab Switch Tracking** - Detects when students leave exam
- **Copy-Paste Detection** - Prevents code copying
- **Focus Monitoring** - Ensures attention on exam


## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  React 19 + Vite + Monaco Editor + TailwindCSS                   │   │
│  │  ├── Authentication (JWT + MongoDB)                              │   │
│  │  ├── Code Editor (Monaco + Judge0 Integration)                   │   │
│  │  ├── AI Tutor Chat (Text-based Assistance)                       │   │
│  │  ├── Learning Dashboard (Progress Tracking)                      │   │
│  │  ├── Exam Proctoring (MediaPipe + Tab Tracking)                 │   │
│  │  └── Competitive Programming Arena                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  FastAPI (Python) - Main Application Server                      │   │
│  │  ├── /api/auth/* - Authentication & User Management              │   │
│  │  ├── /api/lessons/* - Course Content & Progress                  │   │
│  │  ├── /api/code/* - Code Execution & Validation                   │   │
│  │  ├── /api/ai/* - AI Tutor Services                               │   │
│  │  ├── /api/mcq/* - Question Generation                            │   │
│  │  ├── /api/compete/* - Contests & Leaderboards                    │   │
│  │  └── /api/admin/* - Administration                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│   AI SERVICES       │ │  CODE EXECUTION     │ │   DATA LAYER        │
│ ┌─────────────────┐ │ │ ┌─────────────────┐ │ │ ┌─────────────────┐ │
│ │ Groq LLM        │ │ │ │ Judge0 API      │ │ │ │ MongoDB Atlas   │ │
│ │ - Code Explain  │ │ │ │ - C++ Compiler  │ │ │ │ - User Data     │ │
│ │ - Error Help    │ │ │ │ - Python Runner │ │ │ │ - Progress      │ │
│ │ - Concept Tutor │ │ │ │ - JS Executor   │ │ │ │ - Submissions   │ │
│ ├─────────────────┤ │ │ │ - Sandboxed     │ │ │ ├─────────────────┤ │
│ │ Gemini AI       │ │ │ │ - Hidden Tests  │ │ │ │ MongoDB Atlas   │ │
│ │ - MCQ Gen       │ │ │ └─────────────────┘ │ │ │ - Leaderboards  │ │
│ │ - Content Gen   │ │ └─────────────────────┘ │ │ - Contests      │ │
│ └─────────────────┘ │                         │ └─────────────────┘ │
└─────────────────────┘                         └─────────────────────┘
```

---

## 📁 Project Structure

```
codehub/
├── 📂 frontend/                    # React 19 + Vite Application
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   ├── pages/                  # Route pages
│   │   ├── features/               # Feature modules
│   │   │   ├── auth/               # Authentication
│   │   │   ├── editor/             # Monaco Code Editor
│   │   │   ├── ai-tutor/           # AI Chat Interface
│   │   │   ├── lessons/            # Course content
│   │   │   ├── mcq/                # MCQ assessments
│   │   │   ├── compete/            # Competitive programming
│   │   │   └── proctoring/         # Exam monitoring
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── services/               # API services
│   │   ├── stores/                 # State management
│   │   └── utils/                  # Utility functions
│   └── package.json
│
├── 📂 backend/                     # Python FastAPI Server
│   ├── app/
│   │   ├── api/                    # API routes
│   │   │   ├── auth/               # Authentication endpoints
│   │   │   ├── lessons/            # Lesson management
│   │   │   ├── code/               # Code execution
│   │   │   ├── ai/                 # AI services
│   │   │   ├── mcq/                # MCQ generation
│   │   │   ├── compete/            # Competitions
│   │   │   └── admin/              # Administration
│   │   ├── core/                   # Core configurations
│   │   ├── models/                 # Database models
│   │   ├── schemas/                # Pydantic schemas
│   │   ├── services/               # Business logic
│   │   └── utils/                  # Utilities
│   ├── requirements.txt
│   └── main.py
│
├── 📂 docs/                        # Documentation
│   ├── api/                        # API documentation
│   ├── architecture/               # System design docs
│   └── deployment/                 # Deployment guides
│
├── 📄 docker-compose.yml           # Container orchestration
├── 📄 .env.example                 # Environment template
└── 📄 README.md                    # This file
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- MongoDB Atlas account
- Groq API key
- Google AI (Gemini) API key

### Installation

```bash
# Clone the repository
git clone https://github.com/ai-champs/codehub.git
cd codehub

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Start development servers
# Terminal 1: Frontend
cd frontend && npm run dev

# Terminal 2: Backend
cd backend && uvicorn main:app --reload
```

---

---

## 🔐 Security Features

- **JWT Authentication** with MongoDB
- **Rate Limiting** on all API endpoints
- **Sandboxed Code Execution** via Judge0
- **Input Sanitization** on all user inputs
- **CORS Configuration** for frontend-backend security
- **Encrypted Data Storage** in MongoDB Atlas
- **Secure Exam Mode** with proctoring

---

## 📊 User Journey

```
┌──────────────────────────────────────────────────────────────────┐
│                        USER ONBOARDING                            │
│  1. Sign Up → 2. Select Track → 3. Set Goals → 4. Start         │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                        LEARNING LOOP                              │
│                                                                   │
│   ┌─────────┐    ┌──────────┐    ┌──────────┐    ┌─────────┐    │
│   │ 📖 Learn │ → │ 📝 MCQ   │ → │ 💻 Code  │ → │ 🤖 AI   │    │
│   │ Theory  │    │ Test     │    │ Challenge │   │ Feedback │   │
│   └─────────┘    └──────────┘    └──────────┘    └─────────┘    │
│                                                       │          │
│                                                       ▼          │
│                                              ┌─────────────┐     │
│                                              │ ✅ Progress │     │
│                                              │ Tracking    │     │
│                                              └─────────────┘     │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                     COMPETITION & EXAMS                           │
│  🏆 Contests → 📊 Leaderboards → 👁️ Proctored Exams             │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack Details

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 19 + Vite | Fast, modern UI |
| Editor | Monaco Editor | Professional code editing |
| Styling | TailwindCSS | Responsive design |
| State | Zustand | State management |
| Backend | FastAPI | High-performance API |
| Auth | JWT + MongoDB | Secure authentication |
| Database | MongoDB Atlas | User data & progress |
| Code Exec | Judge0 | Sandboxed execution |
| AI | Groq + Gemini | Intelligent tutoring |
| Proctoring | MediaPipe | Face detection |

---

## 👥 Team
### Raghib Rizwan Rabani
### Muhammad Ali Hadi
### Muhammad Umar
### Adina Faraz
### Syeda Sara Ali

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

<div align="center">

**Made with ❤️ by Team AI CHAMPS**

*Empowering the next generation of developers*

</div>
