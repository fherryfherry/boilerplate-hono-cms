const { html } = require('hono/html');
const { AdminLayout } = require('../layout');
const { Card, Badge, EmptyState } = require('../components/ui');

function UsersTablePartial({ c, users = [], search = '', role = '' }) {
  const url = c.get('url');

  if (users.length === 0) {
    return html`
      <div id="users-table-container">
        ${EmptyState({
          icon: 'users',
          title: 'Tidak ada pengguna ditemukan',
          description: search || role ? 'Coba ubah kata kunci pencarian atau filter role.' : 'Tambahkan pengguna pertama Anda.',
        })}
      </div>
    `;
  }

  return html`
    <div id="users-table-container" class="overflow-x-auto -mx-6 -my-2">
      <table class="w-full text-sm text-left">
        <thead class="text-xs uppercase text-[hsl(var(--muted-foreground))] border-b border-[hsl(var(--border))]">
          <tr>
            <th class="py-3 px-6 font-medium">Pengguna</th>
            <th class="py-3 px-6 font-medium">Role</th>
            <th class="py-3 px-6 font-medium">Status</th>
            <th class="py-3 px-6 font-medium">Terdaftar</th>
            <th class="py-3 px-6 font-medium text-right">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[hsl(var(--border))]">
          ${users.map(
            (u) => html`
              <tr class="hover:bg-[hsl(var(--muted))/0.4] transition-colors">
                <td class="py-3.5 px-6">
                  <div class="font-medium">${u.name}</div>
                  <div class="text-xs text-[hsl(var(--muted-foreground))]">${u.email}</div>
                </td>
                <td class="py-3.5 px-6">
                  ${Badge({
                    children: u.role,
                    variant: u.role === 'admin' ? 'default' : 'secondary',
                  })}
                </td>
                <td class="py-3.5 px-6">
                  ${Badge({
                    children: u.status,
                    variant: u.status === 'active' ? 'success' : 'warning',
                  })}
                </td>
                <td class="py-3.5 px-6 text-xs text-[hsl(var(--muted-foreground))]">
                  ${String(u.created_at || '').slice(0, 10)}
                </td>
                <td class="py-3.5 px-6 text-right">
                  <div class="inline-flex items-center gap-1">
                    <button
                      hx-get="${url(`/admin/users/${u.id}/edit`)}"
                      hx-target="#modal-content"
                      @click="$dispatch('shadcn-modal-open')"
                      class="sh-btn sh-btn-ghost sh-btn-sm"
                      title="Edit"
                    >
                      <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
                    </button>
                    <button
                      hx-delete="${url(`/admin/users/${u.id}`)}"
                      hx-target="#users-table-container"
                      hx-swap="outerHTML"
                      hx-confirm="Hapus pengguna ${u.name}?"
                      class="sh-btn sh-btn-ghost sh-btn-sm text-red-500"
                      title="Hapus"
                    >
                      <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                  </div>
                </td>
              </tr>
            `
          )}
        </tbody>
      </table>
    </div>
  `;
}

function UserFormModal({ c, user = null }) {
  const url = c.get('url');
  const isEdit = Boolean(user);
  const action = isEdit ? url(`/admin/users/${user.id}`) : url('/admin/users');

  return html`
    <div class="p-6">
      <div class="flex items-center justify-between pb-4 border-b border-[hsl(var(--border))]">
        <div>
          <h3 class="text-base font-semibold">${isEdit ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h3>
          <p class="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
            ${isEdit ? 'Perbarui informasi akun pengguna di bawah ini.' : 'Isi detail untuk membuat akun baru.'}
          </p>
        </div>
        <button type="button" @click="$dispatch('shadcn-modal-close')" class="sh-btn sh-btn-ghost sh-btn-sm">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>

      <form
        hx-post="${action}"
        hx-target="#users-table-container"
        hx-swap="outerHTML"
        class="space-y-4 mt-4"
      >
        <div class="space-y-1.5">
          <label class="text-xs font-medium">Nama Lengkap</label>
          <input type="text" name="name" required value="${user?.name || ''}" placeholder="Nama lengkap" class="sh-input" />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-medium">Email</label>
          <input type="email" name="email" required value="${user?.email || ''}" placeholder="email@domain.com" class="sh-input" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label class="text-xs font-medium">Role</label>
            <select name="role" class="sh-select">
              <option value="user" ${user?.role === 'user' ? 'selected' : ''}>User</option>
              <option value="staff" ${user?.role === 'staff' ? 'selected' : ''}>Staff</option>
              <option value="admin" ${user?.role === 'admin' ? 'selected' : ''}>Admin</option>
            </select>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-medium">Status</label>
            <select name="status" class="sh-select">
              <option value="active" ${user?.status !== 'inactive' ? 'selected' : ''}>Active</option>
              <option value="inactive" ${user?.status === 'inactive' ? 'selected' : ''}>Inactive</option>
            </select>
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-medium">
            Password ${isEdit ? html`<span class="text-[hsl(var(--muted-foreground))]">(Kosongkan jika tidak diubah)</span>` : ''}
          </label>
          <input type="password" name="password" ${isEdit ? '' : 'required'} placeholder="••••••••" class="sh-input" />
        </div>

        <div class="flex items-center justify-end gap-2 pt-4 border-t border-[hsl(var(--border))]">
          <button type="button" @click="$dispatch('shadcn-modal-close')" class="sh-btn sh-btn-outline">
            Batal
          </button>
          <button type="submit" class="sh-btn sh-btn-default">
            Simpan
          </button>
        </div>
      </form>
    </div>
  `;
}

function UsersPage({ c, users, search = '', role = '' }) {
  const url = c.get('url');

  return AdminLayout({
    c,
    title: 'Manajemen Pengguna',
    activeMenu: 'users',
    children: html`
      ${Card({
        title: 'Daftar Pengguna',
        description: 'Kelola akun pengguna, hak akses role, dan status aktif.',
        actions: html`
          <button
            hx-get="${url('/admin/users/new')}"
            hx-target="#modal-content"
            @click="$dispatch('shadcn-modal-open')"
            class="sh-btn sh-btn-default"
          >
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>Tambah Pengguna</span>
          </button>
        `,
        children: html`
          <!-- Filter & Search Bar -->
          <div class="flex flex-col sm:flex-row gap-3 mb-6">
            <div class="relative flex-1">
              <input
                type="search"
                name="search"
                value="${search}"
                placeholder="Cari nama atau email..."
                hx-get="${url('/admin/users')}"
                hx-trigger="keyup changed delay:250ms, search"
                hx-target="#users-table-container"
                hx-include="[name='role']"
                class="sh-input"
              />
            </div>
            <div class="w-full sm:w-44">
              <select
                name="role"
                hx-get="${url('/admin/users')}"
                hx-trigger="change"
                hx-target="#users-table-container"
                hx-include="[name='search']"
                class="sh-select"
              >
                <option value="">Semua Role</option>
                <option value="admin" ${role === 'admin' ? 'selected' : ''}>Admin</option>
                <option value="staff" ${role === 'staff' ? 'selected' : ''}>Staff</option>
                <option value="user" ${role === 'user' ? 'selected' : ''}>User</option>
              </select>
            </div>
          </div>

          ${UsersTablePartial({ c, users, search, role })}
        `,
      })}
    `,
  });
}

module.exports = { UsersPage, UsersTablePartial, UserFormModal };
