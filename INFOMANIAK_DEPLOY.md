# Deploy to Infomaniak - Step by Step Guide

## 🚀 Infomaniak Deployment (Full Multiplayer)

### Prerequisites:
1. Infomaniak hosting account with Node.js support
2. Your code in a Git repository (GitHub, GitLab, etc.)
3. SSH access to your Infomaniak server

### Step 1: Prepare Your Application
```bash
# Make sure your package.json has the correct start script
npm install
npm start  # Test locally first
```

### Step 2: Configure for Production
Create a production configuration file:

**Create `.env.production`:**
```
NODE_ENV=production
PORT=3000
```

**Update package.json scripts:**
```json
{
  "scripts": {
    "start": "node server/server.js",
    "dev": "nodemon server/server.js",
    "production": "NODE_ENV=production node server/server.js"
  }
}
```

### Step 3: Deploy via SSH

#### Option A: Manual Upload
1. **Connect via SSH:**
   ```bash
   ssh your-username@your-domain.infomaniak.com
   ```

2. **Navigate to public folder:**
   ```bash
   cd public_html
   # or wherever your Node.js apps go
   ```

3. **Clone your repository:**
   ```bash
   git clone https://github.com/your-username/minecraft-game.git
   cd minecraft-game
   ```

4. **Install dependencies:**
   ```bash
   npm install --production
   ```

#### Option B: Via FTP/SFTP
1. Use FileZilla or similar to upload all files
2. Upload to your Node.js application directory
3. SSH in and run `npm install --production`

### Step 4: Configure Infomaniak Node.js App

1. **In Infomaniak Manager:**
   - Go to "Web hosting" → "Node.js"
   - Create new Node.js application
   - Set entry point: `server/server.js`
   - Set port: `3000` (or as specified by Infomaniak)

2. **Domain Configuration:**
   - Point your domain/subdomain to the Node.js app
   - Enable HTTPS if available

### Step 5: Start the Application
```bash
# Via Infomaniak control panel or SSH
npm run production
```

## 🌐 Infomaniak-Specific Settings

### Environment Variables:
Set these in Infomaniak control panel:
- `NODE_ENV=production`
- `PORT=3000` (or as provided by Infomaniak)

### File Structure on Server:
```
/your-app-folder/
├── server/
│   └── server.js
├── client/
│   ├── index.html
│   └── js/game.js
├── package.json
└── node_modules/
```

## 🎮 What You Get on Infomaniak:
- ✅ Full Node.js support
- ✅ Socket.io real-time communication
- ✅ Swiss hosting (excellent performance)
- ✅ HTTPS included
- ✅ Professional infrastructure
- ✅ EU data protection compliance

## 🔧 Troubleshooting:

### If app doesn't start:
1. Check Node.js version compatibility
2. Verify all dependencies are installed
3. Check Infomaniak logs via control panel

### If Socket.io doesn't work:
1. Ensure WebSocket support is enabled
2. Check firewall settings
3. Verify port configuration

### Performance Issues:
1. Enable gzip compression
2. Configure CDN if available
3. Monitor resource usage in Infomaniak panel

## 💡 Infomaniak Pro Tips:
1. **Subdomain setup**: Use `minecraft.yourdomain.com`
2. **SSL Certificate**: Enable free Let's Encrypt SSL
3. **Monitoring**: Use Infomaniak's monitoring tools
4. **Backups**: Enable automatic backups
5. **Updates**: Use git pull for easy updates

## 🚀 Quick Update Process:
```bash
# SSH into your server
cd /path/to/your/app
git pull origin main
npm install --production
# Restart via Infomaniak control panel
```

## 🌍 Your Game URLs:
- **Game**: `https://yourdomain.com` or `https://minecraft.yourdomain.com`
- **WebSocket**: Same domain (Infomaniak handles routing)

## 📊 Performance Optimizations for Infomaniak:
- **Optimized rendering**: All performance improvements included
- **Reduced server load**: Minimal chunk generation
- **Fast loading**: Instant multiplayer connections
- **Memory efficient**: Shared geometries and basic materials

Ready to deploy on Infomaniak! 🇨🇭🚀
