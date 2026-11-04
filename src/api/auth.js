const { Hono } = require('hono');
const db = require('../db/client');
const { hashPassword, verifyPassword } = require('../db/seed');
const { issueToken, requireAuth } = require('../middleware/auth');
const { ok, fail, readJson } = require('../lib/http');
const { logActivity } = require('../lib/activity');

const auth = new Hono();

const PUBLIC_USER_FIELDS = 'id, name, email, role, status, created_at';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function findPublicUser(id) {
  return db.get(`SELECT ${PUBLIC_USER_FIELDS} FROM users WHERE id = ?`, [id]);
}

auth.post('/login', async (c) => {
  const body = await readJson(c);
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  const user = await db.get('SELECT * FROM users WHERE LOWER(email) = ?', [email]);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return fail(c, 401, 'Email atau password tidak sesuai.', 'INVALID_CREDENTIALS');
  }
  if (user.status !== 'active') {
    return fail(c, 403, 'Akun Anda sedang dinonaktifkan.', 'ACCOUNT_INACTIVE');
  }

  await logActivity(user.id, 'User Login', `${user.email} masuk ke dalam sistem`);
  return ok(c, { ...issueToken(user), user: await findPublicUser(user.id) });
});

auth.post('/register', async (c) => {
  const body = await readJson(c);
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  const fields = {};
  if (!name) fields.name = 'Nama wajib diisi.';
  if (!EMAIL_RE.test(email)) fields.email = 'Format email tidak valid.';
  if (password.length < 6) fields.password = 'Password minimal 6 karakter.';
  if (Object.keys(fields).length > 0) {
    return fail(c, 422, 'Lengkapi nama, email, dan password minimal 6 karakter.', 'VALIDATION', fields);
  }

  const existing = await db.get('SELECT id FROM users WHERE LOWER(email) = ?', [email]);
  if (existing) {
    return fail(c, 409, 'Email sudah terdaftar.', 'EMAIL_TAKEN', { email: 'Email sudah terdaftar.' });
  }

  const res = await db.run(
    'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
    [name, email, hashPassword(password), 'user', 'active']
  );
  const user = await findPublicUser(res.lastInsertRowid);
  await logActivity(user.id, 'User Registered', `${user.email} mendaftar akun baru`);
  return ok(c, { ...issueToken(user), user }, 201);
});

auth.get('/me', requireAuth, (c) => ok(c, { user: c.get('user') }));

// Tokens are stateless: logging out only records the event; the client discards its token.
auth.post('/logout', requireAuth, async (c) => {
  const user = c.get('user');
  await logActivity(user.id, 'User Logout', `${user.email} keluar dari sistem`);
  return c.body(null, 204);
});

module.exports = { auth, findPublicUser, PUBLIC_USER_FIELDS, EMAIL_RE };
