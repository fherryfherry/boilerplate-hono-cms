const fs = require('fs');
const path = require('path');
const db = require('./client');

async function runMigrations() {
  await db.execRaw(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const migrationsDir = path.resolve(__dirname, 'migrations');
  if (!fs.existsSync(migrationsDir)) return;

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const existing = await db.get('SELECT id FROM _migrations WHERE filename = ?', [file]);
    if (existing) continue;

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    await db.execRaw(sql);
    await db.run('INSERT INTO _migrations (filename) VALUES (?)', [file]);
    console.log(`Migrated: ${file}`);
  }
}

if (require.main === module) {
  runMigrations()
    .then(async () => {
      console.log('Migrations complete.');
      await db.close();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('Migration failed:', err);
      await db.close();
      process.exit(1);
    });
}

module.exports = { runMigrations };
