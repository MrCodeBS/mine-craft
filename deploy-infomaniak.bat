@echo off
echo 🇨🇭 Deploying to Infomaniak...

REM Check if we're in the right directory
if not exist package.json (
    echo ❌ Error: package.json not found. Run this script from your project root.
    pause
    exit /b 1
)

echo 📦 Installing production dependencies...
npm install --production

echo 📁 Creating deployment package...
if exist deploy-temp rmdir /s /q deploy-temp
mkdir deploy-temp
xcopy server deploy-temp\server\ /e /i /q
xcopy client deploy-temp\client\ /e /i /q
copy package.json deploy-temp\
copy package-lock.json deploy-temp\

echo.
echo 📋 Deployment checklist:
echo 1. ✅ Upload contents of 'deploy-temp' folder to Infomaniak
echo 2. ✅ SSH into your server or use Infomaniak file manager
echo 3. ✅ Run: npm install --production
echo 4. ✅ Configure Node.js app in Infomaniak control panel
echo 5. ✅ Set entry point: server/server.js
echo 6. ✅ Start the application
echo.
echo 🌐 After deployment, your game will be available at:
echo    https://yourdomain.com
echo.
echo 📖 Full guide: See INFOMANIAK_DEPLOY.md
echo.

pause

REM Clean up
rmdir /s /q deploy-temp
