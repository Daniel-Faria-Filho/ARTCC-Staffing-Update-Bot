const { Client, GatewayIntentBits, Events } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const path = require('path');
const fs = require('fs');
require('dotenv').config();

class ZSUNUCARBot {
  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
      ]
    });

    this.staffChannel = process.env.STAFF_CHANNEL;
    this.groupFlightChannel = process.env.GROUP_FLIGHT_CHANNEL;
    this.artccId = process.env.ARTCC_ID || 'ZSU';

    // Ensure data directory exists
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    this.db = new sqlite3.Database(path.join(dataDir, 'flights.db'));
    this.initializeDatabase();
    this.setupEventHandlers();
  }

  initializeDatabase() {
    console.log('🗄️ Database initialization handled by setup.js...');
    // Database setup is handled by setup.js - no duplicate code needed here
    // Just ensure the position_activity table has the correct schema for tracking
    this.db.run('DROP TABLE IF EXISTS position_activity');
    this.db.run('CREATE TABLE position_activity (callsign text, cid text, controller_name text, status text, pos_name text, last_seen integer, logon_time integer)');
  }

  setupEventHandlers() {
    this.client.once(Events.ClientReady, () => {
      console.log(`🤖 Bot is ready! Logged in as ${this.client.user.tag}`);
      this.startTasks();
    });

    this.client.on(Events.Error, (error) => {
      console.error('❌ Discord client error:', error);
    });
  }

  async startTasks() {
    console.log('🔄 Starting monitoring tasks...');
    
    // Initial data fetch
    await this.fetchVATSIMData();
    
    // Run immediate checks (but don't notify - just populate initial state)
    console.log('🔍 Running initial controller check (silent)...');
    await this.monitorControllers(true); // true = silent mode
    
    console.log('✈️ Running immediate group flight check...');
    await this.monitorGroupFlights();
    
    // Start controller monitoring (every 60 seconds)
    setInterval(() => {
      console.log('⏰ [Scheduled] Checking controllers...');
      this.monitorControllers();
    }, 60000);

    // Start group flight monitoring (every 60 seconds)
    setInterval(() => {
      console.log('⏰ [Scheduled] Checking group flights...');
      this.monitorGroupFlights();
    }, 60000);
    
    console.log('✅ Bot is fully operational and monitoring!');
    console.log('📊 Next scheduled check in 60 seconds...');
  }

  async fetchVATSIMData() {
    try {
      console.log('📡 Fetching VATSIM data...');
      
      // Get VATSIM status
      const statusResponse = await fetch('https://status.vatsim.net/status.json');
      const statusData = await statusResponse.json();
      const v3url = statusData.data.v3[0];

      // Get VATSIM data
      const vatsimResponse = await fetch(v3url);
      const vatsimData = await vatsimResponse.json();

      // Clear existing data
      this.db.run('DELETE FROM flights');
      this.db.run('DELETE FROM controllers');

      // Insert pilots
      for (const pilot of vatsimData.pilots) {
        if (pilot.flight_plan) {
          this.db.run(
            'INSERT INTO flights VALUES (?, ?, ?, ?)',
            [pilot.callsign, pilot.flight_plan.departure, pilot.flight_plan.arrival, 'N']
          );
        }
      }

      // Insert prefiles
      for (const prefile of vatsimData.prefiles) {
        if (prefile.flight_plan) {
          this.db.run(
            'INSERT INTO flights VALUES (?, ?, ?, ?)',
            [prefile.callsign, prefile.flight_plan.departure, prefile.flight_plan.arrival, 'Y']
          );
        }
      }

      // Insert controllers
      for (const controller of vatsimData.controllers) {
        this.db.run(
          'INSERT INTO controllers VALUES (?, ?, ?, ?)',
          [controller.callsign, controller.logon_time, controller.name.replace(/'/g, "''"), controller.cid]
        );
      }

      console.log(`✅ Updated VATSIM data: ${vatsimData.controllers.length} controllers, ${vatsimData.pilots.length} pilots`);
      
      // Log any controllers we're tracking
      if (vatsimData.controllers.length > 0) {
        console.log(`📋 Controllers online: ${vatsimData.controllers.map(c => c.callsign).join(', ')}`);
      }
    } catch (error) {
      console.error('❌ Error fetching VATSIM data:', error);
    }
  }

  async monitorControllers(silentMode = false) {
    // Fetch fresh data first (unless in silent mode, then data was already fetched)
    if (!silentMode) {
      await this.fetchVATSIMData();
    }

    return new Promise((resolve) => {
      // Get all controllers
      this.db.all('SELECT callsign, controller_name, controller_cid FROM controllers', (err, controllers) => {
        if (err) {
          console.error('❌ Error fetching controllers:', err);
          resolve();
          return;
        }

        // Get all positions
        this.db.all('SELECT prefix, suffix, pos_name FROM positions', (err, positions) => {
          if (err) {
            console.error('❌ Error fetching positions:', err);
            resolve();
            return;
          }

          console.log(`🔍 Found ${controllers.length} controllers online`);
          
          if (controllers.length === 0) {
            console.log('⚠️ No controllers found in database - this might indicate a VATSIM data fetch issue');
            resolve();
            return;
          }

          // Check each controller against positions
          const processedControllers = new Set();
          
          for (const controller of controllers) {
            const { callsign, controller_name, controller_cid } = controller;
            
            // Skip if we've already processed this controller
            if (processedControllers.has(callsign)) {
              continue;
            }
            
            // Find matching position
            for (const position of positions) {
              const { prefix, suffix, pos_name } = position;
              
              // Check if callsign matches position pattern (prefix + suffix)
              if (callsign.startsWith(prefix) && callsign.endsWith(suffix)) {
                this.checkControllerActivity(callsign, controller_cid, controller_name, pos_name, silentMode);
                processedControllers.add(callsign);
                break; // Only process each controller once
              }
            }
          }

          // Check for controllers who went offline
          this.checkOfflineControllers(controllers);
          resolve();
        });
      });
    });
  }

  checkControllerActivity(callsign, cid, controllerName, posName, silentMode = false) {
    this.db.get(
      'SELECT COUNT(*) as count, last_seen FROM position_activity WHERE callsign = ? AND cid = ? AND status = "A"',
      [callsign, cid],
      (err, row) => {
        if (err) {
          console.error('❌ Error checking controller activity:', err);
          return;
        }

        if (row.count === 0) {
          // Controller just came online - only notify if we haven't seen them recently
          this.db.run(
            'DELETE FROM position_activity WHERE callsign = ? AND cid = ?',
            [callsign, cid]
          );
          
          this.db.run(
            'INSERT INTO position_activity (callsign, cid, controller_name, status, pos_name, last_seen, logon_time) VALUES (?, ?, ?, "A", ?, ?, ?)',
            [callsign, cid, controllerName, posName, Date.now(), Date.now()]
          );

          // Only send notification if not in silent mode (startup)
          if (!silentMode) {
            const message = `***Well, hello there!*** ${controllerName} (CID ${cid}) just signed on to ${posName} (${callsign}).`;
            this.sendToChannel(this.staffChannel, message);
            console.log(`✅ Controller signed on: ${controllerName} to ${posName}`);
          } else {
            console.log(`🔇 Silent mode: Tracking ${controllerName} on ${posName} (${callsign}) - no notification sent`);
          }
        } else {
          // Controller is still online - update last_seen timestamp
          this.db.run(
            'UPDATE position_activity SET last_seen = ? WHERE callsign = ? AND cid = ? AND status = "A"',
            [Date.now(), callsign, cid]
          );
          console.log(`🔄 Controller still online: ${controllerName} on ${posName} (${callsign})`);
        }
      }
    );
  }

  checkOfflineControllers(currentControllers) {
    this.db.all(
      'SELECT callsign, controller_name, cid, pos_name, last_seen, logon_time FROM position_activity WHERE status = "A"',
      (err, activePositions) => {
        if (err) {
          console.error('❌ Error checking offline controllers:', err);
          return;
        }

        for (const activePosition of activePositions) {
          const isStillOnline = currentControllers.some(
            controller => controller.callsign === activePosition.callsign && 
                         controller.controller_cid === activePosition.cid
          );

          if (!isStillOnline) {
            // Check if we've seen them recently (within last 30 seconds) to avoid false disconnections from VATSIM data lag
            this.db.get(
              'SELECT (last_seen + 30000) > ? as recently_seen FROM position_activity WHERE callsign = ? AND cid = ?',
              [Date.now(), activePosition.callsign, activePosition.cid],
              (err, timeCheck) => {
                if (err) {
                  console.error('❌ Error checking last seen time:', err);
                  return;
                }

                if (!timeCheck.recently_seen) {
                  // Controller went offline and hasn't been seen recently (more than 30 seconds ago)
                  this.db.run(
                    'DELETE FROM position_activity WHERE callsign = ? AND cid = ?',
                    [activePosition.callsign, activePosition.cid]
                  );

                  const sessionDuration = this.formatSessionDuration(activePosition.logon_time);
                  const message = `***Byyyeeeeeeeee.*** ${activePosition.controller_name} (CID ${activePosition.cid}) just signed off of ${activePosition.pos_name} (${activePosition.callsign}).${sessionDuration}`;
                  this.sendToChannel(this.staffChannel, message);
                  console.log(`👋 Controller signed off: ${activePosition.controller_name} from ${activePosition.pos_name}`);
                } else {
                  console.log(`⚠️ Skipping offline notification for ${activePosition.controller_name} - seen recently (within 30 seconds)`);
                }
              }
            );
          }
        }
      }
    );
  }

  async monitorGroupFlights() {
    return new Promise((resolve) => {
      this.db.all(
        `SELECT origin, destination, COUNT(*) as count 
         FROM flights 
         WHERE origin IN (SELECT icao FROM airports) OR destination IN (SELECT icao FROM airports) 
         GROUP BY origin, destination 
         HAVING COUNT(*) > 5`,
        (err, groupFlights) => {
          if (err) {
            console.error('❌ Error checking group flights:', err);
            resolve();
            return;
          }

          if (groupFlights.length > 0) {
            console.log(`✈️ Found ${groupFlights.length} potential group flight(s)`);
            for (const groupFlight of groupFlights) {
              this.checkGroupFlightNotification(groupFlight);
            }
          } else {
            console.log('✈️ No group flights detected');
          }
          resolve();
        }
      );
    });
  }

  checkGroupFlightNotification(groupFlight) {
    const { origin, destination, count } = groupFlight;
    
    this.db.get(
      `SELECT COUNT(*) as count FROM history 
       WHERE origin = ? AND destination = ? 
       AND datetime(notification_time) > datetime('now', '-1 hour')`,
      [origin, destination],
      (err, row) => {
        if (err) {
          console.error('❌ Error checking group flight history:', err);
          return;
        }

        if (row.count === 0) {
          // No recent notification for this route
          const message = `***Sheeeesh!*** Group flight check... there are ${count} aircraft filed from ${origin} to ${destination}.`;
          this.sendToChannel(this.groupFlightChannel, message);
          
          this.db.run(
            'INSERT INTO history VALUES (?, ?, datetime("now"))',
            [origin, destination]
          );
          
          console.log(`✈️ Group flight detected: ${count} aircraft from ${origin} to ${destination}`);
        }
      }
    );
  }

  // Helper function to create Discord timestamp
  getDiscordTimestamp() {
    return `<t:${Math.floor(Date.now() / 1000)}:R>`;
  }

  // Helper function to format session duration
  formatSessionDuration(logonTime) {
    if (!logonTime) return '';
    
    const now = Date.now();
    const logonTimestamp = parseInt(logonTime);
    
    // If we can't parse the time, skip session duration
    if (isNaN(logonTimestamp) || logonTimestamp <= 0) {
      return '';
    }
    
    const durationMs = now - logonTimestamp;
    
    // If duration is negative or very small, something went wrong
    if (durationMs < 0 || durationMs < 1000) {
      return '';
    }
    
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return ` (Session Duration: ${hours}h ${minutes}m)`;
    } else {
      return ` (Session Duration: ${minutes}m)`;
    }
  }

  async sendToChannel(channelId, message) {
    try {
      const channel = await this.client.channels.fetch(channelId);
      if (channel) {
        // Add Discord timestamp to the end of the message
        const messageWithTimestamp = `${message} ${this.getDiscordTimestamp()}`;
        await channel.send(messageWithTimestamp);
      } else {
        console.error(`❌ Channel ${channelId} not found`);
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
    }
  }

  start() {
    console.log(`🚀 Starting ${this.artccId} ARTCC Staffing Bot...`);
    console.log('==============================');
    
    if (!process.env.DISCORD_KEY) {
      console.error('❌ DISCORD_KEY not found in environment variables');
      process.exit(1);
    }

    if (!process.env.STAFF_CHANNEL) {
      console.error('❌ STAFF_CHANNEL not found in environment variables');
      process.exit(1);
    }

    if (!process.env.GROUP_FLIGHT_CHANNEL) {
      console.error('❌ GROUP_FLIGHT_CHANNEL not found in environment variables');
      process.exit(1);
    }

    console.log('✅ Environment configuration looks good!');
    console.log('🎯 Bot will only send messages when:');
    console.log('   • 5+ aircraft file the same route (group flights)');
    console.log('   • Controllers sign on/off to monitored positions');
    console.log('   • Checks every 60 seconds but only notifies on changes');
    console.log('🔄 Starting bot... (Press Ctrl+C to stop)');
    console.log('--------------------------------------------------');

    this.client.login(process.env.DISCORD_KEY);
  }
}

// Start the bot
const bot = new ZSUNUCARBot();
bot.start();
