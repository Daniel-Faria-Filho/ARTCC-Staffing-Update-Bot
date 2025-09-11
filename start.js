const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 ZSU NUCAR Bot Startup');
console.log('==============================');

// Check if .env exists
if (!fs.existsSync('.env')) {
  console.log('❌ .env file not found!');
  console.log('📝 Please copy env.example to .env and fill in your Discord token and channel IDs');
  console.log('   copy env.example .env');
  process.exit(1);
}

// Check if database exists
if (!fs.existsSync('flights.db')) {
  console.log('🗄️  Database not found, setting up...');
  try {
    execSync('node setup.js', { stdio: 'inherit' });
    console.log('✅ Database setup complete!');
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

console.log('✅ Environment configuration looks good!');
console.log('🎯 Bot will only send messages when:');
console.log('   • 5+ aircraft file the same route (group flights)');
console.log('   • Controllers sign on/off to monitored positions');
console.log('   • Checks every 60 seconds but only notifies on changes');
console.log('\n🔄 Starting bot... (Press Ctrl+C to stop)');
console.log('--------------------------------------------------');

// Start the main bot
require('./index.js');
