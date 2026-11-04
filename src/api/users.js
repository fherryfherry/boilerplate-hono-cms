const { Hono } = require('hono');
const db = require('../db/client');
const { hashPassword } = require('../db/seed');
const { requireRole } = require('../middleware/auth');
const { ok, fail, readJson } = require('../lib/http');
const { logActivity } = require('../lib/activity');
const { findPublicUser, PUBLIC_USER_FIELDS, EMAIL_RE } = require('./auth');

const users = new Hono();

const ROLES = ['admin', 'staff', 'user'];
const STATUSES = ['active', 'inactive'];

users.use('*', requireRole('admin'));

async function queryUsers({ search = '', role = '' } = {}) {
  const clauses = [];
  const params = [];

  if (search) {
    clauses.push('(LOWER(name) LIKE ? OR LOWER(email) LIKE ?)');
    const like = `%${search.toLowerCase()}%`;
    params.push(like, like);
  }
  if (role) {
    clauses.push('role = ?');
    params.push(role);
  }

  const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  return db.all(`SELECT ${PUBLIC_USER_FIELDS} FROM users ${whereSql} ORDER BY id DESC`, params);
}

function validateUser(body, { requirePassword }) {
  const input = {
    name: String(body.name || '').trim(),
    email: String(body.email || '').trim().toLowerCase(),
    role: String(body.role || 'user'),
    status: String(body.status || 'active'),
    password: String(body.password || ''),
  };

  const errors = {};
  if (!input.name) errors.name = 'Nama wajib diisi.';
  if (!EMAIL_RE.test(input.email)) errors.email = 'Format email tidak valid.';
  if (!ROLES.includes(input.role)) errors.role = `Role harus salah satu dari: ${ROLES.join(', ')}.`;
  if (!STATUSES.includes(input.status)) errors.status = `Status harus salah satu dari: ${STATUSES.join(', ')}.`;
  if (requirePassword && input.password.length < 6) errors.password = 'Password minimal 6 karakter.';
  if (!requirePassword && input.password && input.password.length < 6) {
    errors.password = 'Password minimal 6 karakter.';
  }

  return Object.keys(errors).length > 0 ? { errors } : { input };
}

async function emailTaken(email, exceptId = null) {
  const row = await db.get('SELECT id FROM users WHERE LOWER(email) = ?', [email]);
  return Boolean(row) && String(row.id) !== String(exceptId);
}

users.get('/', async (c) => {
  const search = String(c.req.query('search') || '').trim();
  const role = String(c.req.query('role') || '').trim();
  return ok(c, await queryUsers({ search, role }));
});

users.get('/:id', async (c) => {
  const user = await findPublicUser(c.req.param('id'));
  if (!user) return fail(c, 404, 'Pengguna tidak ditemukan.', 'NOT_FOUND');
  return ok(c, user);
});

users.post('/', async (c) => {
  const { input, errors } = validateUser(await readJson(c), { requirePassword: true });
  if (errors) return fail(c, 422, 'Data pengguna tidak valid.', 'VALIDATION', errors);
  if (await emailTaken(input.email)) {
    return fail(c, 409, 'Email sudah terdaftar.', 'EMAIL_TAKEN', { email: 'Email sudah terdaftar.' });
  }

  const res = await db.run(
    'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
    [input.name, input.email, hashPassword(input.password), input.role, input.status]
  );
  await logActivity(c.get('user').id, 'User Created', `Menambahkan pengguna ${input.name} (${input.email})`);
  return ok(c, await findPublicUser(res.lastInsertRowid), 201);
});

users.put('/:id', async (c) => {
  const id = c.req.param('id');
  const existing = await findPublicUser(id);
  if (!existing) return fail(c, 404, 'Pengguna tidak ditemukan.', 'NOT_FOUND');

  const { input, errors } = validateUser(await readJson(c), { requirePassword: false });
  if (errors) return fail(c, 422, 'Data pengguna tidak valid.', 'VALIDATION', errors);
  if (await emailTaken(input.email, id)) {
    return fail(c, 409, 'Email sudah terdaftar.', 'EMAIL_TAKEN', { email: 'Email sudah terdaftar.' });
  }

  if (input.password) {
    await db.run(
      'UPDATE users SET name = ?, email = ?, role = ?, status = ?, password_hash = ? WHERE id = ?',
      [input.name, input.email, input.role, input.status, hashPassword(input.password), id]
    );
  } else {
    await db.run('UPDATE users SET name = ?, email = ?, role = ?, status = ? WHERE id = ?', [
      input.name,
      input.email,
      input.role,
      input.status,
      id,
    ]);
  }

  await logActivity(c.get('user').id, 'User Updated', `Memperbarui pengguna ${input.name} (${input.email})`);
  return ok(c, await findPublicUser(id));
});

users.delete('/:id', async (c) => {
  const id = c.req.param('id');
  if (String(c.get('user').id) === String(id)) {
    return fail(c, 400, 'Anda tidak dapat menghapus akun sendiri.', 'CANNOT_DELETE_SELF');
  }

  const target = await findPublicUser(id);
  if (!target) return fail(c, 404, 'Pengguna tidak ditemukan.', 'NOT_FOUND');

  await db.run('DELETE FROM users WHERE id = ?', [id]);
  await logActivity(c.get('user').id, 'User Deleted', `Menghapus pengguna ${target.name} (${target.email})`);
  return ok(c, { id: target.id });
});

module.exports = { users };
