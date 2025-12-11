import { createClient } from '@libsql/client';

let client = null;

export function getDbClient() {
  if (!client) {
    const url = process.env.DATABASE_URL;
    
    if (!url) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // For Turso, we need the URL and auth token
    // The URL format is: libsql://database-name.region.turso.io
    // We'll also need TURSO_AUTH_TOKEN for authentication
    const authToken = process.env.TURSO_AUTH_TOKEN;
    
    if (authToken) {
      client = createClient({
        url,
        authToken,
      });
    } else {
      // For local development or if auth token is not needed
      client = createClient({
        url,
      });
    }
  }
  
  return client;
}

export async function initDatabase() {
  const db = getDbClient();
  
  // Create categories table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      display_order INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create questions table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      point_value INTEGER NOT NULL,
      question_index INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      answer_text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id),
      UNIQUE(category_id, point_value, question_index)
    )
  `);
  
  // Create admin_sessions table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Seed initial categories if they don't exist
  const categoriesResult = await db.execute('SELECT COUNT(*) as count FROM categories');
  if (categoriesResult.rows[0].count === 0) {
    await db.execute(`
      INSERT INTO categories (name, display_order) VALUES
      ('Matematika Dasar', 0),
      ('Biologi', 1),
      ('Kedokteran Gigi Dasar', 2)
    `);
  }
  
  return db;
}

