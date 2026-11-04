const { Hono } = require('hono');
const db = require('../db/client');
const { hashPassword, verifyPassword } = require('../db/seed');
const { setSessionUser, clearSessionUser } = require('../middleware/auth');
const { LoginPage } = require('../views/auth/login');

const authRoutes = new Hono();

authRoutes.get('/login', (c) => {
  if (c.get('user')) return c.redirect(c.get('url')('/admin'));
  return c.html(LoginPage({ c, mode: 'login' }));
});

authRoutes.post('/login', async (c) => {
  const body = await c.req.parseBody();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  const user = await db.get('SELECT * FROM users WHERE LOWER(email) = ?', [email]);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return c.html(LoginPage({ c, mode: 'login', error: 'Email atau password tidak sesuai.' }), 401);
  }
  if (user.status !== 'active') {
    return c.html(LoginPage({ c, mode: 'login', error: 'Akun Anda sedang dinonaktifkan.' }), 403);
  }

  setSessionUser(c, user);
  await db.run('INSERT INTO activity_logs (user_id, action, detail) VALUES (?, ?, ?)', [
    user.id,
    'User Login',
    `${user.email} masuk ke dalam sistem`,
  ]);
  return c.redirect(c.get('url')('/admin'));
});

authRoutes.get('/register', (c) => {
  if (c.get('user')) return c.redirect(c.get('url')('/admin'));
  return c.html(LoginPage({ c, mode: 'register' }));
});

authRoutes.post('/register', async (c) => {
  const body = await c.req.parseBody();
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!name || !email || password.length < 6) {
    return c.html(
      LoginPage({ c, mode: 'register', error: 'Lengkapi nama, email, dan password minimal 6 karakter.' }),
      400
    );
  }

  const existing = await db.get('SELECT id FROM users WHERE LOWER(email) = ?', [email]);
  if (existing) {
    return c.html(LoginPage({ c, mode: 'register', error: 'Email sudah terdaftar.' }), 409);
  }

  const res = await db.run(
    'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
    [name, email, hashPassword(password), 'user', 'active']
  );

  const user = await db.get('SELECT * FROM users WHERE id = ?', [res.lastInsertRowid]);
  if (user) setSessionUser(c, user);
  return c.redirect(c.get('url')('/admin'));
});

authRoutes.post('/logout', (c) => {
  clearSessionUser(c);
  return c.redirect(c.get('url')('/login'));
});

module.exports = { authRoutes };
