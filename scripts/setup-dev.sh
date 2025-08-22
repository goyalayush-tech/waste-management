#!/bin/bash

# Setup script for Waste Verification MVP development environment

echo "🚀 Setting up Waste Verification MVP development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Copy environment files
echo "📝 Setting up environment files..."
cp backend/.env.example backend/.env
cp ai-services/.env.example ai-services/.env
cp frontend/.env.example frontend/.env

echo "✅ Environment files created"

# Install dependencies
echo "📦 Installing dependencies..."
npm run install:all

echo "✅ Dependencies installed"

# Start development services
echo "🐳 Starting development services with Docker..."
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d mongodb redis ipfs

echo "✅ Development environment setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Update the .env files with your configuration"
echo "2. Run 'npm run dev' to start all services"
echo "3. Visit http://localhost:5173 for the frontend"
echo "4. API will be available at http://localhost:3001"
echo "5. AI service will be available at http://localhost:8001"
echo ""
echo "📚 Useful commands:"
echo "- npm run dev          # Start all services"
echo "- npm run test         # Run all tests"
echo "- npm run lint         # Lint all code"
echo "- docker-compose logs  # View service logs"