# Render Deployment Requirements for Waste Management System

## What You Need for Render (FREE Tier)

### 1. **Render Account**
- Sign up at: https://render.com/
- Free tier includes:
  - 750 hours/month of free instance hours
  - Free PostgreSQL database (90 days, then $7/month)
  - Free Redis instance
  - Automatic HTTPS/SSL
  - Automatic deploys from GitHub

### 2. **Services to Create on Render**

#### A. Web Service (Backend API)
```
Service Type: Web Service
Name: waste-management-backend
Environment: Python 3
Region: Oregon (US West) or Frankfurt (EU)
Branch: main
Root Directory: backend
Build Command: ./build.sh
Start Command: gunicorn app:app --bind 0.0.0.0:$PORT
```

#### B. PostgreSQL Database
```
Service Type: PostgreSQL
Name: waste-management-db
Database: waste_management
User: waste_admin
Version: 15
Plan: Free (90 days)
```

#### C. Redis Instance (Optional - for caching)
```
Service Type: Redis
Name: waste-management-redis
Plan: Free
Maxmemory Policy: allkeys-lru
```

### 3. **Environment Variables for Backend**

```bash
# Required Environment Variables
FLASK_ENV=production
SECRET_KEY=your-generated-secret-key-here
JWT_SECRET_KEY=your-generated-jwt-secret-here
DATABASE_URL=postgresql://waste_admin:password@dpg-xxxxx.render.com/waste_management
REDIS_URL=redis://red-xxxxx.render.com:6379

# CORS Settings
CORS_ORIGINS=https://your-frontend.vercel.app,http://localhost:3000

# Optional
LOG_LEVEL=INFO
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

### 4. **Build Configuration**

The `build.sh` file (already created) will:
- Install Python dependencies
- Run database migrations
- Collect static files
- Set up the environment

### 5. **Free Tier Limitations**

- **Web Service**: 
  - Spins down after 15 minutes of inactivity
  - First request after spin-down takes 30-50 seconds
  - 512 MB RAM, 0.1 CPU

- **PostgreSQL**:
  - 256 MB RAM
  - 1 GB storage
  - Free for 90 days only

- **Redis**:
  - 25 MB RAM
  - No persistence

### 6. **Deployment Steps**

```bash
# 1. Push your code to GitHub
git add .
git commit -m "Ready for deployment"
git push origin main

# 2. In Render Dashboard:
# - Click "New +" → "Web Service"
# - Connect GitHub repository
# - Select your repo
# - Configure as shown above
# - Add environment variables
# - Click "Create Web Service"

# 3. Wait for deployment (5-10 minutes)
# Your API will be available at:
# https://waste-management-backend.onrender.com
```

### 7. **Post-Deployment Setup**

```bash
# Initialize database (in Render Shell)
python -c "from app import create_app, db; app = create_app(); app.app_context().push(); db.create_all()"
python init_db.py

# Test API
curl https://waste-management-backend.onrender.com/api/zones
```

### 8. **Monitoring & Logs**

- **Logs**: Dashboard → Service → Logs
- **Metrics**: Dashboard → Service → Metrics
- **Shell**: Dashboard → Service → Shell (for debugging)

### 9. **Upgrading from Free Tier**

When ready to scale:
- **Starter Plan ($7/month)**:
  - No spin-down
  - 512 MB RAM
  - Custom domains

- **Database ($7/month after 90 days)**:
  - 256 MB RAM
  - 1 GB storage
  - Daily backups

### 10. **Alternative Free Options**

If you want completely free hosting:
- **Railway.app**: $5 free credit/month
- **Fly.io**: Free tier with 3 shared VMs
- **Cyclic.sh**: Serverless, always free
- **Deta.sh**: Free Python hosting

## Quick Start Commands

```bash
# Generate secure keys
python3 -c 'import secrets; print("SECRET_KEY=" + secrets.token_hex(32))'
python3 -c 'import secrets; print("JWT_SECRET_KEY=" + secrets.token_hex(32))'

# Test deployment
curl -X GET https://your-app.onrender.com/api/zones
```

## Cost Summary

- **First 90 days**: Completely FREE
- **After 90 days**: $7/month for database
- **For production**: ~$14/month (Web Service + DB)

That's everything you need for Render deployment!