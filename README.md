# ZSU NUCAR Bot (JavaScript Version)

Discord bot that uses VATSIM data to notify about group flight activity and controller sign-ons/offs for ZSU ARTCC.

## Features

- **Group Flight Detection**: Alerts when 5+ aircraft are filed for the same route
- **Controller Notifications**: Notifies when controllers sign on/off to monitored positions
- **ZSU ARTCC Focus**: Monitors Puerto Rico and U.S. Virgin Islands airports and ZSU positions

## Prerequisites

- **Docker and Docker Compose** (recommended) OR **Node.js 16+**
- **Discord Bot Token** (see Discord Bot Setup below)
- **Discord Server** with appropriate channels

## Quick Start with Docker (Recommended)

### Step 1: Get the Code
```bash
git clone <repository-url>
cd zsu-nucar-bot
```

### Step 2: Configure Environment Variables
```bash
# Copy the example environment file
copy env.example .env

# Edit the .env file with your Discord credentials
notepad .env  # Windows
# or
nano .env     # Linux/Mac
```

**Required .env values:**
- `DISCORD_KEY`: Your Discord bot token (see Discord Bot Setup)
- `STAFF_CHANNEL`: Channel ID for controller notifications
- `GROUP_FLIGHT_CHANNEL`: Channel ID for group flight alerts
- `ARTCC_ID`: Set to "ZSU" (already configured)

### Step 3: Run with Docker
```bash
# Build and start the bot
docker-compose up --build

# Or run in background
docker-compose up --build -d
```

**Alternative: Use setup scripts**
- **Windows:** Double-click `docker-setup.bat`
- **Linux/Mac:** `chmod +x docker-setup.sh && ./docker-setup.sh`

## Manual Setup (Without Docker)

### Step 1: Install Dependencies
```bash
# Install Node.js 16+ from https://nodejs.org
npm install
```

### Step 2: Configure Environment
```bash
# Copy environment file
copy env.example .env

# Edit with your Discord credentials
notepad .env
```

### Step 3: Initialize Database (Optional)
```bash
# The bot will auto-create the database, but you can run setup manually
npm run setup
```

**What setup.js does:**
- Creates SQLite database with required tables
- Populates airport data for ZSU ARTCC (Puerto Rico & U.S. Virgin Islands)
- Sets up controller position monitoring (Tower, Ground, Approach, etc.)
- **Note:** The bot automatically runs this on first startup, so manual setup is optional

### Step 4: Run the Bot
```bash
# Start the bot
node .

# Or use npm script
npm start
```

## Discord Bot Setup

### Step 1: Create Discord Application
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"**
3. Enter a name (e.g., "ZSU NUCAR Bot")
4. Click **"Create"**

### Step 2: Create Bot
1. In your application, go to **"Bot"** in the left sidebar
2. Click **"Add Bot"**
3. Click **"Yes, do it!"** to confirm
4. Under **"Token"**, click **"Copy"** to copy your bot token
5. **Save this token** - you'll need it for the `.env` file

### Step 3: Configure Bot Permissions
1. In the **"Bot"** section, scroll down to **"Privileged Gateway Intents"**
2. Enable **"Message Content Intent"** (required for the bot to work)
3. Scroll down to **"Bot Permissions"**
4. Select these permissions:
   - Send Messages
   - Read Message History
   - View Channels
   - Embed Links

### Step 4: Invite Bot to Server
1. Go to **"OAuth2"** → **"URL Generator"**
2. Select **"bot"** in Scopes
3. Select the permissions from Step 3
4. Copy the generated URL and open it in your browser
5. Select your Discord server and click **"Authorize"**

### Step 5: Get Channel IDs
1. In Discord, enable **Developer Mode**:
   - User Settings → Advanced → Developer Mode (ON)
2. Right-click on the channel where you want controller notifications
3. Click **"Copy ID"** - this is your `STAFF_CHANNEL`
4. Right-click on the channel where you want group flight alerts
5. Click **"Copy ID"** - this is your `GROUP_FLIGHT_CHANNEL`
6. You can use the same channel for both if desired

### Step 6: Update .env File
Open your `.env` file and replace the example values:
```env
# Replace with your actual bot token
DISCORD_KEY=your_actual_bot_token_here

# Replace with your actual channel IDs
STAFF_CHANNEL=123456789012345678
GROUP_FLIGHT_CHANNEL=123456789012345678

# Set this to your ARTCC's code (e.g., ZSU)
ARTCC_ID=ZSU
```

### Monitored Airports (ZSU)

