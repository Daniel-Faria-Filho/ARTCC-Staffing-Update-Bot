#!/bin/bash

# ZSU NUCAR Bot Docker Setup Script

echo "🚀 Setting up ZSU NUCAR Bot with Docker..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "📝 Please copy env.example to .env and fill in your values:"
    echo "   cp env.example .env"
    echo "   # Then edit .env with your Discord bot token and channel IDs"
    exit 1
fi

# Create data directory
echo "📁 Creating data directory..."
mkdir -p data

# Build and start the container
echo "🐳 Building and starting Docker container..."
docker-compose up --build -d

echo "✅ Bot is starting up!"
echo "📊 Check logs with: docker-compose logs -f"
echo "🛑 Stop bot with: docker-compose down"
echo "🔄 Restart bot with: docker-compose restart"
