const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// PostgreSQL connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'visitordb',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'yourpassword',
});

// Initialize database table
// We also add the 'note' column here if it doesn't exist yet (Feature: Visit Notes)
async function initDB() {
  try {
    // Create the visitors table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS visitors (
        id SERIAL PRIMARY KEY,
        visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(50)
      );
    `);

    // Feature: Visit Notes/Labels
    // Add 'note' column to existing table (safe to run even if column already exists)
    await pool.query(`
      ALTER TABLE visitors ADD COLUMN IF NOT EXISTS note VARCHAR(100);
    `);

    console.log('✅ Database initialized successfully');
  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
    console.log('⚠️  Running without database - using in-memory counter');
  }
}

// In-memory fallback counter
let memoryCounter = 0;

// GET - Get total visitor count
app.get('/api/count', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM visitors');
    res.json({
      count: parseInt(result.rows[0].count),
      source: 'database'
    });
  } catch (err) {
    // Fallback to memory counter
    res.json({
      count: memoryCounter,
      source: 'memory'
    });
  }
});

// POST - Record a new visit
// Feature: Visit Notes/Labels — now accepts an optional 'note' in the request body
app.post('/api/visit', async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  // Read the optional note sent from the frontend (defaults to null if not provided)
  const note = req.body.note || null;

  try {
    // Insert both ip_address and note into the database
    await pool.query(
      'INSERT INTO visitors (ip_address, note) VALUES ($1, $2)',
      [ip, note]
    );
    const result = await pool.query('SELECT COUNT(*) FROM visitors');
    const count = parseInt(result.rows[0].count);
    res.json({ count, source: 'database' });
  } catch (err) {
    // Fallback to memory counter
    memoryCounter++;
    res.json({ count: memoryCounter, source: 'memory' });
  }
});

// GET - Get recent visits (last 10)
// Feature: Visit Notes/Labels — now returns the 'note' column too
app.get('/api/recent', async (req, res) => {
  try {
    // Select all columns including note
    const result = await pool.query(
      'SELECT id, visited_at, ip_address, note FROM visitors ORDER BY visited_at DESC LIMIT 10'
    );
    res.json({ visits: result.rows });
  } catch (err) {
    res.json({ visits: [] });
  }
});

// GET - Visits chart data (hourly buckets, last 24 hours)
// Feature: Visits Chart — new endpoint that groups visits by hour
app.get('/api/stats', async (req, res) => {
  try {
    // DATE_TRUNC('hour', visited_at) rounds each timestamp down to the hour
    // This groups all visits within the same hour together and counts them
    const result = await pool.query(`
      SELECT
        DATE_TRUNC('hour', visited_at) AS bucket,
        COUNT(*) AS count
      FROM visitors
      GROUP BY bucket
      ORDER BY bucket DESC
      LIMIT 24
    `);

    // Send the array of { bucket, count } objects to the frontend
    res.json({ stats: result.rows });
  } catch (err) {
    // If DB is unavailable, return empty stats
    res.json({ stats: [] });
  }
});

// DELETE - Reset counter
// Feature: Admin Auth — now requires a valid Bearer token in the Authorization header
app.delete('/api/reset', async (req, res) => {
  // Read ADMIN_KEY from your .env file
  const adminKey = process.env.ADMIN_KEY;

  // Check the Authorization header sent by the frontend
  // Expected format: "Bearer your-secret-key"
  if (req.headers['authorization'] !== `Bearer ${adminKey}`) {
    // If the key is wrong or missing, reject the request with 401 Unauthorized
    return res.status(401).json({ error: 'Unauthorized — wrong admin key' });
  }

  // If key is correct, proceed with the reset
  try {
    await pool.query('DELETE FROM visitors');
    memoryCounter = 0;
    res.json({ message: 'Counter reset!', count: 0 });
  } catch (err) {
    memoryCounter = 0;
    res.json({ message: 'Counter reset!', count: 0 });
  }
});

// Start server
app.listen(PORT, async () => {
  await initDB();
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
