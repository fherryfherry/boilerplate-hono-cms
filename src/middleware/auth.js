const crypto = require('crypto');
const { getEnv } = require('../config/env');
const { fail } = require('../lib/http');
const db = require('../db/client');

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7;

function signToken(payload, secret) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifyToken(token, secret) {
  if (!token || !token.includes('.')) return null;
  const [data, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch (_) {
    return null;
  }
}

function issueToken(user) {
  const { appKey } = getEnv();
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const token = signToken({ id: user.id, email: user.email, role: user.role, exp: expiresAt }, appKey);
  return { token, expiresAt: new Date(expiresAt).toISOString() };
}

function readBearerToken(c) {
  const header = c.req.header('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

async function loadUserMiddleware(c, next) {
  const { appKey } = getEnv();
  const payload = verifyToken(readBearerToken(c), appKey);
  if (payload?.id) {
    try {
      const user = await db.get(
        'SELECT id, name, email, role, status, created_at FROM users WHERE id = ?',
        [payload.id]
      );
      if (user && user.status === 'active') {
        c.set('user', user);
      }
    } catch (_) {
      // Ignore DB lookup errors if tables are not migrated yet
    }
  }
  await next();
}

async function requireAuth(c, next) {
  if (!c.get('user')) {
    return fail(c, 401, 'Silakan login terlebih dahulu.', 'UNAUTHENTICATED');
  }
  await next();
}

function requireRole(...roles) {
  return async (c, next) => {
    const user = c.get('user');
    if (!user) return fail(c, 401, 'Silakan login terlebih dahulu.', 'UNAUTHENTICATED');
    if (!roles.includes(user.role)) {
      return fail(c, 403, 'Anda tidak memiliki akses untuk aksi ini.', 'FORBIDDEN');
    }
    await next();
  };
}

module.exports = {
  signToken,
  verifyToken,
  issueToken,
  loadUserMiddleware,
  requireAuth,
  requireRole,
};
