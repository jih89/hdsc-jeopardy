import { getDbClient } from '../lib/db.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✓ Set' : '✗ Missing');
    console.log('TURSO_AUTH_TOKEN:', process.env.TURSO_AUTH_TOKEN ? '✓ Set' : '✗ Missing');
    console.log('ADMIN_PASSCODE_HASH:', process.env.ADMIN_PASSCODE_HASH ? '✓ Set' : '✗ Missing');
    
    const db = getDbClient();
    
    // Test query
    const result = await db.execute('SELECT COUNT(*) as count FROM categories');
    console.log('\n✓ Database connection successful!');
    console.log(`✓ Categories in database: ${result.rows[0].count}`);
    
    // Check if we can read questions
    const questionsResult = await db.execute('SELECT COUNT(*) as count FROM questions');
    console.log(`✓ Questions in database: ${questionsResult.rows[0].count}`);
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();

