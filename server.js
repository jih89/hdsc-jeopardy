import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import questionsHandler from './api/questions.js';
import loginHandler from './api/auth/login.js';
import verifyHandler from './api/auth/verify.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// API Routes with error handling
app.all('/api/questions', async (req, res) => {
  try {
    await questionsHandler(req, res);
  } catch (error) {
    console.error('Error in /api/questions:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

app.all('/api/auth/login', async (req, res) => {
  try {
    await loginHandler(req, res);
  } catch (error) {
    console.error('Error in /api/auth/login:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

app.all('/api/auth/verify', async (req, res) => {
  try {
    await verifyHandler(req, res);
  } catch (error) {
    console.error('Error in /api/auth/verify:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Serve admin page
app.get('/admin', (req, res) => {
  res.sendFile(join(__dirname, 'admin', 'index.html'));
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
  console.log(`📝 Admin panel: http://localhost:${PORT}/admin`);
  console.log(`🎮 Game: http://localhost:${PORT}\n`);
});

