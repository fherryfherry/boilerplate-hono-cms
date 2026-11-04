const { Hono } = require('hono');
const db = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { SettingsPage } = require('../views/settings/index');

const settingsRoutes = new Hono();

settingsRoutes.use('*', requireAuth);

async function getSettingsMap() {
  const rows = await db.all('SELECT setting_key, setting_value FROM settings');
  const map = {};
  for (const row of rows) {
    map[row.setting_key] = row.setting_value;
  }
  return map;
}

settingsRoutes.get('/', async (c) => {
  const settings = await getSettingsMap();
  const saved = c.req.query('saved') === '1';
  return c.html(SettingsPage({ c, settings, saved }));
});

settingsRoutes.post('/', async (c) => {
  const body = await c.req.parseBody();
  const keys = ['site_name', 'site_description', 'support_email'];

  for (const key of keys) {
    const val = String(body[key] || '').trim();
    const existing = await db.get('SELECT id FROM settings WHERE setting_key = ?', [key]);
    if (existing) {
      await db.run('UPDATE settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?', [
        val,
        key,
      ]);
    } else {
      await db.run('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)', [key, val]);
    }
  }

  return c.redirect(c.get('url')('/admin/settings?saved=1'));
});

module.exports = { settingsRoutes };
