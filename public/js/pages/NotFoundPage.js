import { Icon } from '../components/Icon.js';

export const NotFoundPage = {
  name: 'NotFoundPage',
  components: { Icon },
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div class="h-16 w-16 rounded-full bg-[hsl(var(--secondary))] flex items-center justify-center text-[hsl(var(--muted-foreground))] mb-4">
        <Icon name="alert-triangle" class="w-8 h-8 text-amber-500" />
      </div>
      <h1 class="text-3xl font-bold tracking-tight">404 - Halaman Tidak Ditemukan</h1>
      <p class="text-sm text-[hsl(var(--muted-foreground))] mt-2 max-w-sm">
        Halaman yang Anda tuju tidak tersedia atau telah dipindahkan.
      </p>
      <div class="mt-6 flex items-center gap-3">
        <router-link to="/" class="sh-btn sh-btn-outline">
          <Icon name="home" class="w-4 h-4" />
          <span>Beranda</span>
        </router-link>
        <router-link to="/admin" class="sh-btn sh-btn-default">
          <Icon name="layout-dashboard" class="w-4 h-4" />
          <span>Dashboard</span>
        </router-link>
      </div>
    </div>
  `,
};
