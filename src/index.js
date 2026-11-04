const fs = require('fs');
const path = require('path');
const { Hono } = require('hono');
const { html } = require('hono/html');
const { serve } = require('@hono/node-server');
const { getEnv } = require('./config/env');
const { proxyPrefixMiddleware } = require('./middleware/proxy-prefix');
const { loadSessionMiddleware } = require('./middleware/auth');
const { BaseDocument } = require('./views/layout');
const { Badge } = require('./views/components/ui');
const { authRoutes } = require('./routes/auth.routes');
const { dashboardRoutes } = require('./routes/dashboard.routes');
const { usersRoutes } = require('./routes/users.routes');
const { settingsRoutes } = require('./routes/settings.routes');
const db = require('./db/client');

const app = new Hono();

// Serve static files from /public without compression issues
app.get('/public/*', (c) => {
  const relPath = c.req.path.replace(/^\/public\//, '');
  const safePath = path.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, '');
  const fullPath = path.join(process.cwd(), 'public', safePath);

  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
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
app.use('*', loadSessionMiddleware);

// Public Home Page
app.get('/', async (c) => {
  const basePath = c.get('basePath') || '';
  const url = c.get('url');
  const user = c.get('user');
  const { appName } = getEnv();

  let siteName = appName;
  let siteDesc = 'Aplikasi manajemen modern berbasis Hono, HTMX, dan Shadcn UI.';
  try {
    const nameRow = await db.get("SELECT setting_value FROM settings WHERE setting_key = 'site_name'");
    const descRow = await db.get("SELECT setting_value FROM settings WHERE setting_key = 'site_description'");
    if (nameRow?.setting_value) siteName = nameRow.setting_value;
    if (descRow?.setting_value) siteDesc = descRow.setting_value;
  } catch (_) {
    // Fallback if database is not yet initialized
  }

  return c.html(
    BaseDocument({
      title: 'Beranda',
      basePath,
      children: html`
        <div class="min-h-screen flex flex-col">
          <!-- Public Navbar -->
          <header class="h-16 border-b border-[hsl(var(--border))] px-4 sm:px-8 flex items-center justify-between max-w-6xl w-full mx-auto">
            <div class="flex items-center gap-2.5 font-semibold text-sm">
              <div class="h-7 w-7 rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] flex items-center justify-center font-bold text-xs">
                TN
              </div>
              <span>${siteName}</span>
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="darkMode = !darkMode; localStorage.setItem('tnpg_theme', darkMode ? 'dark' : 'light')"
                class="sh-btn sh-btn-ghost sh-btn-sm"
                title="Ganti Tema"
              >
                <i data-lucide="sun" class="w-4 h-4" x-show="darkMode"></i>
                <i data-lucide="moon" class="w-4 h-4" x-show="!darkMode" x-cloak></i>
              </button>
              ${user
                ? html`
                    <a href="${url('/admin')}" class="sh-btn sh-btn-default">
                      <i data-lucide="layout-dashboard" class="w-4 h-4"></i>
                      <span>Buka Dashboard</span>
                    </a>
                  `
                : html`
                    <a href="${url('/login')}" class="sh-btn sh-btn-ghost">Masuk</a>
                    <a href="${url('/register')}" class="sh-btn sh-btn-default">Daftar</a>
                  `}
            </div>
          </header>

          <!-- Hero Section -->
          <main class="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center max-w-4xl mx-auto">
            <div class="mb-4">
              ${Badge({ children: 'Hono + HTMX + Shadcn UI Boilerplate', variant: 'secondary' })}
            </div>
            <h1 class="text-3xl sm:text-5xl font-bold tracking-tight max-w-2xl leading-tight">
              ${siteName}
            </h1>
            <p class="mt-4 text-base sm:text-lg text-[hsl(var(--muted-foreground))] max-w-xl">
              ${siteDesc}
            </p>
            <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a href="${url(user ? '/admin' : '/login')}" class="sh-btn sh-btn-default sh-btn-lg">
                <i data-lucide="arrow-right" class="w-4 h-4"></i>
                <span>${user ? 'Masuk ke Admin Panel' : 'Mulai Sekarang'}</span>
              </a>
              <a href="${url('/admin/users')}" class="sh-btn sh-btn-outline sh-btn-lg">
                <i data-lucide="users" class="w-4 h-4"></i>
                <span>Kelola Data</span>
              </a>
            </div>

            <!-- Feature Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 w-full text-left">
              <div class="sh-card p-5 space-y-2">
                <div class="h-8 w-8 rounded-md bg-[hsl(var(--secondary))] flex items-center justify-center">
                  <i data-lucide="zap" class="w-4 h-4"></i>
                </div>
                <h3 class="text-sm font-semibold">Zero Build & Instan</h3>
                <p class="text-xs text-[hsl(var(--muted-foreground))]">
                  Berjalan langsung di atas Node.js 22 + Hono dengan HTMX & Alpine.js tanpa perlu proses build frontend.
                </p>
              </div>
              <div class="sh-card p-5 space-y-2">
                <div class="h-8 w-8 rounded-md bg-[hsl(var(--secondary))] flex items-center justify-center">
                  <i data-lucide="layers" class="w-4 h-4"></i>
                </div>
                <h3 class="text-sm font-semibold">Shadcn UI Design</h3>
                <p class="text-xs text-[hsl(var(--muted-foreground))]">
                  Komponen Card, Table, Modal, Badge, dan Toast bergaya Shadcn lengkap dengan mode gelap & terang.
                </p>
              </div>
              <div class="sh-card p-5 space-y-2">
                <div class="h-8 w-8 rounded-md bg-[hsl(var(--secondary))] flex items-center justify-center">
                  <i data-lucide="database" class="w-4 h-4"></i>
                </div>
                <h3 class="text-sm font-semibold">Multi-Database Ready</h3>
                <p class="text-xs text-[hsl(var(--muted-foreground))]">
                  Mendukung SQLite bawaan Node 22, PostgreSQL, dan MariaDB otomatis dari konfigurasi .env.
                </p>
              </div>
            </div>
          </main>

          <footer class="py-6 border-t border-[hsl(var(--border))] text-center text-xs text-[hsl(var(--muted-foreground))]">
            &copy; ${new Date().getFullYear()} ${siteName}. Built with TanpaNgoding AI.
          </footer>
        </div>
      `,
    })
  );
});

app.route('/', authRoutes);
app.route('/admin', dashboardRoutes);
app.route('/admin/users', usersRoutes);
app.route('/admin/settings', settingsRoutes);

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
