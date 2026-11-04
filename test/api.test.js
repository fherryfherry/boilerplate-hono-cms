const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hono-api-test-'));
process.env.DB_CONNECTION = 'sqlite';
process.env.DB_DATABASE = path.join(tmpDir, 'test.sqlite');
process.env.APP_KEY = 'test-secret';
process.env.APP_NAME = 'Test App';

const { app } = require('../src/index');
const { runSeed } = require('../src/db/seed');
const db = require('../src/db/client');

async function call(method, url, { token, body, headers = {} } = {}) {
  const init = { method, headers: { ...headers } };
  if (token) init.headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  const res = await app.request(url, init);
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (_) {
    json = null;
  }
  return { status: res.status, json, text, headers: res.headers };
}

async function login(email, password = 'password') {
  const res = await call('POST', '/api/auth/login', { body: { email, password } });
  assert.equal(res.status, 200, res.text);
  return res.json.data.token;
}

before(async () => {
  await runSeed();
});

after(async () => {
  await db.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('health and public site info', async () => {
  assert.deepEqual((await call('GET', '/api/health')).json, { data: { ok: true } });
  const site = await call('GET', '/api/site');
  assert.equal(site.status, 200);
  assert.equal(site.json.data.siteName, 'TanpaNgoding Workspace');
});

test('login rejects bad credentials and returns a usable bearer token', async () => {
  const bad = await call('POST', '/api/auth/login', { body: { email: 'admin@example.com', password: 'nope' } });
  assert.equal(bad.status, 401);
  assert.equal(bad.json.error.code, 'INVALID_CREDENTIALS');

  const inactive = await call('POST', '/api/auth/login', { body: { email: 'andi@example.com', password: 'password' } });
  assert.equal(inactive.status, 403);

  const token = await login('admin@example.com');
  const me = await call('GET', '/api/auth/me', { token });
  assert.equal(me.status, 200);
  assert.equal(me.json.data.user.email, 'admin@example.com');
  assert.equal(me.json.data.user.password_hash, undefined);

  assert.equal((await call('GET', '/api/auth/me')).status, 401);
  assert.equal((await call('GET', '/api/auth/me', { token: `${token}x` })).status, 401);
});

test('malformed JSON body returns 400 JSON error', async () => {
  const res = await call('POST', '/api/auth/login', { body: '{oops' });
  assert.equal(res.status, 400);
  assert.equal(res.json.error.code, 'INVALID_JSON');
});

test('register validates input, rejects duplicates, and returns a token', async () => {
  const invalid = await call('POST', '/api/auth/register', { body: { name: '', email: 'x', password: '1' } });
  assert.equal(invalid.status, 422);
  assert.ok(invalid.json.error.fields.email);

  const dup = await call('POST', '/api/auth/register', {
    body: { name: 'Dup', email: 'admin@example.com', password: 'secret1' },
  });
  assert.equal(dup.status, 409);

  const res = await call('POST', '/api/auth/register', {
    body: { name: 'New Member', email: 'member@example.com', password: 'secret1' },
  });
  assert.equal(res.status, 201);
  assert.equal(res.json.data.user.role, 'user');
  assert.ok(res.json.data.token);
});

test('users endpoints require an admin', async () => {
  assert.equal((await call('GET', '/api/users')).status, 401);
  const userToken = await login('siti@example.com');
  const forbidden = await call('GET', '/api/users', { token: userToken });
  assert.equal(forbidden.status, 403);
  assert.equal(forbidden.json.error.code, 'FORBIDDEN');
  assert.equal((await call('GET', '/api/dashboard', { token: userToken })).status, 200);
});

test('admin can run full user CRUD', async () => {
  const token = await login('admin@example.com');

  const list = await call('GET', '/api/users?role=staff', { token });
  assert.equal(list.status, 200);
  assert.ok(list.json.data.every((u) => u.role === 'staff'));

  const created = await call('POST', '/api/users', {
    token,
    body: { name: 'Rina', email: 'rina@example.com', password: 'secret1', role: 'staff', status: 'active' },
  });
  assert.equal(created.status, 201, created.text);
  const id = created.json.data.id;

  const dup = await call('POST', '/api/users', {
    token,
    body: { name: 'Rina 2', email: 'RINA@example.com', password: 'secret1' },
  });
  assert.equal(dup.status, 409);

  const invalid = await call('POST', '/api/users', { token, body: { name: 'X', email: 'x@example.com', role: 'root' } });
  assert.equal(invalid.status, 422);
  assert.ok(invalid.json.error.fields.role);
  assert.ok(invalid.json.error.fields.password);

  const updated = await call('PUT', `/api/users/${id}`, {
    token,
    body: { name: 'Rina Updated', email: 'rina@example.com', role: 'user', status: 'inactive' },
  });
  assert.equal(updated.status, 200, updated.text);
  assert.equal(updated.json.data.name, 'Rina Updated');
  assert.equal(updated.json.data.status, 'inactive');

  const takenOnUpdate = await call('PUT', `/api/users/${id}`, {
    token,
    body: { name: 'Rina', email: 'budi@example.com', role: 'user', status: 'active' },
  });
  assert.equal(takenOnUpdate.status, 409);

  const search = await call('GET', '/api/users?search=rina', { token });
  assert.equal(search.json.data.length, 1);

  assert.equal((await call('DELETE', `/api/users/${id}`, { token })).status, 200);
  assert.equal((await call('GET', `/api/users/${id}`, { token })).status, 404);

  const me = await call('GET', '/api/auth/me', { token });
  const self = await call('DELETE', `/api/users/${me.json.data.user.id}`, { token });
  assert.equal(self.status, 400);
  assert.equal(self.json.error.code, 'CANNOT_DELETE_SELF');
});

test('settings: readable by users, writable by admins only', async () => {
  const userToken = await login('siti@example.com');
  const adminToken = await login('admin@example.com');
  const body = { site_name: 'Toko Baru', site_description: 'Desc', support_email: 'cs@example.com' };

  assert.equal((await call('GET', '/api/settings', { token: userToken })).status, 200);
  assert.equal((await call('PUT', '/api/settings', { token: userToken, body })).status, 403);

  const saved = await call('PUT', '/api/settings', { token: adminToken, body });
  assert.equal(saved.status, 200);
  assert.equal(saved.json.data.site_name, 'Toko Baru');
  assert.equal((await call('GET', '/api/site')).json.data.siteName, 'Toko Baru');

  const empty = await call('PUT', '/api/settings', { token: adminToken, body: { site_name: '' } });
  assert.equal(empty.status, 422);
});

test('unknown API routes return JSON 404 and CORS preflight is allowed', async () => {
  const res = await call('GET', '/api/nope');
  assert.equal(res.status, 404);
  assert.equal(res.json.error.code, 'NOT_FOUND');

  const preflight = await app.request('/api/users', {
    method: 'OPTIONS',
    headers: { Origin: 'https://example.org', 'Access-Control-Request-Method': 'GET' },
  });
  assert.equal(preflight.headers.get('access-control-allow-origin'), '*');
});

test('SPA shell injects the reverse-proxy prefix into <base href>', async () => {
  const root = await call('GET', '/');
  assert.equal(root.status, 200);
  assert.match(root.text, /<base href="\/">/);

  const prefixed = await call('GET', '/', { headers: { 'X-Forwarded-Prefix': '/agent-api/projects/x/preview/' } });
  assert.match(prefixed.text, /<base href="\/agent-api\/projects\/x\/preview\/">/);
  assert.doesNotMatch(prefixed.text, /%BASE_PATH%|%APP_NAME%/);

  const asset = await app.request('/public/js/main.js');
  assert.equal(asset.status, 200);
  assert.match(asset.headers.get('content-type'), /javascript/);
});
