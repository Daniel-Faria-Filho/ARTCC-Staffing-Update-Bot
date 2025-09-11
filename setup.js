const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create (or open) the database and connect to it
const db = new sqlite3.Database('flights.db');

console.log('🗄️  Setting up ZSU NUCAR Bot database...');

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

  // Create positions of interest table
  db.run('CREATE TABLE IF NOT EXISTS positions (prefix text, suffix text, pos_name text)');
  db.run('DELETE FROM positions');

  // ZSU Center
  db.run("INSERT INTO positions VALUES('ZSU', 'CTR', 'San Juan Center')");

  // Approaches / Departures
  db.run("INSERT INTO positions VALUES('SJU', 'APP', 'San Juan Approach')");
  db.run("INSERT INTO positions VALUES('SJU', 'DEP', 'San Juan Departure')");
  db.run("INSERT INTO positions VALUES('STT', 'APP', 'St. Thomas Approach')");
  db.run("INSERT INTO positions VALUES('STX', 'APP', 'St. Croix Approach')");

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

  // Create message history table
  db.run('CREATE TABLE IF NOT EXISTS history (origin text, destination text, notification_time timestamp)');

  // Create position activity table
  db.run('CREATE TABLE IF NOT EXISTS position_activity (callsign text, cid text, controller_name text, status text, pos_name text)');

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
