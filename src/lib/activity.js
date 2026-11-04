const db = require('../db/client');

async function logActivity(userId, action, detail) {
  await db.run('INSERT INTO activity_logs (user_id, action, detail) VALUES (?, ?, ?)', [
    userId || null,
    action,
    detail,
  ]);
}

module.exports = { logActivity };
