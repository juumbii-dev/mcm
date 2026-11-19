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

  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');
    const files = (await fs.readdir(migrationsDir))
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const existing = await client.query(
        'SELECT name FROM schema_migrations WHERE name = $1',
        [file]
      );

      if (existing.rowCount > 0) {
        console.log(`Skipping already applied migration: ${file}`);
        continue;
      }

      const migration = await fs.readFile(
        path.join(migrationsDir, file),
        'utf8'
      );

      try {
        await client.query('BEGIN');
        await client.query(migration);
        await client.query(
          'INSERT INTO schema_migrations (name) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');

        console.log(`Migration applied: ${file}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`${file} failed: ${error.message}`);
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((error) => {
  console.error('Database migration failed:', error.message);
  process.exitCode = 1;
});