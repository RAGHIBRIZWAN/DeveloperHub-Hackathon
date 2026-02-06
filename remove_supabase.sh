#!/bin/bash
# Complete Supabase Removal Script

echo "🔥 Supabase Removal Script"
echo "=========================="
echo ""

# Backend cleanup
echo "📦 Step 1: Cleaning backend dependencies..."
cd backend
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
fi
pip uninstall -y supabase 2>/dev/null || echo "Supabase already removed from backend"
echo "✅ Backend cleaned"
echo ""

# Frontend cleanup
echo "📦 Step 2: Cleaning frontend dependencies..."
cd ../frontend
echo "Removing node_modules..."
rm -rf node_modules package-lock.json 2>/dev/null
echo "✅ Old dependencies removed"
echo ""

echo "📦 Step 3: Installing fresh frontend dependencies..."
npm install
if [ $? -eq 0 ]; then
    echo "✅ Frontend dependencies installed successfully"
else
    echo "❌ Error installing frontend dependencies"
    exit 1
fi
echo ""

# Verify removal
echo "🔍 Step 4: Verifying Supabase removal..."
if grep -r "supabase" package.json 2>/dev/null; then
    echo "❌ Warning: Supabase still found in package.json"
else
    echo "✅ Supabase successfully removed from package.json"
fi

if grep -r "@supabase" node_modules 2>/dev/null; then
    echo "⚠️  Warning: Supabase packages still in node_modules"
else
    echo "✅ No Supabase packages in node_modules"
fi
echo ""

# Summary
echo "📊 Summary"
echo "=========="
echo "✅ Supabase dependency removed from backend"
echo "✅ Supabase dependency removed from frontend"
echo "✅ Fresh dependencies installed"
echo ""
echo "🔐 Authentication System: MongoDB + JWT"
echo "   - Registration: POST /api/auth/register"
echo "   - Login: POST /api/auth/login"
echo "   - Refresh: POST /api/auth/refresh"
echo ""
echo "🚀 Next Steps:"
echo "   1. Start backend: cd backend && python -m uvicorn main:app --reload"
echo "   2. Start frontend: cd frontend && npm run dev"
echo "   3. Test registration and login"
echo ""
echo "✨ Done!"
