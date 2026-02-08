# CodeHub Deployment Guide

## Code Execution System

CodeHub uses a **hybrid code execution system** that works seamlessly in both local development and production deployment:

### How It Works

1. **Local Execution (localhost)**
   - When running on localhost with compilers installed (Python, GCC, G++, Node.js, Java)
   - Code is executed directly using subprocess
   - Fast and efficient for development

2. **Piston API Fallback (deployment)**
   - When deployed to cloud platforms (Render, Railway, Vercel, etc.) without compilers
   - Automatically falls back to **Piston API** (https://github.com/engineer-man/piston)
   - **Free, open-source, no subscription required**
   - Supports Python, C++, JavaScript, C, and Java

### Why This Solves the Judge0 Issue

**Problem**: Judge0 requires a subscription for production use and needs Docker setup.

**Solution**: Piston API is:
- ✅ Completely free
- ✅ No authentication required
- ✅ Open-source
- ✅ Works in any deployment environment
- ✅ No Docker or special setup needed
- ✅ Supports all required languages

### Deployment Steps

#### For Render/Railway/Heroku:

1. **Backend Deployment**
   ```bash
   # No special compiler installation needed!
   # The system will automatically use Piston API
   ```

2. **Environment Variables Required**
   ```env
   MONGODB_URL=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   GROQ_API_KEY=your_groq_key
   GEMINI_API_KEY=your_gemini_key
   CORS_ORIGINS=["https://your-frontend-url.com"]
   ```

3. **That's it!** The code executor will:
   - Detect that compilers aren't available
   - Automatically switch to Piston API
   - Execute all code submissions successfully

#### For Vercel (Frontend):

```bash
cd frontend
npm install
npm run build
# Deploy build folder
```

### Testing the System

1. **Test locally** (uses local compilers)
   ```bash
   cd backend
   python -m uvicorn app.main:app --reload
   ```

2. **Test deployment** (uses Piston API)
   - Deploy to your platform
   - Submit code in any supported language
   - System automatically uses Piston API

### Supported Languages

- Python 3.10+
- C++ (C++17)
- JavaScript (Node.js)
- C (GCC)
- Java 15+

### API Limitations

**Piston API** (free tier):
- Rate limit: Generous, suitable for educational use
- Timeout: 10 seconds per execution
- No authentication needed
- Public endpoint: https://emkc.org/api/v2/piston

If you need higher limits, you can:
1. Host your own Piston instance (Docker)
2. Use the existing local execution (install compilers on server)

### Monitoring

The system logs which execution method is used:
- Local execution: Direct subprocess
- Piston API: Fallback when compilers unavailable

Check your backend logs to see which method is active.

### Troubleshooting

**Issue**: "Compilation Error" or "Runtime Error"
- **Solution**: Check code syntax, ensure language is supported

**Issue**: "Time Limit Exceeded"
- **Solution**: Optimize code, reduce time complexity

**Issue**: "Internal Error" 
- **Solution**: Check backend logs, verify Piston API is accessible

### Support

For issues or questions, check:
- Piston API Status: https://emkc.org/api/v2/piston/runtimes
- Backend logs for detailed error messages
