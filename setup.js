const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

console.log('🗄️  Setting up ZSU NUCAR Bot database...');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  console.log('📁 Creating data directory...');
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('✅ Data directory created');
}

// Create (or open) the database and connect to it
const db = new sqlite3.Database(path.join(dataDir, 'flights.db'));

// Create tables
db.serialize(() => {
  // Create flights table
  db.run('CREATE TABLE IF NOT EXISTS flights (callsign text, origin text, destination text, prefile text)');
  db.run('DELETE FROM flights');

  // Create controller table
  db.run('CREATE TABLE IF NOT EXISTS controllers (callsign text, logon_date text, controller_name text, controller_cid text)');
  db.run('DELETE FROM controllers');

  // Create airports of interest table (ZSU ARTCC only)
  db.run('CREATE TABLE IF NOT EXISTS airports (icao text)');
  db.run('DELETE FROM airports');

  // Puerto Rico
  db.run("INSERT INTO airports VALUES ('TJSJ')");  // San Juan / Luis Muñoz Marín
  db.run("INSERT INTO airports VALUES ('TJIG')");  // Isla Grande / Fernando Luis Ribas Dominicci
  db.run("INSERT INTO airports VALUES ('TJBQ')");  // Aguadilla / Rafael Hernández
  db.run("INSERT INTO airports VALUES ('TJPS')");  // Ponce / Mercedita
  db.run("INSERT INTO airports VALUES ('TJMZ')");  // Mayagüez / Eugenio María de Hostos
  db.run("INSERT INTO airports VALUES ('TJRV')");  // Ceiba / José Aponte de la Torre (Roosevelt Roads)
  db.run("INSERT INTO airports VALUES ('TJVQ')");  // Vieques / Antonio Rivera Rodríguez

  // U.S. Virgin Islands
  db.run("INSERT INTO airports VALUES ('TIST')");  // St. Thomas / Cyril E. King
  db.run("INSERT INTO airports VALUES ('TISX')");  // St. Croix / Henry E. Rohlsen

  // Netherlands Antilles (San Juan Center jurisdiction)
  db.run("INSERT INTO airports VALUES ('TNCM')");  // St. Maarten / Princess Juliana International
  db.run("INSERT INTO airports VALUES ('TQPF')");  // Anguilla / Clayton J. Lloyd International
  db.run("INSERT INTO airports VALUES ('TNCE')");  // St. Eustatius / F.D. Roosevelt
  db.run("INSERT INTO airports VALUES ('TNCB')");  // Saba / Juancho E. Yrausquin

  // Create positions of interest table
  db.run('CREATE TABLE IF NOT EXISTS positions (prefix text, suffix text, pos_name text)');
  db.run('DELETE FROM positions');

  // ZSU Center
  db.run("INSERT INTO positions VALUES('SJU', 'CTR', 'San Juan Center')");

  // Approaches / Departures
  db.run("INSERT INTO positions VALUES('SJU', 'APP', 'San Juan Approach')");
  db.run("INSERT INTO positions VALUES('SJU', 'DEP', 'San Juan Departure')");
  db.run("INSERT INTO positions VALUES('STT', 'APP', 'St. Thomas Approach')");
  db.run("INSERT INTO positions VALUES('STX', 'APP', 'St. Croix Approach')");
  db.run("INSERT INTO positions VALUES('SXM', 'APP', 'Princess Juliana Approach')");
  db.run("INSERT INTO positions VALUES('SXM', 'DEP', 'Princess Juliana Departure')");
  db.run("INSERT INTO positions VALUES('TNCM', 'APP', 'Princess Juliana Approach')");
  db.run("INSERT INTO positions VALUES('TNCM', 'DEP', 'Princess Juliana Departure')");
  db.run("INSERT INTO positions VALUES('AXA', 'APP', 'Anguilla Approach')");
  db.run("INSERT INTO positions VALUES('AXA', 'DEP', 'Anguilla Departure')");
  db.run("INSERT INTO positions VALUES('EUX', 'APP', 'St. Eustatius Approach')");
  db.run("INSERT INTO positions VALUES('EUX', 'DEP', 'St. Eustatius Departure')");
  db.run("INSERT INTO positions VALUES('SAB', 'APP', 'Saba Approach')");
  db.run("INSERT INTO positions VALUES('SAB', 'DEP', 'Saba Departure')");

  // San Juan (TJSJ) - SJU
  db.run("INSERT INTO positions VALUES('SJU', 'TWR', 'San Juan Tower')");
  db.run("INSERT INTO positions VALUES('SJU', 'GND', 'San Juan Ground')");
  db.run("INSERT INTO positions VALUES('SJU', 'DEL', 'San Juan Delivery')");

  // Isla Grande (TJIG) - SIG
  db.run("INSERT INTO positions VALUES('SIG', 'TWR', 'Isla Grande Tower')");
  db.run("INSERT INTO positions VALUES('SIG', 'GND', 'Isla Grande Ground')");
  db.run("INSERT INTO positions VALUES('SIG', 'DEL', 'Isla Grande Delivery')");

  // Aguadilla (TJBQ) - BQN
  db.run("INSERT INTO positions VALUES('BQN', 'TWR', 'Aguadilla Tower')");
  db.run("INSERT INTO positions VALUES('BQN', 'GND', 'Aguadilla Ground')");
  db.run("INSERT INTO positions VALUES('BQN', 'DEL', 'Aguadilla Delivery')");

  // Ponce (TJPS) - PSE
  db.run("INSERT INTO positions VALUES('PSE', 'TWR', 'Ponce Tower')");
  db.run("INSERT INTO positions VALUES('PSE', 'GND', 'Ponce Ground')");
  db.run("INSERT INTO positions VALUES('PSE', 'DEL', 'Ponce Delivery')");

  // Mayagüez (TJMZ) - MAZ
  db.run("INSERT INTO positions VALUES('MAZ', 'TWR', 'Mayagüez Tower')");
  db.run("INSERT INTO positions VALUES('MAZ', 'GND', 'Mayagüez Ground')");
  db.run("INSERT INTO positions VALUES('MAZ', 'DEL', 'Mayagüez Delivery')");

  // Ceiba (TJRV) - RVR
  db.run("INSERT INTO positions VALUES('RVR', 'TWR', 'Ceiba Tower')");
  db.run("INSERT INTO positions VALUES('RVR', 'GND', 'Ceiba Ground')");
  db.run("INSERT INTO positions VALUES('RVR', 'DEL', 'Ceiba Delivery')");

  // Vieques (TJVQ) - VQS
  db.run("INSERT INTO positions VALUES('VQS', 'TWR', 'Vieques Tower')");
  db.run("INSERT INTO positions VALUES('VQS', 'GND', 'Vieques Ground')");
  db.run("INSERT INTO positions VALUES('VQS', 'DEL', 'Vieques Delivery')");

  // St. Thomas (TIST) - STT
  db.run("INSERT INTO positions VALUES('STT', 'TWR', 'St. Thomas Tower')");
  db.run("INSERT INTO positions VALUES('STT', 'GND', 'St. Thomas Ground')");
  db.run("INSERT INTO positions VALUES('STT', 'DEL', 'St. Thomas Delivery')");

  // St. Croix (TISX) - STX
  db.run("INSERT INTO positions VALUES('STX', 'TWR', 'St. Croix Tower')");
  db.run("INSERT INTO positions VALUES('STX', 'GND', 'St. Croix Ground')");
  db.run("INSERT INTO positions VALUES('STX', 'DEL', 'St. Croix Delivery')");

  // St. Maarten (TNCM) - SXM
  db.run("INSERT INTO positions VALUES('SXM', 'TWR', 'Princess Juliana Tower')");
  db.run("INSERT INTO positions VALUES('SXM', 'GND', 'Princess Juliana Ground')");
  db.run("INSERT INTO positions VALUES('SXM', 'DEL', 'Princess Juliana Delivery')");

  // St. Maarten (TNCM) - TNCM positions
  db.run("INSERT INTO positions VALUES('TNCM', 'TWR', 'Princess Juliana Tower')");
  db.run("INSERT INTO positions VALUES('TNCM', 'GND', 'Princess Juliana Ground')");
  db.run("INSERT INTO positions VALUES('TNCM', 'DEL', 'Princess Juliana Delivery')");

  // Anguilla (TQPF) - TQPF
  db.run("INSERT INTO positions VALUES('TQPF', 'TWR', 'Anguilla Tower')");
  db.run("INSERT INTO positions VALUES('TQPF', 'GND', 'Anguilla Ground')");
  db.run("INSERT INTO positions VALUES('TQPF', 'DEL', 'Anguilla Delivery')");

  // St. Eustatius (TNCE) - EUX
  db.run("INSERT INTO positions VALUES('EUX', 'TWR', 'St. Eustatius Tower')");
  db.run("INSERT INTO positions VALUES('EUX', 'GND', 'St. Eustatius Ground')");
  db.run("INSERT INTO positions VALUES('EUX', 'DEL', 'St. Eustatius Delivery')");

  // Saba (TNCB) - SAB
  db.run("INSERT INTO positions VALUES('SAB', 'TWR', 'Saba Tower')");
  db.run("INSERT INTO positions VALUES('SAB', 'GND', 'Saba Ground')");
  db.run("INSERT INTO positions VALUES('SAB', 'DEL', 'Saba Delivery')");

  // Create message history table
  db.run('CREATE TABLE IF NOT EXISTS history (origin text, destination text, notification_time timestamp)');

  // Create position activity table with tracking columns used by the bot
  db.run('CREATE TABLE IF NOT EXISTS position_activity (callsign text, cid text, controller_name text, status text, pos_name text, last_seen integer, logon_time integer)');

  console.log('✅ Database initialized successfully!');
});

// Close the database connection
db.close((err) => {
  if (err) {
    console.error('❌ Error closing database:', err.message);
  } else {
    console.log('🎯 Database setup complete!');
    console.log('📝 Next steps:');
    console.log('   1. Copy .env.example to .env');
    console.log('   2. Fill in your Discord bot token and channel IDs');
    console.log('   3. Run: npm start');
  }
});
