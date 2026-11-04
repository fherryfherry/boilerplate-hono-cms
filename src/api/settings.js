const { Hono } = require('hono');
const db = require('../db/client');
const { getEnv } = require('../config/env');
const { requireAuth, requireRole } = require('../middleware/auth');
const { ok, fail, readJson } = require('../lib/http');
const { logActivity } = require('../lib/activity');

const EDITABLE_KEYS = ['site_name', 'site_description', 'support_email'];

async function getSettingsMap() {
  const rows = await db.all('SELECT setting_key, setting_value FROM settings');
  const map = {};
  for (const row of rows) {
    map[row.setting_key] = row.setting_value;
  }
  return map;
}

// Public site info for the landing page (no auth).
const site = new Hono();

site.get('/', async (c) => {
  const { appName } = getEnv();
  let settings = {};
  try {
    settings = await getSettingsMap();
  } catch (_) {
    // Fallback if database is not yet initialized
  }
  return ok(c, {
    appName,
    siteName: settings.site_name || appName,
    siteDescription: settings.site_description || '',
  });
});

const settings = new Hono();

settings.get('/', requireAuth, async (c) => ok(c, await getSettingsMap()));

settings.put('/', requireRole('admin'), async (c) => {
  const body = await readJson(c);
  const values = {};
  for (const key of EDITABLE_KEYS) {
    values[key] = String(body[key] ?? '').trim();
  }
  if (!values.site_name) {
    return fail(c, 422, 'Nama aplikasi wajib diisi.', 'VALIDATION', { site_name: 'Nama aplikasi wajib diisi.' });
  }

  for (const [key, val] of Object.entries(values)) {
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

  await logActivity(c.get('user').id, 'Settings Updated', 'Memperbarui pengaturan sistem');
  return ok(c, await getSettingsMap());
});

module.exports = { site, settings };
