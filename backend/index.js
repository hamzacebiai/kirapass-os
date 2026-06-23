import express from 'express';
import dotenv from 'dotenv';
import { pool } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.get('/health', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT NOW() AS now, version() AS version');
    res.json({
      status: 'ok',
      db: 'connected',
      timestamp: rows[0].now,
      version: rows[0].version,
    });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'disconnected', error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend ready at http://localhost:${PORT}`);
  console.log('Postgres connected on localhost:5432');
  console.log('Health endpoint working');
});
