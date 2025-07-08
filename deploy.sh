#!/bin/bash

echo "🚀 Preparing for Render deployment..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "📁 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit"
    echo "✅ Git repository created!"
    echo "📌 Next: Push to GitHub and deploy on Render"
    echo "   1. Create a GitHub repository"
    echo "   2. git remote add origin <your-github-url>"
    echo "   3. git push -u origin main"
    echo "   4. Go to render.com and deploy from GitHub"
else
    echo "📁 Git repository exists, preparing commit..."
    git add .
    git status
    echo ""
    echo "📝 Ready to commit and push!"
    echo "Run these commands:"
    echo "   git commit -m \"Ready for Render deployment\""
    echo "   git push origin main"
    echo ""
    echo "🌐 Then go to render.com to deploy!"
fi

echo ""
echo "🔗 Render deployment URL: https://render.com"
echo "📖 Full guide: See RENDER_DEPLOY.md"
