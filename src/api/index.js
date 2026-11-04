const { Hono } = require('hono');
const { cors } = require('hono/cors');
const { getEnv } = require('../config/env');
const { loadUserMiddleware } = require('../middleware/auth');
const { HttpError, ok, fail } = require('../lib/http');
const { auth } = require('./auth');
const { dashboard } = require('./dashboard');
const { users } = require('./users');
const { site, settings } = require('./settings');

const api = new Hono();

const { corsOrigins } = getEnv();
api.use(
  '*',
  cors({
    origin: corsOrigins.includes('*') ? '*' : corsOrigins,
    allowHeaders: ['Authorization', 'Content-Type'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    maxAge: 600,
  })
);
api.use('*', loadUserMiddleware);

api.get('/health', (c) => ok(c, { ok: true }));
api.route('/site', site);
api.route('/auth', auth);
api.route('/dashboard', dashboard);
api.route('/users', users);
api.route('/settings', settings);

api.all('*', (c) => fail(c, 404, 'Endpoint tidak ditemukan.', 'NOT_FOUND'));

api.onError((err, c) => {
  if (err instanceof HttpError) {
    return fail(c, err.status, err.message, err.code, err.fields);
  }
  console.error(err);
  return fail(c, 500, 'Terjadi kesalahan pada server.', 'INTERNAL_ERROR');
});

module.exports = { api };
