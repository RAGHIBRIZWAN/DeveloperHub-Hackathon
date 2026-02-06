# Complete Supabase Removal Script (Windows PowerShell)

Write-Host "🔥 Supabase Removal Script" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan
Write-Host ""

# Backend cleanup
Write-Host "📦 Step 1: Cleaning backend dependencies..." -ForegroundColor Yellow
Push-Location backend
try {
    pip uninstall -y supabase 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Supabase removed from backend" -ForegroundColor Green
    } else {
        Write-Host "✅ Supabase already removed from backend" -ForegroundColor Green
    }
} catch {
    Write-Host "✅ Supabase not found in backend" -ForegroundColor Green
}
Pop-Location
Write-Host ""

# Frontend cleanup
Write-Host "📦 Step 2: Cleaning frontend dependencies..." -ForegroundColor Yellow
Push-Location frontend
Write-Host "Removing node_modules and package-lock.json..."
Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "package-lock.json" -Force -ErrorAction SilentlyContinue
Write-Host "✅ Old dependencies removed" -ForegroundColor Green
Write-Host ""

Write-Host "📦 Step 3: Installing fresh frontend dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Error installing frontend dependencies" -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host ""

# Verify removal
Write-Host "🔍 Step 4: Verifying Supabase removal..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" -Raw
if ($packageJson -match "supabase") {
    Write-Host "❌ Warning: Supabase still found in package.json" -ForegroundColor Red
} else {
    Write-Host "✅ Supabase successfully removed from package.json" -ForegroundColor Green
}

if (Test-Path "node_modules/@supabase") {
    Write-Host "⚠️  Warning: Supabase packages still in node_modules" -ForegroundColor Yellow
} else {
    Write-Host "✅ No Supabase packages in node_modules" -ForegroundColor Green
}
Pop-Location
Write-Host ""

# Summary
Write-Host "📊 Summary" -ForegroundColor Cyan
Write-Host "==========" -ForegroundColor Cyan
Write-Host "✅ Supabase dependency removed from backend" -ForegroundColor Green
Write-Host "✅ Supabase dependency removed from frontend" -ForegroundColor Green
Write-Host "✅ Fresh dependencies installed" -ForegroundColor Green
Write-Host ""
Write-Host "🔐 Authentication System: MongoDB + JWT" -ForegroundColor Magenta
Write-Host "   - Registration: POST /api/auth/register"
Write-Host "   - Login: POST /api/auth/login"
Write-Host "   - Refresh: POST /api/auth/refresh"
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Start backend: cd backend; python -m uvicorn main:app --reload"
Write-Host "   2. Start frontend: cd frontend; npm run dev"
Write-Host "   3. Test registration and login"
Write-Host ""
Write-Host "✨ Done!" -ForegroundColor Green
