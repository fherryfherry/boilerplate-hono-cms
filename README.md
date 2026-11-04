# TanpaNgoding Hono JSON API + Vue 3 SPA + Shadcn UI Boilerplate

Boilerplate fullstack modern, zero-build, dan ringan berbasis REST API dan Single Page Application (SPA).

## Tech Stack

- **Backend Runtime & Server**: Node.js 22 + [Hono](https://hono.dev/) (`@hono/node-server`)
- **Backend Architecture**: REST API murni berformat JSON (`/api/*`), stateless Bearer token auth (HMAC-SHA256)
- **Frontend SPA**: [Vue 3](https://vuejs.org/) (ESM browser build tanpa proses bundler/build) + [Vue Router 4](https://router.vuejs.org/) (hash mode)
- **Styling & UI Primitives**: Tailwind CSS + **Shadcn UI** CSS variables & primitives (`public/css/shadcn.css`, `public/js/components/ui.js`) + [Lucide Icons](https://lucide.dev/)
- **Database**: Multi-engine adapter (`src/db/client.js`) mendukung **SQLite** (bawaan `node:sqlite`), **PostgreSQL** (`pg`), dan **MariaDB/MySQL** (`mysql2`) via `.env`

## Project Structure

```
├── public/
│   ├── index.html                 # SPA shell dengan import map & dynamic <base href>
│   ├── css/shadcn.css             # Desain token Shadcn UI (light & dark mode)
│   └── js/
│       ├── main.js                # Inisialisasi Vue 3, Vue Router, navigation guard & toast
│       ├── lib/
│       │   ├── api.js             # Fetch wrapper (Bearer token, path resolution, ApiError)
│       │   ├── auth.js            # Reactive auth store (login, register, logout, session)
│       │   ├── toast.js           # Toast store & notification helper
│       │   └── theme.js           # Dark mode manager
│       ├── components/
│       │   ├── AppLayout.js       # Admin layout (sidebar, navbar, theme toggle, logout)
│       │   ├── Icon.js            # SVG Lucide icon renderer
│       │   ├── Modal.js           # Reusable modal dialog
│       │   ├── ToastStack.js      # Global toast notification stack
│       │   └── ui.js              # Card, StatCard, Badge, Alert, EmptyState
│       └── pages/
│           ├── HomePage.js        # Landing page publik
│           ├── LoginPage.js       # Halaman login & pendaftaran akun
│           ├── DashboardPage.js   # Ringkasan statistik & log aktivitas
│           ├── UsersPage.js       # Manajemen pengguna (CRUD, search, modal, filter)
│           ├── SettingsPage.js    # Pengaturan sistem
│           └── NotFoundPage.js    # Halaman 404
├── src/
│   ├── index.js                   # Entry point server (static files, /api, SPA shell)
│   ├── config/env.js              # Environment variable loader
│   ├── lib/
│   │   ├── http.js                # Helper ok(), fail(), readJson()
│   │   └── activity.js            # Helper logActivity()
│   ├── middleware/
│   │   ├── auth.js                # Bearer token verification, requireAuth, requireRole
│   │   └── proxy-prefix.js        # Reverse-proxy prefix resolver
│   ├── api/
│   │   ├── index.js               # Sub-app /api dengan CORS, middleware, & error handler
│   │   ├── auth.js                # /api/auth (login, register, me, logout)
│   │   ├── dashboard.js           # /api/dashboard (stats, recent users, logs)
│   │   ├── users.js               # /api/users (CRUD pengguna, khusus admin)
│   │   └── settings.js            # /api/site (publik) & /api/settings (admin)
│   └── db/
│       ├── client.js              # Universal database client (SQLite, Postgres, MariaDB)
│       ├── migrate.js             # Runner migrasi SQL
│       ├── seed.js                # Default seeder (admin@example.com / password)
│       └── key-generate.js        # Generator APP_KEY HMAC
└── test/
    └── api.test.js                # Test suite otomatis (node:test)
```

## Daftar Endpoint API

Semua respons API menggunakan struktur JSON konsisten:
- Sukses: `{ "data": ... }`
- Gagal: `{ "error": { "message": "...", "code": "...", "fields": { ... } } }`

| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| GET | `/api/health` | Publik | Health check `{ data: { ok: true } }` |
| GET | `/api/site` | Publik | Info nama & deskripsi aplikasi untuk landing page |
| POST | `/api/auth/login` | Publik | Login pengguna, menghasilkan token Bearer |
| POST | `/api/auth/register` | Publik | Pendaftaran akun baru |
| GET | `/api/auth/me` | User | Profil pengguna yang sedang login |
| POST | `/api/auth/logout` | User | Catat log keluar (klien membuang token lokal) |
| GET | `/api/dashboard` | User | Statistik sistem, pengguna terbaru, log aktivitas |
| GET | `/api/users` | Admin | Daftar pengguna (mendukung query `?search=` & `?role=`) |
| GET | `/api/users/:id` | Admin | Detail data pengguna |
| POST | `/api/users` | Admin | Tambah pengguna baru |
| PUT | `/api/users/:id` | Admin | Perbarui informasi pengguna (password opsional) |
| DELETE | `/api/users/:id` | Admin | Hapus pengguna (tidak bisa menghapus akun sendiri) |
| GET | `/api/settings` | User | Baca data pengaturan aplikasi |
| PUT | `/api/settings` | Admin | Perbarui pengaturan aplikasi |

## Konvensi Menambah Fitur Baru

1. **Migrasi Database**:
   Tambahkan file `00X_nama_fitur.sql` di `src/db/migrations/` dan jalankan `node src/db/migrate.js`.
   Gunakan selalu placeholder `?` (`src/db/client.js` otomatis mengonversi ke `$1, $2` pada Postgres).

2. **Buat Endpoint API**:
   Tambahkan handler di `src/api/<fitur>.js`:
   ```js
   const { Hono } = require('hono');
   const { ok, fail, readJson } = require('../lib/http');
   const { requireAuth } = require('../middleware/auth');
   const db = require('../db/client');

   const router = new Hono();
   router.use('*', requireAuth);

   router.get('/', async (c) => {
     const rows = await db.all('SELECT * FROM items ORDER BY id DESC');
     return ok(c, rows);
   });

   module.exports = { itemsRouter: router };
   ```
   Daftarkan di `src/api/index.js` dengan `api.route('/items', itemsRouter);`.

3. **Buat Halaman Frontend Vue**:
   Buat file `public/js/pages/ItemsPage.js`:
   ```js
   import { ref, onMounted } from 'vue';
   import { api } from '../lib/api.js';
   import { AppLayout } from '../components/AppLayout.js';

   export const ItemsPage = {
     name: 'ItemsPage',
     components: { AppLayout },
     setup() {
       const items = ref([]);
       onMounted(async () => {
         items.value = await api.get('api/items');
       });
       return { items };
     },
     template: `
       <AppLayout title="Data Item">
         <div v-for="item in items" :key="item.id">{{ item.name }}</div>
       </AppLayout>
     `,
   };
   ```
   Daftarkan rute di `public/js/main.js` pada array `routes`.

4. **Aturan Path Relatif**:
   Jangan gunakan awalan `/` saat memanggil `api.get('api/items')` atau mengakses file `public/...`.
   Tag `<base href="%BASE_PATH%/">` pada `public/index.html` otomatis menyesuaikan semua request relatif agar bekerja sempurna di root domain, subpath proxy (`/agent-api/projects/:id/preview/`), maupun custom domain.

## Testing

Jalankan test suite bawaan Node.js:
```bash
npm test
```
