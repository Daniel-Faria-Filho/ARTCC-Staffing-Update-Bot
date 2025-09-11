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
    console.log('🗄️ Initializing database...');
    
    this.db.serialize(() => {
      // Create flights table
      this.db.run('CREATE TABLE IF NOT EXISTS flights (callsign text, origin text, destination text, prefile text)');
      
      // Create controller table
      this.db.run('CREATE TABLE IF NOT EXISTS controllers (callsign text, logon_date text, controller_name text, controller_cid text)');
      
      // Create position activity tracking table
      this.db.run('CREATE TABLE IF NOT EXISTS position_activity (callsign text, cid text, controller_name text, status text, pos_name text, last_seen timestamp DEFAULT CURRENT_TIMESTAMP)');
      
      // Create airports of interest table (ZSU ARTCC only)
      this.db.run('CREATE TABLE IF NOT EXISTS airports (icao text)');
      
      // Puerto Rico
      this.db.run("INSERT OR IGNORE INTO airports VALUES ('TJSJ')");  // San Juan / Luis Muñoz Marín
      this.db.run("INSERT OR IGNORE INTO airports VALUES ('TJIG')");  // Isla Grande / Fernando Luis Ribas Dominicci
      this.db.run("INSERT OR IGNORE INTO airports VALUES ('TJBQ')");  // Aguadilla / Rafael Hernández
      this.db.run("INSERT OR IGNORE INTO airports VALUES ('TJPS')");  // Ponce / Mercedita
      this.db.run("INSERT OR IGNORE INTO airports VALUES ('TJMZ')");  // Mayagüez / Eugenio María de Hostos
      this.db.run("INSERT OR IGNORE INTO airports VALUES ('TJRV')");  // Ceiba / José Aponte de la Torre (Roosevelt Roads)
      this.db.run("INSERT OR IGNORE INTO airports VALUES ('TJVQ')");  // Vieques / Antonio Rivera Rodríguez

      // U.S. Virgin Islands
      this.db.run("INSERT OR IGNORE INTO airports VALUES ('TIST')");  // St. Thomas / Cyril E. King
      this.db.run("INSERT OR IGNORE INTO airports VALUES ('TISX')");  // St. Croix / Henry E. Rohlsen

      // Create positions of interest table
      this.db.run('CREATE TABLE IF NOT EXISTS positions (prefix text, suffix text, pos_name text)');
      
      // ZSU Center
      this.db.run("INSERT OR IGNORE INTO positions VALUES('ZSU', 'CTR', 'San Juan Center')");

      // Approaches / Departures
      this.db.run("INSERT OR IGNORE INTO positions VALUES('SJU', 'APP', 'San Juan Approach')");
      this.db.run("INSERT OR IGNORE INTO positions VALUES('SJU', 'DEP', 'San Juan Departure')");
      this.db.run("INSERT OR IGNORE INTO positions VALUES('STT', 'APP', 'St. Thomas Approach')");
      this.db.run("INSERT OR IGNORE INTO positions VALUES('STX', 'APP', 'St. Croix Approach')");

      // San Juan (TJSJ) - SJU
      this.db.run("INSERT OR IGNORE INTO positions VALUES('SJU', 'TWR', 'San Juan Tower')");
      this.db.run("INSERT OR IGNORE INTO positions VALUES('SJU', 'GND', 'San Juan Ground')");
      this.db.run("INSERT OR IGNORE INTO positions VALUES('SJU', 'DEL', 'San Juan Delivery')");

      // Isla Grande (TJIG) - SIG
      this.db.run("INSERT OR IGNORE INTO positions VALUES('SIG', 'TWR', 'Isla Grande Tower')");
      this.db.run("INSERT OR IGNORE INTO positions VALUES('SIG', 'GND', 'Isla Grande Ground')");
      this.db.run("INSERT OR IGNORE INTO positions VALUES('SIG', 'DEL', 'Isla Grande Delivery')");

      // Aguadilla (TJBQ) - BQN
      this.db.run("INSERT OR IGNORE INTO positions VALUES('BQN', 'TWR', 'Aguadilla Tower')");
      this.db.run("INSERT OR IGNORE INTO positions VALUES('BQN', 'GND', 'Aguadilla Ground')");
      this.db.run("INSERT OR IGNORE INTO positions VALUES('BQN', 'DEL', 'Aguadilla Delivery')");

      // Ponce (TJPS) - PSE
      this.db.run("INSERT OR IGNORE INTO positions VALUES('PSE', 'TWR', 'Ponce Tower')");
      this.db.run("INSERT OR IGNORE INTO positions VALUES('PSE', 'GND', 'Ponce Ground')");
      this.db.run("INSERT OR IGNORE INTO positions VALUES('PSE', 'DEL', 'Ponce Delivery')");

      // Mayagüez (TJMZ) - MAZ
      this.db.run("INSERT OR IGNORE INTO positions VALUES('MAZ', 'TWR', 'Mayagüez Tower')");
      this.db.run("INSERT OR IGNORE INTO positions VALUES('MAZ', 'GND', 'Mayagüez Ground')");
      this.db.run("INSERT OR IGNORE INTO positions VALUES('MAZ', 'DEL', 'Mayagüez Delivery')");

      // Ceiba (TJRV) - RVR
      this.db.run("INSERT OR IGNORE INTO positions VALUES('RVR', 'TWR', 'Ceiba Tower')");
      this.db.run("INSERT OR IGNORE INTO positions VALUES('RVR', 'GND', 'Ceiba Ground')");
      this.db.run("INSERT OR IGNORE INTO positions VALUES('RVR', 'DEL', 'Ceiba Delivery')");

      // Vieques (TJVQ) - VQS
      this.db.run("INSERT OR IGNORE INTO positions VALUES('VQS', 'TWR', 'Vieques Tower')");
      this.db.run("INSERT OR IGNORE INTO positions VALUES('VQS', 'GND', 'Vieques Ground')");
      this.db.run("INSERT OR IGNORE INTO positions VALUES('VQS', 'DEL', 'Vieques Delivery')");

      // St. Thomas (TIST) - STT
      this.db.run("INSERT OR IGNORE INTO positions VALUES('STT', 'TWR', 'St. Thomas Tower')");
      this.db.run("INSERT OR IGNORE INTO positions VALUES('STT', 'GND', 'St. Thomas Ground')");
      this.db.run("INSERT OR IGNORE INTO positions VALUES('STT', 'DEL', 'St. Thomas Delivery')");

      // St. Croix (TISX) - STX
      this.db.run("INSERT OR IGNORE INTO positions VALUES('STX', 'TWR', 'St. Croix Tower')");
      this.db.run("INSERT OR IGNORE INTO positions VALUES('STX', 'GND', 'St. Croix Ground')");
      this.db.run("INSERT OR IGNORE INTO positions VALUES('STX', 'DEL', 'St. Croix Delivery')");

      // Create message history table
      this.db.run('CREATE TABLE IF NOT EXISTS history (origin text, destination text, notification_time timestamp)');

      // Create position activity table
      this.db.run('CREATE TABLE IF NOT EXISTS position_activity (callsign text, cid text, controller_name text, status text, pos_name text)');
    });
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
    
    // Run immediate checks
    console.log('🔍 Running immediate controller check...');
    await this.monitorControllers();
    
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

  async monitorControllers() {
    // Fetch fresh data first
    await this.fetchVATSIMData();

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
              
              // Check if callsign matches position pattern exactly
              // Use more precise matching to avoid false positives
              const expectedCallsign = `${prefix}_${suffix}`;
              if (callsign === expectedCallsign) {
                this.checkControllerActivity(callsign, controller_cid, controller_name, pos_name);
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

  checkControllerActivity(callsign, cid, controllerName, posName) {
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
            'INSERT INTO position_activity (callsign, cid, controller_name, status, pos_name, last_seen) VALUES (?, ?, ?, "A", ?, datetime("now"))',
            [callsign, cid, controllerName, posName]
          );

          const message = `***Well, hello there!*** ${controllerName} (CID ${cid}) just signed on to ${posName} (${callsign}).`;
          this.sendToChannel(this.staffChannel, message);
          console.log(`✅ Controller signed on: ${controllerName} to ${posName}`);
        } else {
          // Controller is still online - update last_seen timestamp
          this.db.run(
            'UPDATE position_activity SET last_seen = datetime("now") WHERE callsign = ? AND cid = ? AND status = "A"',
            [callsign, cid]
          );
        }
      }
    );
  }

  checkOfflineControllers(currentControllers) {
    this.db.all(
      'SELECT callsign, controller_name, cid, pos_name, last_seen FROM position_activity WHERE status = "A"',
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
            // Check if we've seen them recently (within last 2 minutes) to avoid false disconnections
            this.db.get(
              'SELECT datetime(last_seen, "+2 minutes") > datetime("now") as recently_seen FROM position_activity WHERE callsign = ? AND cid = ?',
              [activePosition.callsign, activePosition.cid],
              (err, timeCheck) => {
                if (err) {
                  console.error('❌ Error checking last seen time:', err);
                  return;
                }

                if (!timeCheck.recently_seen) {
                  // Controller went offline and hasn't been seen recently
                  this.db.run(
                    'DELETE FROM position_activity WHERE callsign = ? AND cid = ?',
                    [activePosition.callsign, activePosition.cid]
                  );

                  const message = `***Byyyeeeeeeeee.*** ${activePosition.controller_name} (CID ${activePosition.cid}) just signed off of ${activePosition.pos_name} (${activePosition.callsign}).`;
                  this.sendToChannel(this.staffChannel, message);
                  console.log(`👋 Controller signed off: ${activePosition.controller_name} from ${activePosition.pos_name}`);
                } else {
                  console.log(`⚠️ Skipping offline notification for ${activePosition.controller_name} - seen recently`);
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

  async sendToChannel(channelId, message) {
    try {
      const channel = await this.client.channels.fetch(channelId);
      if (channel) {
        await channel.send(message);
      } else {
        console.error(`❌ Channel ${channelId} not found`);
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
    }
  }

  start() {
    console.log('🚀 Starting ZSU NUCAR Bot...');
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
