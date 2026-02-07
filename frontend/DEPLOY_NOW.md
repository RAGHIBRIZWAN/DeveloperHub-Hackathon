# 🚀 Quick Deployment Steps for Vercel

## ✅ What's Already Done
- ✅ WebSocket URL fixed to use environment variables
- ✅ API configuration updated
- ✅ Vercel configuration created
- ✅ Environment files prepared
- ✅ .gitignore updated

## 📋 Pre-Deployment Checklist

### 1. Update Backend CORS (IMPORTANT!)
Your Vercel domain needs to be added to backend CORS. Once you get your Vercel URL:

**In your backend on Render:**
Update the environment variable or `.env` file to include:
```
CORS_ORIGINS=["http://localhost:5173","https://developerhub-hackathon.onrender.com","https://your-app-name.vercel.app","https://*.vercel.app"]
```

Or directly in `backend/app/core/config.py`:
```python
CORS_ORIGINS: List[str] = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://codehub.vercel.app",
    "https://your-actual-vercel-domain.vercel.app",  # Add this
    "https://*.vercel.app"  # Or use wildcard for all Vercel preview deployments
]
```

## 🚀 Deploy to Vercel (2 Methods)

### Method 1: Using Vercel Dashboard (Recommended)

1. **Go to Vercel**: https://vercel.com/
2. **Sign in** with GitHub/GitLab/Bitbucket
3. **Click "Add New Project"**
4. **Import your repository**
5. **Configure Project Settings:**
   - Framework Preset: `Vite`
   - Root Directory: `DeveloperHub-Hackathon/frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

6. **Add Environment Variable:**
   - Go to "Environment Variables" section
   - Add:
     - Name: `VITE_API_URL`
     - Value: `https://developerhub-hackathon.onrender.com`
     - Environment: Production (check all boxes)

7. **Click "Deploy"**

8. **Copy Your Vercel URL** (e.g., `https://your-app.vercel.app`)

9. **Update Backend CORS** (see step 1 above) with your Vercel URL

10. **Redeploy if needed** - If you had to update backend CORS after first deployment, trigger a redeploy in Vercel

### Method 2: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend folder
cd DeveloperHub-Hackathon/frontend

# Login to Vercel
vercel login

# Deploy (follow prompts)
vercel

# Set environment variable
vercel env add VITE_API_URL production
# When prompted, enter: https://developerhub-hackathon.onrender.com

# Deploy to production
vercel --prod
```

## 🔧 Post-Deployment Steps

### 1. Test Your Deployment
Open your Vercel URL and check:
- ✅ Pages load correctly
- ✅ Can register/login
- ✅ API calls work (check browser console for errors)
- ✅ No CORS errors

### 2. If You See CORS Errors

**Common Error:**
```
Access to XMLHttpRequest at 'https://developerhub-hackathon.onrender.com/api/...' 
from origin 'https://your-app.vercel.app' has been blocked by CORS policy
```

**Solution:**
1. Go to your Render dashboard for the backend
2. Add environment variable:
   - Key: `CORS_ORIGINS`
   - Value: `["http://localhost:5173","https://your-app.vercel.app","https://*.vercel.app"]`
3. Restart your backend service on Render

### 3. Enable WebSocket (wss://)
Vercel automatically supports WebSocket over HTTPS. Your backend on Render should also support `wss://` (secure WebSocket). This is typically handled automatically.

## 📱 Testing Checklist

After deployment, test these features:
- [ ] Homepage loads
- [ ] User registration
- [ ] User login
- [ ] Profile page
- [ ] Code editor
- [ ] Code execution
- [ ] Real-time features (WebSocket)
- [ ] File uploads (if any)

## 🔄 Making Updates

After making code changes:

**Option 1: Automatic (Recommended)**
- Push changes to your Git repository
- Vercel will automatically rebuild and deploy

**Option 2: Manual**
```bash
cd DeveloperHub-Hackathon/frontend
vercel --prod
```

## 🌐 Custom Domain (Optional)

1. Go to your Vercel project settings
2. Click "Domains"
3. Add your custom domain
4. Update DNS records as instructed
5. Update backend CORS with your custom domain

## 🆘 Troubleshooting

### Build Fails
- Check Vercel build logs
- Ensure all dependencies are in `package.json`
- Try building locally: `npm run build`

### API Calls Not Working
- Verify environment variable: `VITE_API_URL`
- Check browser console for errors
- Verify backend is running on Render
- Check CORS configuration

### Environment Variables Not Working
- Must start with `VITE_` prefix
- Redeploy after adding them
- Check they're set for "Production"

## 📞 Need Help?

Check the detailed guide in `VERCEL_DEPLOYMENT.md` for more information.

---

**Your Backend URL:** https://developerhub-hackathon.onrender.com  
**Your Vercel URL:** (Will be provided after deployment)

Good luck with your deployment! 🎉
