const { Pool } = require('pg');
const fs   = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function runSQL(filePath, label) {
  console.log(`\n📄 Running: ${label}...`);
  const sql = fs.readFileSync(filePath, 'utf8');
  await pool.query(sql);
  console.log(`✅ Done: ${label}`);
}

async function setup() {
  try {
    console.log('🔄 Connecting to database...');
    await pool.query('SELECT 1'); // test connection
    console.log('✅ Connected!\n');

    const dbDir = path.join(__dirname, 'database');

    await runSQL(path.join(dbDir, 'schema.sql'),               '1/3 — Main schema');
    await runSQL(path.join(dbDir, 'monetization_schema.sql'),  '2/3 — Monetization schema');
    await runSQL(path.join(dbDir, 'admin_setup.sql'),          '3/3 — Admin setup');

    console.log('\n🎉 Database fully initialised!\n');
    console.log('═══════════════════════════════════════');
    console.log('🔐  ADMIN LOGIN CREDENTIALS');
    console.log('───────────────────────────────────────');
    console.log('   URL:      /admin');
    console.log('   Email:    admin@train-app.com');
    console.log('   Password: TrainAdmin2024!');
    console.log('───────────────────────────────────────');
    console.log('⚠️   CHANGE THE PASSWORD AFTER FIRST LOGIN!');
    console.log('═══════════════════════════════════════\n');
    console.log('📊  6 Revenue strategies loaded (Strategy 1 active)');
    console.log('📋  Toggle others in the Admin Dashboard as you grow');
    console.log('\n🚀  Run `npm start` to launch the server!\n');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setup();
