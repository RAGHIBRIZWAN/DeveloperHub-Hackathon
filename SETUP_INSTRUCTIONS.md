# CodeHub Backend Setup Instructions

## Issues Fixed ✅

### 1. **Model File Syntax Errors** 
- Fixed `Indexed(str)` syntax to use Beanie's correct `Field(..., index=True)` pattern
- Updated all model files:
  - `app/models/challenge.py`
  - `app/models/mcq.py`
  - `app/models/gamification.py`
  - `app/models/contest.py`
  - `app/models/proctoring.py`

### 2. **Configuration & Environment**
- Created `.env` file with default development settings
- Updated `app/core/config.py` to properly load environment variables from `.env`
- Changed MongoDB URL from Atlas to local development: `mongodb://localhost:27017`

### 3. **Graceful Database Fallback**
- Modified `app/core/database.py` to handle MongoDB connection failures gracefully
- Backend now runs in development mode even without MongoDB connection
- Updated `main.py` lifespan manager to handle database connection status

## Current Status 🚀

✅ **Backend is running successfully at http://127.0.0.1:8000**
⚠️  **Running without MongoDB** (database connection is optional in development mode)

## Next Steps

### Option 1: Install MongoDB Locally (Recommended for Development)
```bash
# Download from https://www.mongodb.com/try/download/community
# Or use Homebrew (macOS):
brew install mongodb-community

# Start MongoDB:
mongod
```

Then the backend will automatically connect on restart.

### Option 2: Use MongoDB Atlas (Cloud)
1. Create an account at https://www.mongodb.com/cloud/atlas
2. Create a cluster and get connection string
3. Update `.env`:
   ```
   MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
   ```

### Option 3: Use Docker (Easiest for Multiple Environments)
```bash
# Start MongoDB in Docker:
docker run -d -p 27017:27017 --name mongodb mongo:latest

# The backend will connect automatically on next restart
```

### Option 4: Using Docker Compose (All Services Together)
```bash
# Uncommented MongoDB service in docker-compose.yml
# Start all services:
docker compose up -d

# This includes backend, frontend, and MongoDB
```

## Environment Variables (.env)

Create a `.env` file in the `backend/` directory with:

```env
# Application
APP_NAME=CodeHub
APP_ENV=development
DEBUG=True
SECRET_KEY=your-super-secret-key-change-in-production

# MongoDB
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=codehub

# CORS Origins
CORS_ORIGINS=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"]

# (Add other API keys as needed)
```

## API Documentation

Once running, visit:
- **API Docs (Swagger)**: http://127.0.0.1:8000/docs
- **ReDoc**: http://127.0.0.1:8000/redoc

## Troubleshooting

### MongoDB Connection Still Fails?
```
⚠️ Failed to connect to MongoDB: localhost:27017
```
- Make sure MongoDB is running (`mongod` or Docker)
- Check MONGODB_URL in `.env`
- Verify port 27017 is not blocked

### Other Import Errors?
All model files have been updated to use correct syntax. If you see:
```python
NameError: name 'Indexed' is not defined
```
The files have been corrected. Restart the server.

## Project Structure

```
backend/
├── app/
│   ├── core/           # Configuration and database
│   ├── models/         # Beanie document models (FIXED ✅)
│   ├── api/            # API routes
│   ├── services/       # Business logic
│   └── utils/          # Utilities
├── main.py             # FastAPI entry point
├── requirements.txt    # Python dependencies
├── .env                # Environment variables
└── docker-compose.yml  # Docker configuration
```

## Running the Server

### Development (with auto-reload)
```bash
cd backend
python -m uvicorn main:app --reload
```

### Production
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

---

**Backend Status**: ✅ Running
**Database Status**: ⚠️  Optional (configure MongoDB to enable)
