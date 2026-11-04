const { html } = require('hono/html');
const { AdminLayout } = require('../layout');
const { Card, StatCard, Badge, EmptyState } = require('../components/ui');
const db = require('../../db/client');

function DashboardPage({ c, stats, recentUsers, recentLogs }) {
  const url = c.get('url');

  return AdminLayout({
    c,
    title: 'Dashboard Overview',
    activeMenu: 'dashboard',
    children: html`
      <!-- Top Welcome Banner -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold tracking-tight">Selamat datang kembali, ${c.get('user')?.name || 'Admin'}</h2>
          <p class="text-sm text-[hsl(var(--muted-foreground))]">
            Ringkasan performa sistem dan aktivitas terbaru hari ini.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <a href="${url('/admin/users')}" class="sh-btn sh-btn-default">
            <i data-lucide="user-plus" class="w-4 h-4"></i>
            <span>Kelola User</span>
          </a>
        </div>
      </div>

      <!-- KPI Stat Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        ${StatCard({
          label: 'Total Pengguna',
          value: stats.totalUsers,
          trend: '+12% bulan ini',
          icon: 'users',
        })}
        ${StatCard({
          label: 'Pengguna Aktif',
          value: stats.activeUsers,
          trend: 'Aktif beroperasi',
          icon: 'user-check',
        })}
        ${StatCard({
          label: 'Administrator',
          value: stats.adminCount,
          trend: 'Akses penuh',
          icon: 'shield-check',
        })}
        ${StatCard({
          label: 'Database Engine',
          value: db.getEngine().toUpperCase(),
          trend: 'Terhubung',
          icon: 'database',
        })}
      </div>

      <!-- Main Grid: Recent Users & Activity Logs -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2">
          ${Card({
            title: 'Pengguna Terbaru',
            description: 'Daftar akun yang baru terdaftar di dalam sistem.',
            actions: html`
              <a href="${url('/admin/users')}" class="sh-btn sh-btn-outline sh-btn-sm">
                Lihat Semua
              </a>
            `,
            children: html`
              <div class="overflow-x-auto -mx-6 -my-2">
                <table class="w-full text-sm text-left">
                  <thead class="text-xs uppercase text-[hsl(var(--muted-foreground))] border-b border-[hsl(var(--border))]">
                    <tr>
                      <th class="py-3 px-6 font-medium">Nama</th>
                      <th class="py-3 px-6 font-medium">Role</th>
                      <th class="py-3 px-6 font-medium">Status</th>
                      <th class="py-3 px-6 font-medium text-right">Terdaftar</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-[hsl(var(--border))]">
                    ${recentUsers.map(
                      (u) => html`
                        <tr class="hover:bg-[hsl(var(--muted))/0.4] transition-colors">
                          <td class="py-3 px-6">
                            <div class="font-medium">${u.name}</div>
                            <div class="text-xs text-[hsl(var(--muted-foreground))]">${u.email}</div>
                          </td>
                          <td class="py-3 px-6">
                            ${Badge({
                              children: u.role,
                              variant: u.role === 'admin' ? 'default' : 'secondary',
                            })}
                          </td>
                          <td class="py-3 px-6">
                            ${Badge({
                              children: u.status,
                              variant: u.status === 'active' ? 'success' : 'warning',
                            })}
                          </td>
                          <td class="py-3 px-6 text-right text-xs text-[hsl(var(--muted-foreground))]">
                            ${String(u.created_at || '').slice(0, 10)}
                          </td>
                        </tr>
                      `
                    )}
                  </tbody>
                </table>
              </div>
            `,
          })}
        </div>

        <div>
          ${Card({
            title: 'Log Aktivitas',
            description: 'Riwayat perubahan sistem terbaru.',
            children:
              recentLogs.length === 0
                ? EmptyState({ icon: 'activity', title: 'Belum ada aktivitas' })
                : html`
                    <div class="space-y-4">
                      ${recentLogs.map(
                        (log) => html`
                          <div class="flex items-start gap-3 pb-3 border-b border-[hsl(var(--border))] last:border-0 last:pb-0">
                            <div class="h-7 w-7 rounded-full bg-[hsl(var(--secondary))] flex items-center justify-center shrink-0 mt-0.5">
                              <i data-lucide="zap" class="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]"></i>
                            </div>
                            <div class="min-w-0 flex-1">
                              <div class="text-xs font-semibold">${log.action}</div>
                              <div class="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">${log.detail}</div>
                              <div class="text-[10px] text-[hsl(var(--muted-foreground))] mt-1">${log.created_at}</div>
                            </div>
                          </div>
                        `
                      )}
                    </div>
                  `,
          })}
        </div>
      </div>
    `,
  });
}

module.exports = { DashboardPage };
