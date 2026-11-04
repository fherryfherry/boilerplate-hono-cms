const { html } = require('hono/html');
const { BaseDocument } = require('../layout');
const { Alert } = require('../components/ui');
const { getEnv } = require('../../config/env');

function LoginPage({ c, error = '', mode = 'login' }) {
  const basePath = c.get('basePath') || '';
  const url = c.get('url');
  const { appName } = getEnv();
  const isRegister = mode === 'register';

  return BaseDocument({
    title: isRegister ? 'Daftar Akun' : 'Masuk ke Akun',
    basePath,
    children: html`
      <div class="min-h-screen flex flex-col justify-center items-center px-4 py-12">
        <div class="w-full max-w-md space-y-6">
          <div class="flex flex-col items-center text-center space-y-2">
            <a href="${url('/')}" class="h-10 w-10 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] flex items-center justify-center font-bold text-sm shadow-xs">
              TN
            </a>
            <h1 class="text-2xl font-bold tracking-tight">
              ${isRegister ? 'Buat Akun Baru' : `Masuk ke ${appName}`}
            </h1>
            <p class="text-sm text-[hsl(var(--muted-foreground))]">
              ${isRegister
                ? 'Isi data di bawah untuk mulai menggunakan sistem'
                : 'Masukkan email dan password untuk mengakses dashboard'}
            </p>
          </div>

          <div class="sh-card p-6 sm:p-8 space-y-5">
            ${error ? Alert({ title: 'Autentikasi Gagal', description: error, variant: 'destructive' }) : ''}

            <form method="POST" action="${url(isRegister ? '/register' : '/login')}" class="space-y-4">
              ${isRegister
                ? html`
                    <div class="space-y-1.5">
                      <label class="text-xs font-medium">Nama Lengkap</label>
                      <input type="text" name="name" required placeholder="Nama Anda" class="sh-input" />
                    </div>
                  `
                : ''}

              <div class="space-y-1.5">
                <label class="text-xs font-medium">Alamat Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  value="${isRegister ? '' : 'admin@example.com'}"
                  placeholder="nama@perusahaan.com"
                  class="sh-input"
                />
              </div>

              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-medium">Password</label>
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  value="${isRegister ? '' : 'password'}"
                  placeholder="••••••••"
                  class="sh-input"
                />
              </div>

              <button type="submit" class="sh-btn sh-btn-default w-full h-10">
                <i data-lucide="${isRegister ? 'user-plus' : 'log-in'}" class="w-4 h-4"></i>
                <span>${isRegister ? 'Daftar Sekarang' : 'Masuk'}</span>
              </button>
            </form>

            ${!isRegister
              ? html`
                  <div class="rounded-md bg-[hsl(var(--secondary))] p-3 text-xs text-[hsl(var(--muted-foreground))] flex items-center justify-between">
                    <span>Demo Admin: <strong class="text-[hsl(var(--foreground))]">admin@example.com</strong></span>
                    <span>Pass: <strong class="text-[hsl(var(--foreground))]">password</strong></span>
                  </div>
                `
              : ''}

            <div class="text-center text-xs text-[hsl(var(--muted-foreground))] pt-2 border-t border-[hsl(var(--border))]">
              ${isRegister
                ? html`Sudah punya akun? <a href="${url('/login')}" class="font-medium text-[hsl(var(--foreground))] underline underline-offset-4">Masuk di sini</a>`
                : html`Belum punya akun? <a href="${url('/register')}" class="font-medium text-[hsl(var(--foreground))] underline underline-offset-4">Daftar akun</a>`}
            </div>
          </div>
        </div>
      </div>
    `,
  });
}

module.exports = { LoginPage };
