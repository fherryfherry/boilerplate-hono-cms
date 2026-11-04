import { ref, onMounted } from 'vue';
import { useAuth } from '../lib/auth.js';
import { api } from '../lib/api.js';
import { AppLayout } from '../components/AppLayout.js';
import { Icon } from '../components/Icon.js';
import { Card, StatCard, Badge, EmptyState } from '../components/ui.js';

export const DashboardPage = {
  name: 'DashboardPage',
  components: { AppLayout, Icon, Card, StatCard, Badge, EmptyState },
  setup() {
    const { user } = useAuth();
    const loading = ref(true);
    const stats = ref({
      totalUsers: 0,
      activeUsers: 0,
      adminCount: 0,
      dbEngine: 'sqlite',
    });
    const recentUsers = ref([]);
    const recentLogs = ref([]);

    async function loadData() {
      loading.value = true;
      try {
        const res = await api.get('api/dashboard');
        if (res?.stats) stats.value = res.stats;
        if (res?.recentUsers) recentUsers.value = res.recentUsers;
        if (res?.recentLogs) recentLogs.value = res.recentLogs;
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        loading.value = false;
      }
    }

    onMounted(loadData);

    return {
      user,
      loading,
      stats,
      recentUsers,
      recentLogs,
    };
  },
  template: `
    <AppLayout title="Dashboard Overview">
      <!-- Top Welcome Banner -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold tracking-tight">Selamat datang kembali, {{ user?.name || 'Admin' }}</h2>
          <p class="text-sm text-[hsl(var(--muted-foreground))]">
            Ringkasan performa sistem dan aktivitas terbaru hari ini.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <router-link to="/admin/users" class="sh-btn sh-btn-default">
            <Icon name="user-plus" class="w-4 h-4" />
            <span>Kelola User</span>
          </router-link>
        </div>
      </div>

      <!-- KPI Stat Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Pengguna"
          :value="stats.totalUsers"
          trend="+12% bulan ini"
          icon="users"
        />
        <StatCard
          label="Pengguna Aktif"
          :value="stats.activeUsers"
          trend="Aktif beroperasi"
          icon="user-check"
        />
        <StatCard
          label="Administrator"
          :value="stats.adminCount"
          trend="Akses penuh"
          icon="shield-check"
        />
        <StatCard
          label="Database Engine"
          :value="String(stats.dbEngine || 'sqlite').toUpperCase()"
          trend="Terhubung"
          icon="database"
        />
      </div>

      <!-- Main Grid: Recent Users & Activity Logs -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2">
          <Card
            title="Pengguna Terbaru"
            description="Daftar akun yang baru terdaftar di dalam sistem."
          >
            <template #actions>
              <router-link to="/admin/users" class="sh-btn sh-btn-outline sh-btn-sm">
                Lihat Semua
              </router-link>
            </template>

            <div v-if="loading" class="py-12 text-center text-sm text-[hsl(var(--muted-foreground))]">
              Memuat data...
            </div>
            <EmptyState
              v-else-if="recentUsers.length === 0"
              icon="users"
              title="Belum ada pengguna"
            />
            <div v-else class="overflow-x-auto -mx-6 -my-2">
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
                  <tr
                    v-for="u in recentUsers"
                    :key="u.id"
                    class="hover:bg-[hsl(var(--muted))/0.4] transition-colors"
                  >
                    <td class="py-3 px-6">
                      <div class="font-medium">{{ u.name }}</div>
                      <div class="text-xs text-[hsl(var(--muted-foreground))]">{{ u.email }}</div>
                    </td>
                    <td class="py-3 px-6">
                      <Badge :variant="u.role === 'admin' ? 'default' : 'secondary'">
                        {{ u.role }}
                      </Badge>
                    </td>
                    <td class="py-3 px-6">
                      <Badge :variant="u.status === 'active' ? 'success' : 'warning'">
                        {{ u.status }}
                      </Badge>
                    </td>
                    <td class="py-3 px-6 text-right text-xs text-[hsl(var(--muted-foreground))]">
                      {{ String(u.created_at || '').slice(0, 10) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div>
          <Card
            title="Log Aktivitas"
            description="Riwayat perubahan sistem terbaru."
          >
            <div v-if="loading" class="py-12 text-center text-sm text-[hsl(var(--muted-foreground))]">
              Memuat riwayat...
            </div>
            <EmptyState
              v-else-if="recentLogs.length === 0"
              icon="activity"
              title="Belum ada aktivitas"
            />
            <div v-else class="space-y-4">
              <div
                v-for="log in recentLogs"
                :key="log.id"
                class="flex items-start gap-3 pb-3 border-b border-[hsl(var(--border))] last:border-0 last:pb-0"
              >
                <div class="h-7 w-7 rounded-full bg-[hsl(var(--secondary))] flex items-center justify-center shrink-0 mt-0.5">
                  <Icon name="zap" class="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-xs font-semibold">{{ log.action }}</div>
                  <div class="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{{ log.detail }}</div>
                  <div class="text-[10px] text-[hsl(var(--muted-foreground))] mt-1">{{ log.created_at }}</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  `,
};
