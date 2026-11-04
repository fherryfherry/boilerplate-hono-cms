const fs = require('fs');
const path = require('path');
const { Hono } = require('hono');
const { serve } = require('@hono/node-server');
const { getEnv } = require('./config/env');
const { proxyPrefixMiddleware } = require('./middleware/proxy-prefix');
const { api } = require('./api');

const app = new Hono();
const PUBLIC_DIR = path.join(process.cwd(), 'public');

// Serve static files from /public without compression issues
app.get('/public/*', (c) => {
  const relPath = c.req.path.replace(/^\/public\//, '');
  const safePath = path.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, '');
  const fullPath = path.join(PUBLIC_DIR, safePath);

  if (!fullPath.startsWith(PUBLIC_DIR) || !fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
    return c.notFound();
  }

  const ext = path.extname(fullPath).toLowerCase();
  const mimeMap = {
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.json': 'application/json; charset=utf-8',
  };

  const content = fs.readFileSync(fullPath);
  return c.body(content, 200, {
    'Content-Type': mimeMap[ext] || 'application/octet-stream',
    'Cache-Control': 'public, max-age=300',
  });
});

app.use('*', proxyPrefixMiddleware);

// JSON REST API
app.route('/api', api);

// SPA shell. The only server-side change is the <base href>, so every relative
// URL in the frontend (public/..., api/...) resolves under the reverse-proxy prefix.
function escapeAttr(value) {
  return String(value).replace(/[&"<>]/g, (ch) => ({ '&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;' })[ch]);
}

app.get('/', (c) => {
  const template = fs.readFileSync(path.join(PUBLIC_DIR, 'index.html'), 'utf8');
  const { appName } = getEnv();
  const page = template
    .replaceAll('%BASE_PATH%', escapeAttr(c.get('basePath') || ''))
    .replaceAll('%APP_NAME%', escapeAttr(appName));
  return c.html(page, 200, { 'Cache-Control': 'no-cache' });
});

// The SPA uses hash routing (#/admin/...), so any other path is a real 404.
app.notFound((c) => {
  if (c.req.path.startsWith('/api')) {
    return c.json({ error: { message: 'Endpoint tidak ditemukan.', code: 'NOT_FOUND' } }, 404);
  }
  return c.text('Not Found', 404);
});

if (require.main === module) {
  const { port } = getEnv();
  serve(
    {
      fetch: app.fetch,
      hostname: '0.0.0.0',
      port,
    },
    (info) => {
      console.log(`Server listening on http://0.0.0.0:${info.port}`);
    }
  );
}

module.exports = { app };
