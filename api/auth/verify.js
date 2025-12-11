import { getDbClient } from '../../lib/db.js';

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
    const db = getDbClient();

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