The bot monitors these ZSU airports for group flight activity:
- Puerto Rico: TJSJ (SJU), TJIG (SIG), TJBQ (BQN), TJPS (PSE), TJMZ (MAZ), TJRV (RVR), TJVQ (VQS)
- U.S. Virgin Islands: TIST (STT), TISX (STX)

### Monitored Positions (ZSU)

The bot tracks ZSU ARTCC positions including:
- Center: ZSU_CTR (San Juan Center)
- Approach/Departure: SJU_APP/DEP, STT_APP, STX_APP
- Tower/Ground/Delivery: SJU_TWR/GND/DEL, STT_TWR/GND/DEL, STX_TWR/GND/DEL

## Customizing for Your ARTCC

The bot can be easily customized to monitor different airports and positions for your ARTCC.

### Step 1: Update setup.js

Edit the `setup.js` file to add your airports and positions:

**Adding Airports:**
```javascript
// Replace the ZSU airports with your ARTCC's airports
// Format: db.run("INSERT OR IGNORE INTO airports VALUES ('ICAO_CODE')");

// Example for ZNY (New York Center):
db.run("INSERT OR IGNORE INTO airports VALUES ('KJFK')");  // JFK
db.run("INSERT OR IGNORE INTO airports VALUES ('KLGA')");  // LaGuardia
db.run("INSERT OR IGNORE INTO airports VALUES ('KEWR')");  // Newark
```

**Adding Controller Positions:**
```javascript
// Replace ZSU positions with your ARTCC's positions
// Format: db.run("INSERT OR IGNORE INTO positions VALUES('PREFIX', 'SUFFIX', 'Position Name')");

// Example for ZNY positions:
db.run("INSERT OR IGNORE INTO positions VALUES('ZNY', 'CTR', 'New York Center')");
db.run("INSERT OR IGNORE INTO positions VALUES('JFK', 'TWR', 'JFK Tower')");
db.run("INSERT OR IGNORE INTO positions VALUES('JFK', 'GND', 'JFK Ground')");
db.run("INSERT OR IGNORE INTO positions VALUES('JFK', 'APP', 'JFK Approach')");
```

### Step 2: Update .env File

Change the ARTCC identifier in your `.env` file:
```env
# Set to your ARTCC code
ARTCC_ID=ZNY  # or ZLA, ZMA, etc.
```

### Step 3: Position Naming Convention

The bot matches controller callsigns using this pattern:
- **Callsign**: `PREFIX_SUFFIX` (e.g., `JFK_TWR`)
- **Position Pattern**: `PREFIX` + `SUFFIX` (e.g., `JFK` + `TWR`)
- **Position Name**: Human-readable name (e.g., "JFK Tower")

**Common Suffixes:**
- `CTR` - Center
- `APP` - Approach
- `DEP` - Departure  
- `TWR` - Tower
- `GND` - Ground
- `DEL` - Delivery

### Step 4: Restart the Bot

After making changes:
```bash
# Docker
docker-compose restart

# Manual
# Stop the bot (Ctrl+C) and restart
node .
```

The bot will automatically update the database with your new airports and positions.

## Usage

Once running, the bot will:
- Check for group flights every 60 seconds
- Monitor controller activity every 60 seconds
- Send notifications to configured Discord channels

### Docker Commands

**View logs:**
```bash
docker-compose logs -f
```

**Stop the bot:**
```bash
docker-compose down
```

**Restart the bot:**
```bash
docker-compose restart
```

**Update and rebuild:**
```bash
docker-compose up --build -d
```

**Check bot status:**
```bash
docker-compose ps
```

## Troubleshooting

### Common Issues

**Bot doesn't start:**
- Check that your `.env` file exists and has correct values
- Verify Discord bot token is valid
- Ensure channel IDs are correct (enable Developer Mode in Discord)

**Bot starts but no notifications:**
- Check that the bot has permission to send messages in the channels
- Verify channel IDs are correct
- Check bot logs for errors: `docker-compose logs -f`

**Database errors:**
- The bot auto-creates the database on first run
- If issues persist, delete the `data` folder and restart

**Docker issues:**
- Make sure Docker is running
- Try rebuilding: `docker-compose up --build --force-recreate`

### Getting Help

1. Check the logs: `docker-compose logs -f`
2. Verify your `.env` configuration
3. Test Discord bot permissions
4. Check that channels exist and bot has access

## Files

- `index.js` - Main Discord bot with notification logic
- `setup.js` - Creates and populates the SQLite database (auto-runs on startup)
- `env.example` - Environment configuration template
- `package.json` - Node.js dependencies and scripts
- `Dockerfile` - Docker container configuration
- `docker-compose.yml` - Docker orchestration
- `docker-setup.bat/.sh` - Automated setup scripts
