const { Hono } = require('hono');
const db = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { DashboardPage } = require('../views/dashboard/index');

const dashboardRoutes = new Hono();

dashboardRoutes.use('*', requireAuth);

dashboardRoutes.get('/', async (c) => {
  const totalRow = await db.get('SELECT COUNT(*) as total FROM users');
  const activeRow = await db.get("SELECT COUNT(*) as total FROM users WHERE status = 'active'");
  const adminRow = await db.get("SELECT COUNT(*) as total FROM users WHERE role = 'admin'");

  const recentUsers = await db.all('SELECT id, name, email, role, status, created_at FROM users ORDER BY id DESC LIMIT 5');
  const recentLogs = await db.all('SELECT * FROM activity_logs ORDER BY id DESC LIMIT 6');

  return c.html(
    DashboardPage({
      c,
      stats: {
        totalUsers: Number(totalRow?.total || 0),
        activeUsers: Number(activeRow?.total || 0),
        adminCount: Number(adminRow?.total || 0),
      },
      recentUsers,
      recentLogs,
    })
  );
});

module.exports = { dashboardRoutes };
