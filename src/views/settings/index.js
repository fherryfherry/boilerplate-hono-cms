const { html } = require('hono/html');
const { AdminLayout } = require('../layout');
const { Card, Alert } = require('../components/ui');

function SettingsPage({ c, settings = {}, saved = false }) {
  const url = c.get('url');

  return AdminLayout({
    c,
    title: 'Pengaturan Sistem',
    activeMenu: 'settings',
    children: html`
      <div class="max-w-3xl space-y-6">
        ${saved
          ? Alert({
              title: 'Berhasil Disimpan',
              description: 'Konfigurasi sistem telah diperbarui.',
              variant: 'success',
            })
          : ''}

        ${Card({
          title: 'Informasi Umum',
          description: 'Atur identitas aplikasi dan kontak utama.',
          children: html`
            <form method="POST" action="${url('/admin/settings')}" class="space-y-4">
              <div class="space-y-1.5">
                <label class="text-xs font-medium">Nama Aplikasi / Organisasi</label>
                <input
                  type="text"
                  name="site_name"
                  value="${settings.site_name || ''}"
                  class="sh-input"
                  required
                />
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-medium">Deskripsi Singkat</label>
                <textarea
                  name="site_description"
                  rows="3"
                  class="sh-textarea"
                >${settings.site_description || ''}</textarea>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-medium">Email Support</label>
                <input
                  type="email"
                  name="support_email"
                  value="${settings.support_email || ''}"
                  class="sh-input"
                />
              </div>

              <div class="pt-3 flex justify-end">
                <button type="submit" class="sh-btn sh-btn-default">
                  <i data-lucide="save" class="w-4 h-4"></i>
                  <span>Simpan Pengaturan</span>
                </button>
              </div>
            </form>
          `,
        })}
      </div>
    `,
  });
}

module.exports = { SettingsPage };
