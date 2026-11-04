import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuth } from '../lib/auth.js';
import { useToast } from '../lib/toast.js';
import { Icon } from '../components/Icon.js';
import { Alert } from '../components/ui.js';

export const LoginPage = {
  name: 'LoginPage',
  components: { Icon, Alert },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const { login, register } = useAuth();
    const { toast } = useToast();

    const isRegister = computed(() => route.path === '/register');

    const form = ref({
      name: '',
      email: isRegister.value ? '' : 'admin@example.com',
      password: isRegister.value ? '' : 'password',
    });

    const error = ref('');
    const loading = ref(false);

    async function handleSubmit() {
      error.value = '';
      loading.value = true;
      try {
        if (isRegister.value) {
          await register(form.value.name, form.value.email, form.value.password);
          toast('Pendaftaran Berhasil', { description: 'Selamat datang di aplikasi!', variant: 'success' });
        } else {
          await login(form.value.email, form.value.password);
          toast('Login Berhasil', { description: 'Selamat datang kembali!', variant: 'success' });
        }
        const redirect = route.query.redirect || '/admin';
        router.push(redirect);
      } catch (err) {
        error.value = err.message || 'Terjadi kesalahan saat memproses permintaan.';
      } finally {
        loading.value = false;
      }
    }

    return {
      isRegister,
      form,
      error,
      loading,
      handleSubmit,
    };
  },
  template: `
    <div class="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div class="w-full max-w-md space-y-6">
        <div class="flex flex-col items-center text-center space-y-2">
          <router-link to="/" class="h-10 w-10 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] flex items-center justify-center font-bold text-sm shadow-xs">
            TN
          </router-link>
          <h1 class="text-2xl font-bold tracking-tight">
            {{ isRegister ? 'Buat Akun Baru' : 'Masuk ke Akun' }}
          </h1>
          <p class="text-sm text-[hsl(var(--muted-foreground))]">
            {{ isRegister ? 'Isi data di bawah untuk mulai menggunakan sistem' : 'Masukkan email dan password untuk mengakses dashboard' }}
          </p>
        </div>

        <div class="sh-card p-6 sm:p-8 space-y-5">
          <Alert v-if="error" title="Gagal" :description="error" variant="destructive" />

          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div v-if="isRegister" class="space-y-1.5">
              <label class="text-xs font-medium">Nama Lengkap</label>
              <input
                v-model="form.name"
                type="text"
                required
                placeholder="Nama Anda"
                class="sh-input"
              />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-medium">Alamat Email</label>
              <input
                v-model="form.email"
                type="email"
                required
                placeholder="nama@perusahaan.com"
                class="sh-input"
              />
            </div>

            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label class="text-xs font-medium">Password</label>
              </div>
              <input
                v-model="form.password"
                type="password"
                required
                placeholder="••••••••"
                class="sh-input"
              />
            </div>

            <button
              type="submit"
              :disabled="loading"
              class="sh-btn sh-btn-default w-full h-10"
            >
              <Icon :name="isRegister ? 'user-plus' : 'log-in'" class="w-4 h-4" />
              <span>{{ loading ? 'Memproses...' : (isRegister ? 'Daftar Sekarang' : 'Masuk') }}</span>
            </button>
          </form>

          <div
            v-if="!isRegister"
            class="rounded-md bg-[hsl(var(--secondary))] p-3 text-xs text-[hsl(var(--muted-foreground))] flex items-center justify-between"
          >
            <span>Demo Admin: <strong class="text-[hsl(var(--foreground))]">admin@example.com</strong></span>
            <span>Pass: <strong class="text-[hsl(var(--foreground))]">password</strong></span>
          </div>

          <div class="text-center text-xs text-[hsl(var(--muted-foreground))] pt-2 border-t border-[hsl(var(--border))]">
            <template v-if="isRegister">
              Sudah punya akun?
              <router-link to="/login" class="font-medium text-[hsl(var(--foreground))] underline underline-offset-4">
                Masuk di sini
              </router-link>
            </template>
            <template v-else>
              Belum punya akun?
              <router-link to="/register" class="font-medium text-[hsl(var(--foreground))] underline underline-offset-4">
                Daftar akun
              </router-link>
            </template>
          </div>
        </div>
      </div>
    </div>
  `,
};
