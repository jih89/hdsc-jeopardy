import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Lazy load db module
let getDbClient;
async function loadDb() {
  if (!getDbClient) {
    // From /api/auth/verify.js, go up 2 levels to root, then into lib
    const dbModulePath = resolve(__dirname, '..', '..', 'lib', 'db.js');
    const dbUrl = `file://${dbModulePath}`;
    const dbModule = await import(dbUrl);
    getDbClient = dbModule.getDbClient;
  }
  return getDbClient;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const dbClient = await loadDb();
    const db = dbClient();

    const result = await db.execute(
      'SELECT * FROM admin_sessions WHERE session_token = ? AND expires_at > datetime("now")',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    return res.status(200).json({ valid: true });
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

