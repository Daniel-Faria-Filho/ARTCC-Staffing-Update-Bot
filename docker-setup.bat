@echo off
REM ZSU NUCAR Bot Docker Setup Script for Windows

echo 🚀 Setting up ZSU NUCAR Bot with Docker...

REM Check if .env file exists
if not exist .env (
    echo ❌ .env file not found!
    echo 📝 Please copy env.example to .env and fill in your values:
    echo    copy env.example .env
    echo    # Then edit .env with your Discord bot token and channel IDs
    pause
    exit /b 1
)

REM Create data directory
echo 📁 Creating data directory...
if not exist data mkdir data

REM Build and start the container
echo 🐳 Building and starting Docker container...
docker-compose up --build -d

echo ✅ Bot is starting up!
echo 📊 Check logs with: docker-compose logs -f
echo 🛑 Stop bot with: docker-compose down
echo 🔄 Restart bot with: docker-compose restart
pause
