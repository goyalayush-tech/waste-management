#!/bin/bash

# Delhi Waste Management System - Complete Deployment Guide
# ========================================================

echo "Starting deployment process for Delhi Waste Management System..."

# STEP 1: Prerequisites Check
echo "
=== PREREQUISITES ===
Please ensure you have:
1. Git installed
2. GitHub account
3. Render account (free)
4. Vercel account (free)
5. Node.js 16+ installed
6. Python 3.8+ installed
"

read -p "Have you met all prerequisites? (y/n): " prereq_check
if [ "$prereq_check" != "y" ]; then
    echo "Please install prerequisites first!"
    exit 1
fi

# STEP 2: Setup Git Repository
echo "
=== SETTING UP GIT REPOSITORY ===
"

read -p "Enter your GitHub username: " github_username
read -p "Enter repository name (e.g., waste-management-delhi): " repo_name

echo "Creating Git repository..."
git init
git add .
git commit -m "Initial commit: Delhi Waste Management System"

echo "
Now create a new repository on GitHub:
1. Go to https://github.com/new
2. Name: $repo_name
3. Make it public
4. Don't initialize with README
5. Run these commands:

git remote add origin https://github.com/$github_username/$repo_name.git
git branch -M main
git push -u origin main
"

read -p "Press Enter after pushing to GitHub..."

# STEP 3: Backend Deployment on Render
echo "
=== DEPLOYING BACKEND ON RENDER ===
"

echo "1. Go to https://dashboard.render.com/
2. Click 'New +' -> 'Web Service'
3. Connect your GitHub account
4. Select repository: $repo_name
5. Configure:
   - Name: waste-management-backend
   - Root Directory: backend
   - Environment: Python 3
   - Build Command: ./build.sh
   - Start Command: gunicorn app:app
   
6. Add Environment Variables (click 'Advanced'):
"

# Generate secure keys
echo "Generating secure keys..."
SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_hex(32))')
JWT_SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_hex(32))')

echo "
Copy these environment variables to Render:

FLASK_ENV=production
SECRET_KEY=$SECRET_KEY
JWT_SECRET_KEY=$JWT_SECRET_KEY
DATABASE_URL=(Render will provide this)
REDIS_URL=redis://red-xxxxx.render.com:6379
"

echo "
7. Click 'Create Web Service'
8. Wait for deployment (5-10 minutes)
9. Note your backend URL: https://waste-management-backend.onrender.com
"

read -p "Enter your Render backend URL: " backend_url

# STEP 4: Database Setup
echo "
=== SETTING UP DATABASE ===
"

echo "1. In Render dashboard, go to 'New +' -> 'PostgreSQL'
2. Configure:
   - Name: waste-management-db
   - Database: waste_management
   - User: waste_admin
   - Region: Same as your web service
3. Click 'Create Database'
4. Copy the 'Internal Database URL'
5. Add it to your web service environment variables as DATABASE_URL
"

read -p "Press Enter after setting up database..."

# STEP 5: Frontend Deployment on Vercel
echo "
=== DEPLOYING FRONTEND ON VERCEL ===
"

# Update frontend environment
cd frontend
echo "REACT_APP_API_URL=$backend_url" > .env.local
echo "REACT_APP_WS_URL=wss://$(echo $backend_url | sed 's/https:\/\///')" >> .env.local

echo "1. Install Vercel CLI: npm i -g vercel
2. Run: vercel
3. Follow prompts:
   - Set up and deploy: Yes
   - Which scope: Your account
   - Link to existing project: No
   - Project name: waste-management-delhi
   - Directory: ./
   - Override settings: No
"

read -p "Press Enter to start Vercel deployment..."
vercel

echo "
After deployment, go to Vercel dashboard:
1. Go to Project Settings -> Environment Variables
2. Add:
   REACT_APP_API_URL=$backend_url
   REACT_APP_WS_URL=wss://$(echo $backend_url | sed 's/https:\/\///')
3. Redeploy for changes to take effect
"

read -p "Enter your Vercel frontend URL: " frontend_url

# STEP 6: Update CORS settings
echo "
=== UPDATING CORS SETTINGS ===
"

echo "Go back to Render dashboard:
1. Add to environment variables:
   CORS_ORIGINS=$frontend_url,http://localhost:3000
2. Trigger a manual deploy
"

read -p "Press Enter after updating CORS..."

# STEP 7: Initialize Database
echo "
=== INITIALIZING DATABASE ===
"

cd ../backend
echo "Creating initialization script..."

cat > remote_init_db.py << 'EOF'
import os
import sys
from app import create_app, db
from init_db import init_database

# Set production config
os.environ['FLASK_ENV'] = 'production'

# Create app
app = create_app('production')

# Initialize database
with app.app_context():
    print("Creating database tables...")
    db.create_all()
    
    print("Initializing with sample data...")
    init_database()
    
    print("Database initialization complete!")
EOF

echo "
To initialize the database:
1. In Render dashboard, go to your web service
2. Click 'Shell' tab
3. Run: python remote_init_db.py
"

read -p "Press Enter after initializing database..."

# STEP 8: Test Deployment
echo "
=== TESTING DEPLOYMENT ===
"

echo "Testing backend API..."
curl -s "$backend_url/api/zones" | python3 -m json.tool

echo "
Your deployment URLs:
- Frontend: $frontend_url
- Backend API: $backend_url
- API Docs: $backend_url/api/docs

Test the system:
1. Open $frontend_url
2. Register a new admin user
3. Login and explore the dashboard
"

# STEP 9: Setup IoT Simulator
echo "
=== SETTING UP IOT SIMULATOR ===
"

cd ../iot-simulator
echo "API_URL=$backend_url" > .env

echo "To run the IoT simulator:
1. cd iot-simulator
2. pip install -r requirements.txt
3. python simulator.py

For continuous running, use a service like:
- Heroku Scheduler (free tier)
- GitHub Actions (scheduled workflow)
- Your local machine with cron
"

# STEP 10: Monitoring
echo "
=== MONITORING YOUR DEPLOYMENT ===

1. Render Dashboard:
   - View logs
   - Monitor resource usage
   - Set up alerts

2. Vercel Dashboard:
   - View analytics
   - Monitor performance
   - Check function logs

3. Database Monitoring:
   - Use Render's PostgreSQL dashboard
   - Monitor connections and queries

4. Setup Alerts:
   - Email notifications for errors
   - Slack/Discord webhooks
   - Uptime monitoring (UptimeRobot)
"

echo "
=== DEPLOYMENT COMPLETE! ===

Your Delhi Waste Management System is now live!

Important URLs:
- Frontend: $frontend_url
- Backend API: $backend_url
- API Documentation: $backend_url/api/docs

Next Steps:
1. Test all features thoroughly
2. Set up monitoring and alerts
3. Configure custom domain (optional)
4. Enable auto-scaling (Render paid plan)
5. Set up backup strategy

For issues, check:
- Render logs: Dashboard -> Web Service -> Logs
- Vercel logs: Dashboard -> Functions -> Logs
- Database logs: Dashboard -> PostgreSQL -> Logs

Congratulations! 🎉
"