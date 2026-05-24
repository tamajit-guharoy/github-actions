const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  user: process.env.PGUSER || 'testuser',
  password: process.env.PGPASSWORD || 'testpass',
  database: process.env.PGDATABASE || 'testdb',
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

async function addMessage(content) {
  const result = await pool.query(
    'INSERT INTO messages (content) VALUES ($1) RETURNING id, content, created_at',
    [content]
  );
  return result.rows[0];
}

async function getMessages() {
  const result = await pool.query('SELECT id, content, created_at FROM messages ORDER BY created_at DESC');
  return result.rows;
}

async function close() {
  await pool.end();
}

module.exports = { initDb, addMessage, getMessages, close, pool };
