const crypto = require('crypto');
const db = require('./client');
const { runMigrations } = require('./migrate');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, key] = storedHash.split(':');
  const derived = crypto.scryptSync(String(password), salt, 64);
  const keyBuf = Buffer.from(key, 'hex');
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

async function runSeed() {
  await runMigrations();

  const existingAdmin = await db.get('SELECT id FROM users WHERE email = ?', ['admin@example.com']);
  if (!existingAdmin) {
    await db.run(
      'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
      ['Administrator', 'admin@example.com', hashPassword('password'), 'admin', 'active']
    );
    await db.run(
      'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
      ['Budi Santoso', 'budi@example.com', hashPassword('password'), 'staff', 'active']
    );
    await db.run(
      'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
      ['Siti Aminah', 'siti@example.com', hashPassword('password'), 'user', 'active']
    );
    await db.run(
      'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
      ['Andi Pratama', 'andi@example.com', hashPassword('password'), 'user', 'inactive']
    );
  }

  const defaultSettings = [
    ['site_name', 'TanpaNgoding Workspace'],
    ['site_description', 'Sistem manajemen modern berbasis Hono, HTMX, dan Shadcn UI'],
    ['support_email', 'admin@example.com'],
    ['maintenance_mode', 'false'],
  ];

  for (const [k, v] of defaultSettings) {
    const row = await db.get('SELECT id FROM settings WHERE setting_key = ?', [k]);
    if (!row) {
      await db.run('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)', [k, v]);
    }
  }

  const logCount = await db.get('SELECT COUNT(*) as total FROM activity_logs');
  if (!logCount || Number(logCount.total) === 0) {
    await db.run('INSERT INTO activity_logs (user_id, action, detail) VALUES (?, ?, ?)', [
      1,
      'System Initialized',
      'Boilerplate database migrated and seeded with default records',
    ]);
    await db.run('INSERT INTO activity_logs (user_id, action, detail) VALUES (?, ?, ?)', [
      1,
      'User Created',
      'Added initial team members (Budi Santoso, Siti Aminah)',
    ]);
  }
}

if (require.main === module) {
  runSeed()
    .then(async () => {
      console.log('Database seeded successfully.');
      await db.close();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('Seed failed:', err);
      await db.close();
      process.exit(1);
    });
}

module.exports = { runSeed, hashPassword, verifyPassword };
