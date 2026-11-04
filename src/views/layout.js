const { html } = require('hono/html');
const { getEnv } = require('../config/env');

function BaseDocument({ title, basePath = '', children }) {
  const { appName } = getEnv();
  const pageTitle = title ? `${title} — ${appName}` : appName;

  return html`<!DOCTYPE html>
<html lang="id" data-base-path="${basePath}" x-data="{ darkMode: localStorage.getItem('tnpg_theme') !== 'light' }" :class="{ 'dark': darkMode }">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${pageTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="${basePath}/public/css/shadcn.css" />
  <script src="https://unpkg.com/htmx.org@2.0.4"></script>
  <script defer src="https://unpkg.com/alpinejs@3.14.8/dist/cdn.min.js"></script>
  <script src="https://unpkg.com/lucide@0.475.0/dist/umd/lucide.min.js"></script>
  <script>
    if (localStorage.getItem('tnpg_theme') !== 'light') {
      document.documentElement.classList.add('dark');
    }
  </script>
</head>
<body class="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] antialiased selection:bg-[hsl(var(--primary))] selection:text-[hsl(var(--primary-foreground))]">
  ${children}

  <!-- Global Shadcn Modal Container (populated via HTMX or Alpine) -->
  <div
    x-data="{ open: false }"
    @shadcn-modal-open.window="open = true"
    @shadcn-modal-close.window="open = false"
    @keydown.escape.window="open = false"
    x-show="open"
    x-cloak
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
  >
    <div
      @click.outside="open = false"
      id="modal-content"
      class="sh-card w-full max-w-lg overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-150"
    ></div>
  </div>

  <!-- Global Shadcn Toast Stack -->
  <div
    x-data="{ toasts: [] }"
    @shadcn-toast.window="toasts.push($event.detail); setTimeout(() => { toasts = toasts.filter(t => t.id !== $event.detail.id) }, 3500)"
    class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none px-4 sm:px-0"
  >
    <template x-for="t in toasts" :key="t.id">
      <div class="sh-card p-4 shadow-lg pointer-events-auto flex items-start justify-between gap-3 border-l-4"
           :class="t.variant === 'destructive' ? 'border-l-red-500' : t.variant === 'success' ? 'border-l-emerald-500' : 'border-l-[hsl(var(--primary))]'">
        <div>
          <div class="text-sm font-semibold" x-text="t.title"></div>
          <div class="text-xs text-[hsl(var(--muted-foreground))] mt-0.5" x-show="t.description" x-text="t.description"></div>
        </div>
        <button @click="toasts = toasts.filter(item => item.id !== t.id)" class="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
    </template>
  </div>

  <script src="${basePath}/public/js/app.js"></script>
</body>
</html>`;
}

function AdminLayout({ c, title, activeMenu = 'dashboard', children }) {
  const basePath = c.get('basePath') || '';
  const url = c.get('url');
  const user = c.get('user');
  const { appName } = getEnv();

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', href: url('/admin'), icon: 'layout-dashboard' },
    { key: 'users', label: 'Manajemen User', href: url('/admin/users'), icon: 'users' },
    { key: 'settings', label: 'Pengaturan', href: url('/admin/settings'), icon: 'settings' },
  ];

  return BaseDocument({
    title,
    basePath,
    children: html`
      <div x-data="{ sidebarOpen: false }" class="min-h-screen flex flex-col lg:flex-row">
        <!-- Mobile Sidebar Backdrop -->
        <div
          x-show="sidebarOpen"
          x-cloak
          @click="sidebarOpen = false"
          class="fixed inset-0 z-40 bg-black/60 lg:hidden"
        ></div>

        <!-- Sidebar -->
        <aside
          :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
          class="fixed inset-y-0 left-0 z-40 w-64 border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] flex flex-col transition-transform duration-200 lg:static lg:w-64 shrink-0"
        >
          <div class="h-14 px-5 flex items-center justify-between border-b border-[hsl(var(--border))]">
            <a href="${url('/admin')}" class="flex items-center gap-2.5 font-semibold text-sm tracking-tight">
              <div class="h-7 w-7 rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] flex items-center justify-center font-bold text-xs">
                TN
              </div>
              <span class="truncate">${appName}</span>
            </a>
            <button @click="sidebarOpen = false" class="lg:hidden text-[hsl(var(--muted-foreground))]">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            <div class="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Menu Utama
            </div>
            ${navItems.map((item) => {
              const isActive = activeMenu === item.key;
              return html`
                <a
                  href="${item.href}"
                  class="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                    ? 'bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))]'
                    : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]'}"
                >
                  <i data-lucide="${item.icon}" class="w-4 h-4"></i>
                  <span>${item.label}</span>
                </a>
              `;
            })}
          </div>

          <div class="p-3 border-t border-[hsl(var(--border))]">
            <div class="flex items-center justify-between px-2 py-1.5">
              <div class="min-w-0">
                <div class="text-xs font-semibold truncate">${user?.name || 'Admin'}</div>
                <div class="text-[11px] text-[hsl(var(--muted-foreground))] truncate">${user?.email || ''}</div>
              </div>
              <form method="POST" action="${url('/logout')}">
                <button type="submit" class="sh-btn sh-btn-ghost sh-btn-sm text-red-500" title="Keluar">
                  <i data-lucide="log-out" class="w-4 h-4"></i>
                </button>
              </form>
            </div>
          </div>
        </aside>

        <!-- Main Workspace -->
        <div class="flex-1 flex flex-col min-w-0">
          <!-- Top Header -->
          <header class="h-14 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]/80 backdrop-blur-xs px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30">
            <div class="flex items-center gap-3">
              <button @click="sidebarOpen = true" class="lg:hidden sh-btn sh-btn-ghost sh-btn-sm">
                <i data-lucide="menu" class="w-4 h-4"></i>
              </button>
              <h1 class="text-sm sm:text-base font-semibold tracking-tight">${title}</h1>
            </div>

            <div class="flex items-center gap-2">
              <a href="${url('/')}" class="sh-btn sh-btn-outline sh-btn-sm">
                <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                <span class="hidden sm:inline">Halaman Publik</span>
              </a>
              <button
                @click="darkMode = !darkMode; localStorage.setItem('tnpg_theme', darkMode ? 'dark' : 'light')"
                class="sh-btn sh-btn-ghost sh-btn-sm"
                title="Ganti Tema"
              >
                <i data-lucide="sun" class="w-4 h-4" x-show="darkMode"></i>
                <i data-lucide="moon" class="w-4 h-4" x-show="!darkMode" x-cloak></i>
              </button>
            </div>
          </header>

          <!-- Page Body -->
          <main class="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
            ${children}
          </main>
        </div>
      </div>
    `,
  });
}

module.exports = { BaseDocument, AdminLayout };
