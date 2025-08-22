@echo off
REM Setup script for Waste Verification MVP development environment

echo 🚀 Setting up Waste Verification MVP development environment...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed. Please install Python 3.8+ first.
    exit /b 1
)

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker first.
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Copy environment files
echo 📝 Setting up environment files...
copy backend\.env.example backend\.env
copy ai-services\.env.example ai-services\.env
copy frontend\.env.example frontend\.env

echo ✅ Environment files created

REM Install dependencies
echo 📦 Installing dependencies...
call npm run install:all

echo ✅ Dependencies installed

REM Start development services
echo 🐳 Starting development services with Docker...
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d mongodb redis ipfs

echo ✅ Development environment setup complete!
echo.
echo 🎯 Next steps:
echo 1. Update the .env files with your configuration
echo 2. Run 'npm run dev' to start all services
echo 3. Visit http://localhost:5173 for the frontend
echo 4. API will be available at http://localhost:3001
echo 5. AI service will be available at http://localhost:8001
echo.
echo 📚 Useful commands:
echo - npm run dev          # Start all services
echo - npm run test         # Run all tests
echo - npm run lint         # Lint all code
echo - docker-compose logs  # View service logs