# TanpaNgoding Hono + HTMX + Shadcn UI Boilerplate

Lightweight, zero-build fullstack web application & admin panel boilerplate built for fast iteration.

## Tech Stack

- **Runtime & Server**: Node.js 22 + [Hono](https://hono.dev/) (`@hono/node-server`)
- **Frontend Interactivity**: [HTMX 2](https://htmx.org/) + [Alpine.js 3](https://alpinejs.dev/) + [Lucide Icons](https://lucide.dev/)
- **Styling & UI Components**: Tailwind CSS + **Shadcn UI** CSS variables & primitives (`public/css/shadcn.css`, `src/views/components/ui.js`)
- **Database**: Multi-engine adapter (`src/db/client.js`) supporting **SQLite** (built-in `node:sqlite`), **PostgreSQL** (`pg`), and **MariaDB/MySQL** (`mysql2`) via `.env`

## Project Structure

- `src/index.js` — Main Hono application entry point & public landing route
- `src/config/env.js` — Environment variable reader
- `src/middleware/proxy-prefix.js` — Reverse-proxy `X-Forwarded-Prefix` support (`c.get('url')('/path')`)
- `src/middleware/auth.js` — HMAC cookie session authentication & role guards (`requireAuth`, `requireRole`)
- `src/db/client.js` — Database helper (`await db.all(sql, params)`, `await db.get(sql, params)`, `await db.run(sql, params)`)
- `src/db/migrations/` — SQL migration files (run via `node src/db/migrate.js`)
- `src/db/seed.js` — Database seeder (default admin: `admin@example.com` / `password`)
- `src/views/layout.js` — `BaseDocument` and `AdminLayout` (sidebar, header, dark mode, modal & toast containers)
- `src/views/components/ui.js` — Reusable Shadcn UI components (`Card`, `StatCard`, `Badge`, `Alert`, `EmptyState`)
- `src/routes/` — Modular Hono route handlers (`auth`, `dashboard`, `users`, `settings`)

## Conventions for Adding New Features

1. **Database Migrations**: Add a new `00X_feature.sql` file under `src/db/migrations/` and run `node src/db/migrate.js`. Always use `?` parameter placeholders in queries (`src/db/client.js` automatically converts `?` to `$1, $2` when `DB_CONNECTION=pgsql`).
2. **Reverse-Proxy Safe URLs**: Always wrap internal links, form actions, and redirects with `const url = c.get('url'); url('/your-path')`. Never hardcode `localhost` or a fixed prefix.
3. **HTMX Partials & Modals**:
   - Check `if (c.req.header('HX-Request'))` to return partial HTML fragments for fast table updates.
   - To open a modal via HTMX: `hx-get="${url('/admin/items/new')}" hx-target="#modal-content" @click="$dispatch('shadcn-modal-open')"`.
   - To close the modal and show a toast after POST/DELETE, set the `HX-Trigger` response header:
     ```js
     c.header('HX-Trigger', JSON.stringify({
       closeModal: true,
       toast: { title: 'Berhasil', description: 'Data disimpan.', variant: 'success' }
     }));
     ```
