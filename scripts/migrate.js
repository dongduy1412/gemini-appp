require('dotenv').config({ path: '.env.production' })
const { createClient } = require('@vercel/postgres');

async function migrate() {
  const client = createClient();
  await client.connect();
  
  try {
    await client.sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        google_id TEXT UNIQUE NOT NULL,
        email TEXT NOT NULL,
        name TEXT,
        image TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await client.sql`
      CREATE TABLE IF NOT EXISTS generations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        transform_type TEXT NOT NULL,
        input_images TEXT NOT NULL,
        output_image TEXT NOT NULL,
        prompt_used TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await client.sql`
      CREATE TABLE IF NOT EXISTS rate_limits (
        user_id TEXT PRIMARY KEY,
        count INTEGER DEFAULT 0,
        reset_at TIMESTAMP NOT NULL
      );
    `;
    
    console.log('✅ Migration completed');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.end();
  }
}

migrate();