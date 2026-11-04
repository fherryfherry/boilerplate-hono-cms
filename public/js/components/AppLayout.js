import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuth } from '../lib/auth.js';
import { useTheme } from '../lib/theme.js';
import { useToast } from '../lib/toast.js';
import { Icon } from './Icon.js';

export const AppLayout = {
  name: 'AppLayout',
  components: { Icon },
  props: {
    title: { type: String, default: '' },
  },
  setup() {
    const sidebarOpen = ref(false);
    const router = useRouter();
    const route = useRoute();
    const { user, isAdmin, logout } = useAuth();
    const { isDark, toggle: toggleTheme } = useTheme();
    const { toast } = useToast();

    const navItems = [
      { key: 'dashboard', label: 'Dashboard', to: '/admin', icon: 'layout-dashboard' },
      { key: 'users', label: 'Manajemen User', to: '/admin/users', icon: 'users', adminOnly: true },
      { key: 'settings', label: 'Pengaturan', to: '/admin/settings', icon: 'settings' },
    ];

    async function handleLogout() {
      await logout();
      toast('Berhasil keluar', { description: 'Sesi Anda telah berakhir.' });
      router.push('/login');
    }

    return {
      sidebarOpen,
      route,
      user,
      isAdmin,
      navItems,
      isDark,
      toggleTheme,
      handleLogout,
    };
  },
  template: `
    <div class="min-h-screen flex flex-col lg:flex-row bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <!-- Mobile Sidebar Backdrop -->
      <div
        v-if="sidebarOpen"
        @click="sidebarOpen = false"
        class="fixed inset-0 z-40 bg-black/60 lg:hidden"
      ></div>

      <!-- Sidebar -->
      <aside
        :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
        class="fixed inset-y-0 left-0 z-40 w-64 border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] flex flex-col transition-transform duration-200 lg:static lg:w-64 shrink-0"
      >
        <div class="h-14 px-5 flex items-center justify-between border-b border-[hsl(var(--border))]">
          <router-link to="/admin" class="flex items-center gap-2.5 font-semibold text-sm tracking-tight">
            <div class="h-7 w-7 rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] flex items-center justify-center font-bold text-xs">
              TN
            </div>
            <span class="truncate">Workspace</span>
          </router-link>
          <button @click="sidebarOpen = false" class="lg:hidden text-[hsl(var(--muted-foreground))]">
            <Icon name="x" class="w-4 h-4" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div class="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Menu Utama
          </div>
          <template v-for="item in navItems" :key="item.key">
            <router-link
              v-if="!item.adminOnly || isAdmin"
              :to="item.to"
              class="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              :class="route.path === item.to
                ? 'bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))]'
                : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]'"
            >
              <Icon :name="item.icon" class="w-4 h-4" />
              <span>{{ item.label }}</span>
            </router-link>
          </template>
        </div>

        <div class="p-3 border-t border-[hsl(var(--border))]">
          <div class="flex items-center justify-between px-2 py-1.5">
            <div class="min-w-0">
              <div class="text-xs font-semibold truncate">{{ user?.name || 'User' }}</div>
              <div class="text-[11px] text-[hsl(var(--muted-foreground))] truncate">{{ user?.email || '' }}</div>
            </div>
            <button
              type="button"
              @click="handleLogout"
              class="sh-btn sh-btn-ghost sh-btn-sm text-red-500 hover:bg-red-500/10"
              title="Keluar"
            >
              <Icon name="log-out" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <!-- Main Workspace -->
      <div class="flex-1 flex flex-col min-w-0">
        <!-- Top Header -->
        <header class="h-14 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]/80 backdrop-blur-xs px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30">
          <div class="flex items-center gap-3">
            <button @click="sidebarOpen = true" class="lg:hidden sh-btn sh-btn-ghost sh-btn-sm">
              <Icon name="menu" class="w-4 h-4" />
            </button>
            <h1 class="text-sm sm:text-base font-semibold tracking-tight">{{ title }}</h1>
          </div>

          <div class="flex items-center gap-2">
            <router-link to="/" class="sh-btn sh-btn-outline sh-btn-sm">
              <Icon name="external-link" class="w-3.5 h-3.5" />
              <span class="hidden sm:inline">Halaman Publik</span>
            </router-link>
            <button
              @click="toggleTheme"
              class="sh-btn sh-btn-ghost sh-btn-sm"
              title="Ganti Tema"
            >
              <Icon :name="isDark ? 'sun' : 'moon'" class="w-4 h-4" />
            </button>
          </div>
        </header>

        <!-- Page Body -->
        <main class="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <slot></slot>
        </main>
      </div>
    </div>
  `,
};
