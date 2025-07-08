#!/bin/bash

echo "🇨🇭 Deploying to Infomaniak..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Run this script from your project root."
    exit 1
fi

echo "📦 Installing production dependencies..."
npm install --production

echo "🧪 Testing application locally..."
npm start &
SERVER_PID=$!
sleep 5

# Test if server is running
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Local test successful!"
    kill $SERVER_PID
else
    echo "❌ Local test failed!"
    kill $SERVER_PID
    exit 1
fi

echo "📁 Creating deployment package..."
# Create a clean directory for deployment
mkdir -p deploy-temp
cp -r server client package.json package-lock.json deploy-temp/

echo "📋 Deployment checklist:"
echo "1. ✅ Upload contents of 'deploy-temp' folder to Infomaniak"
echo "2. ✅ SSH into your server: ssh your-username@your-domain.infomaniak.com"
echo "3. ✅ Run: npm install --production"
echo "4. ✅ Configure Node.js app in Infomaniak control panel"
echo "5. ✅ Set entry point: server/server.js"
echo "6. ✅ Start the application"

echo ""
echo "🌐 After deployment, your game will be available at:"
echo "   https://yourdomain.com"
echo ""
echo "📖 Full guide: See INFOMANIAK_DEPLOY.md"

# Clean up
rm -rf deploy-temp
