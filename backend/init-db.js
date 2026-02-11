const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function initializeDatabase() {
  try {
    console.log('🔄 Connecting to database...');
    
    // Read schema file
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📝 Executing schema...');
    
    // Execute schema
    await pool.query(schema);
    
    console.log('✅ Database initialized successfully!');
    console.log('\n📊 Sample data has been inserted:');
    console.log('   - 2 sample users (trainers)');
    console.log('   - 1 sample client (ACME Corporation)');
    console.log('   - 3 sample tasks');
    console.log('\n🔑 Test Credentials:');
    console.log('   User: john.doe@example.com / password123');
    console.log('   Client: acme.corp@example.com / password123');
    console.log('\n⚠️  NOTE: These are sample passwords. Change them in production!');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initializeDatabase();
