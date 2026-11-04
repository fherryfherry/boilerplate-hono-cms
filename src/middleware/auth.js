const crypto = require('crypto');
const { getCookie, setCookie, deleteCookie } = require('hono/cookie');
const { getEnv } = require('../config/env');
const db = require('../db/client');

const SESSION_COOKIE = 'tnpg_session';

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

function setSessionUser(c, user) {
  const { appKey } = getEnv();
  const token = signToken(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
    },
    appKey
  );
  setCookie(c, SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    maxAge: 60 * 60 * 24 * 7,
  });
}

function clearSessionUser(c) {
  deleteCookie(c, SESSION_COOKIE, { path: '/' });
}

async function loadSessionMiddleware(c, next) {
  const { appKey } = getEnv();
  const token = getCookie(c, SESSION_COOKIE);
  const payload = verifyToken(token, appKey);
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
  const user = c.get('user');
  const url = c.get('url');
  if (!user) {
    if (c.req.header('HX-Request')) {
      c.header('HX-Redirect', url('/login'));
      return c.text('', 401);
    }
    return c.redirect(url('/login'));
  }
  await next();
}

function requireRole(...roles) {
  return async (c, next) => {
    const user = c.get('user');
    if (!user || !roles.includes(user.role)) {
      return c.text('Forbidden: insufficient role permissions', 403);
    }
    await next();
  };
}

module.exports = {
  loadSessionMiddleware,
  requireAuth,
  requireRole,
  setSessionUser,
  clearSessionUser,
};
