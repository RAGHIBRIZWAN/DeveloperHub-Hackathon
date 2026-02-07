# Vercel Deployment Guide

## Prerequisites
- Vercel account (free tier works)
- Git repository (GitHub, GitLab, or Bitbucket)

## Deployment Steps

### 1. Push Your Code to Git Repository
Make sure your code is pushed to a Git repository that Vercel can access.

### 2. Import Project to Vercel

#### Option A: Using Vercel Dashboard
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your Git repository
4. Select the `DeveloperHub-Hackathon/frontend` folder as the root directory
5. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `DeveloperHub-Hackathon/frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

#### Option B: Using Vercel CLI
```bash
# Install Vercel CLI globally
npm install -g vercel

# Navigate to frontend directory
cd DeveloperHub-Hackathon/frontend

# Deploy
vercel

# Or deploy to production directly
vercel --prod
```

### 3. Configure Environment Variables

In your Vercel project settings, add the following environment variable:

**Environment Variables:**
- **Name**: `VITE_API_URL`
- **Value**: `https://developerhub-hackathon.onrender.com`
- **Environment**: Production (and Preview if you want)

**Steps to add environment variables:**
1. Go to your project in Vercel dashboard
2. Click on "Settings"
3. Click on "Environment Variables"
4. Add the variable name and value
5. Select the environments (Production, Preview, Development)
6. Click "Save"

### 4. Redeploy (if needed)

If you added environment variables after the initial deployment:
1. Go to "Deployments" tab
2. Find the latest deployment
3. Click the three dots menu
4. Click "Redeploy"

Or use CLI:
```bash
vercel --prod
```

## Important Notes

### CORS Configuration
Make sure your backend (`https://developerhub-hackathon.onrender.com`) allows requests from your Vercel domain. Update your backend CORS settings to include:
```python
# In your FastAPI backend (main.py or similar)
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://your-app.vercel.app",  # Add your Vercel domain
        "https://*.vercel.app"  # Allow all Vercel preview deployments
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### WebSocket Support
The WebSocket connections have been automatically configured to:
- Use `ws://` protocol for local development
- Use `wss://` protocol for production (Vercel uses HTTPS)

### Custom Domain (Optional)
1. Go to your project settings in Vercel
2. Click on "Domains"
3. Add your custom domain
4. Follow the DNS configuration instructions

## Verification

After deployment, verify:
1. ✅ Frontend loads on Vercel URL
2. ✅ API calls reach your backend on Render
3. ✅ Authentication works
4. ✅ WebSocket connections establish successfully
5. ✅ No CORS errors in browser console

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Verify Node version compatibility
- Check build logs in Vercel dashboard

### API Calls Fail
- Verify `VITE_API_URL` environment variable is set correctly
- Check backend CORS configuration
- Verify backend is running on Render

### Environment Variables Not Working
- Environment variables must start with `VITE_` to be exposed to the frontend
- Redeploy after adding environment variables
- Check that you're using `import.meta.env.VITE_*` in your code

## Useful Commands

```bash
# Preview deployment locally
npm run build
npm run preview

# Check environment variables
vercel env ls

# Pull environment variables for local development
vercel env pull
```

## Support

For more information:
- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
