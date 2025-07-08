# Minecraft Multiplayer Game Deployment Guide

## Option 1: Deploy Demo on Vercel (Single Player)

### Quick Deployment:
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel` in this directory
3. Follow the prompts
4. Your demo will be live at `https://your-project.vercel.app`

### What gets deployed:
- Single-player demo version (`index.html`)
- Same 3D graphics and movement
- No multiplayer features (no Socket.io server)

---

## Option 2: Deploy Full Multiplayer on Railway (Recommended)

### Steps:
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select this repository
5. Railway will automatically detect Node.js and deploy

### Configuration:
- Railway supports Socket.io out of the box
- Your app will be live at `https://your-app.up.railway.app`
- Full multiplayer functionality works

---

## Option 3: Deploy Full Multiplayer on Render

### Steps:
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New Web Service"
4. Connect your GitHub repo
5. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node

---

## Option 4: Deploy Full Multiplayer on Heroku

### Steps:
1. Install Heroku CLI
2. Run these commands:
```bash
heroku create your-minecraft-game
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

---

## Files in this project:

### For Vercel (Single Player):
- `index.html` - Standalone demo
- `vercel.json` - Vercel configuration

### For Railway/Render/Heroku (Full Multiplayer):
- `package.json` - Dependencies
- `server/server.js` - Node.js server
- `client/` - Game files

## Recommendation:
- **For demo/portfolio**: Use Vercel with `index.html`
- **For real multiplayer game**: Use Railway (easiest) or Render
