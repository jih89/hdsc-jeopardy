import crypto from 'crypto';
import { getDbClient } from '../../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { passcode } = req.body;

    if (!passcode) {
      return res.status(400).json({ error: 'Passcode is required' });
    }

    // Get stored passcode hash from environment
    const storedPasscodeHash = process.env.ADMIN_PASSCODE_HASH;
    
    if (!storedPasscodeHash) {
      // If no hash is set, use a default (for initial setup)
      // In production, you should set ADMIN_PASSCODE_HASH in Vercel
      console.warn('ADMIN_PASSCODE_HASH not set, using default');
      return res.status(500).json({ error: 'Admin passcode not configured' });
    }

    // Hash the provided passcode and compare
    const providedHash = crypto
      .createHash('sha256')
      .update(passcode)
      .digest('hex');

    if (providedHash !== storedPasscodeHash) {
      return res.status(401).json({ error: 'Invalid passcode' });
    }

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

    // Store session in database
    const db = getDbClient();
    await db.execute(
      'INSERT INTO admin_sessions (session_token, expires_at) VALUES (?, ?)',
      [sessionToken, expiresAt.toISOString()]
    );

    return res.status(200).json({
      success: true,
      sessionToken,
      expiresAt: expiresAt.toISOString()
    });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

