const { Hono } = require('hono');
const db = require('../db/client');
const { hashPassword } = require('../db/seed');
const { requireAuth } = require('../middleware/auth');
const { UsersPage, UsersTablePartial, UserFormModal } = require('../views/users/index');

const usersRoutes = new Hono();

usersRoutes.use('*', requireAuth);

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
  return db.all(`SELECT id, name, email, role, status, created_at FROM users ${whereSql} ORDER BY id DESC`, params);
}

usersRoutes.get('/', async (c) => {
  const search = String(c.req.query('search') || '').trim();
  const role = String(c.req.query('role') || '').trim();
  const users = await queryUsers({ search, role });

  if (c.req.header('HX-Request')) {
    return c.html(UsersTablePartial({ c, users, search, role }));
  }
  return c.html(UsersPage({ c, users, search, role }));
});

usersRoutes.get('/new', (c) => {
  return c.html(UserFormModal({ c, user: null }));
});

usersRoutes.get('/:id/edit', async (c) => {
  const user = await db.get('SELECT id, name, email, role, status FROM users WHERE id = ?', [c.req.param('id')]);
  if (!user) return c.text('User not found', 404);
  return c.html(UserFormModal({ c, user }));
});

usersRoutes.post('/', async (c) => {
  const body = await c.req.parseBody();
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const role = String(body.role || 'user');
  const status = String(body.status || 'active');
  const password = String(body.password || 'password');

  await db.run(
    'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
    [name, email, hashPassword(password), role, status]
  );

  await db.run('INSERT INTO activity_logs (user_id, action, detail) VALUES (?, ?, ?)', [
    c.get('user')?.id || null,
    'User Created',
    `Menambahkan pengguna ${name} (${email})`,
  ]);

  c.header(
    'HX-Trigger',
    JSON.stringify({
      closeModal: true,
      toast: { title: 'Pengguna Ditambahkan', description: `${name} berhasil disimpan.`, variant: 'success' },
    })
  );

  const users = await queryUsers();
  return c.html(UsersTablePartial({ c, users }));
});

usersRoutes.post('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.parseBody();
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const role = String(body.role || 'user');
  const status = String(body.status || 'active');
  const password = String(body.password || '');

  if (password) {
    await db.run(
      'UPDATE users SET name = ?, email = ?, role = ?, status = ?, password_hash = ? WHERE id = ?',
      [name, email, role, status, hashPassword(password), id]
    );
  } else {
    await db.run('UPDATE users SET name = ?, email = ?, role = ?, status = ? WHERE id = ?', [
      name,
      email,
      role,
      status,
      id,
    ]);
  }

  c.header(
    'HX-Trigger',
    JSON.stringify({
      closeModal: true,
      toast: { title: 'Perubahan Disimpan', description: `Data ${name} diperbarui.`, variant: 'success' },
    })
  );

  const users = await queryUsers();
  return c.html(UsersTablePartial({ c, users }));
});

usersRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const target = await db.get('SELECT name, email FROM users WHERE id = ?', [id]);
  await db.run('DELETE FROM users WHERE id = ?', [id]);

  if (target) {
    await db.run('INSERT INTO activity_logs (user_id, action, detail) VALUES (?, ?, ?)', [
      c.get('user')?.id || null,
      'User Deleted',
      `Menghapus pengguna ${target.name} (${target.email})`,
    ]);
  }

  c.header(
    'HX-Trigger',
    JSON.stringify({
      toast: { title: 'Pengguna Dihapus', description: `${target?.name || 'User'} telah dihapus.`, variant: 'default' },
    })
  );

  const users = await queryUsers();
  return c.html(UsersTablePartial({ c, users }));
});

module.exports = { usersRoutes };
