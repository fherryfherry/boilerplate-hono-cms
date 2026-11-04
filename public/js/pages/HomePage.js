import { ref, onMounted } from 'vue';
import { useAuth } from '../lib/auth.js';
import { useTheme } from '../lib/theme.js';
import { api } from '../lib/api.js';
import { Icon } from '../components/Icon.js';
import { Badge } from '../components/ui.js';

export const HomePage = {
  name: 'HomePage',
  components: { Icon, Badge },
  setup() {
    const { isAuthenticated } = useAuth();
    const { isDark, toggle: toggleTheme } = useTheme();
    const site = ref({
      siteName: 'TanpaNgoding Workspace',
      siteDescription: 'Aplikasi manajemen modern berbasis Hono JSON API, Vue 3, dan Shadcn UI.',
    });

    onMounted(async () => {
      try {
        const data = await api.get('api/site');
        if (data?.siteName) site.value.siteName = data.siteName;
        if (data?.siteDescription) site.value.siteDescription = data.siteDescription;
      } catch (_) {}
    });

    const currentYear = new Date().getFullYear();

    return {
      isAuthenticated,
      isDark,
      toggleTheme,
      site,
      currentYear,
    };
  },
  template: `
    <div class="min-h-screen flex flex-col bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <!-- Public Navbar -->
      <header class="h-16 border-b border-[hsl(var(--border))] px-4 sm:px-8 flex items-center justify-between max-w-6xl w-full mx-auto">
        <div class="flex items-center gap-2.5 font-semibold text-sm">
          <div class="h-7 w-7 rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] flex items-center justify-center font-bold text-xs">
            TN
          </div>
          <span>{{ site.siteName }}</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="toggleTheme"
            class="sh-btn sh-btn-ghost sh-btn-sm"
            title="Ganti Tema"
          >
            <Icon :name="isDark ? 'sun' : 'moon'" class="w-4 h-4" />
          </button>
          <template v-if="isAuthenticated">
            <router-link to="/admin" class="sh-btn sh-btn-default">
              <Icon name="layout-dashboard" class="w-4 h-4" />
              <span>Buka Dashboard</span>
            </router-link>
          </template>
          <template v-else>
            <router-link to="/login" class="sh-btn sh-btn-ghost">Masuk</router-link>
            <router-link to="/register" class="sh-btn sh-btn-default">Daftar</router-link>
          </template>
        </div>
      </header>

      <!-- Hero Section -->
      <main class="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center max-w-4xl mx-auto">
        <div class="mb-4">
          <Badge variant="secondary">Hono JSON API + Vue 3 SPA + Shadcn UI</Badge>
        </div>
        <h1 class="text-3xl sm:text-5xl font-bold tracking-tight max-w-2xl leading-tight">
          {{ site.siteName }}
        </h1>
        <p class="mt-4 text-base sm:text-lg text-[hsl(var(--muted-foreground))] max-w-xl">
          {{ site.siteDescription }}
        </p>
        <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
          <router-link
            :to="isAuthenticated ? '/admin' : '/login'"
            class="sh-btn sh-btn-default sh-btn-lg"
          >
            <Icon name="arrow-right" class="w-4 h-4" />
            <span>{{ isAuthenticated ? 'Masuk ke Dashboard' : 'Mulai Sekarang' }}</span>
          </router-link>
          <router-link to="/admin/users" class="sh-btn sh-btn-outline sh-btn-lg">
            <Icon name="users" class="w-4 h-4" />
            <span>Kelola Data</span>
          </router-link>
        </div>

        <!-- Feature Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 w-full text-left">
          <div class="sh-card p-5 space-y-2">
            <div class="h-8 w-8 rounded-md bg-[hsl(var(--secondary))] flex items-center justify-center">
              <Icon name="zap" class="w-4 h-4" />
            </div>
            <h3 class="text-sm font-semibold">Zero Build & Cepat</h3>
            <p class="text-xs text-[hsl(var(--muted-foreground))]">
              Backend Hono menyajikan REST API murni, frontend Vue 3 jalan langsung dari browser tanpa step bundler.
            </p>
          </div>
          <div class="sh-card p-5 space-y-2">
            <div class="h-8 w-8 rounded-md bg-[hsl(var(--secondary))] flex items-center justify-center">
              <Icon name="layers" class="w-4 h-4" />
            </div>
            <h3 class="text-sm font-semibold">Shadcn UI Primitives</h3>
            <p class="text-xs text-[hsl(var(--muted-foreground))]">
              Komponen Card, Table, Modal, Badge, dan Toast modern lengkap dengan dukungan mode gelap dan terang.
            </p>
          </div>
          <div class="sh-card p-5 space-y-2">
            <div class="h-8 w-8 rounded-md bg-[hsl(var(--secondary))] flex items-center justify-center">
              <Icon name="database" class="w-4 h-4" />
            </div>
            <h3 class="text-sm font-semibold">Multi-Database Ready</h3>
            <p class="text-xs text-[hsl(var(--muted-foreground))]">
              Mendukung SQLite bawaan Node 22, PostgreSQL, dan MariaDB secara otomatis lewat konfigurasi .env.
            </p>
          </div>
        </div>
      </main>

      <footer class="py-6 border-t border-[hsl(var(--border))] text-center text-xs text-[hsl(var(--muted-foreground))]">
        &copy; {{ currentYear }} {{ site.siteName }}. Built with TanpaNgoding AI.
      </footer>
    </div>
  `,
};
