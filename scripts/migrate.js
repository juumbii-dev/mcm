const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');

async function migrate() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to run migrations');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const migration = await fs.readFile(
      path.join(__dirname, '..', 'db', 'migrations', '001_initial.sql'),
      'utf8'
    );
    await pool.query(migration);
    console.log('Database migration 001_initial applied.');
  } finally {
    await pool.end();
  }
}

migrate().catch((error) => {
  console.error('Database migration failed:', error.message);
  process.exitCode = 1;
});