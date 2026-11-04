import { ref, onMounted } from 'vue';
import { useAuth } from '../lib/auth.js';
import { useToast } from '../lib/toast.js';
import { api } from '../lib/api.js';
import { AppLayout } from '../components/AppLayout.js';
import { Icon } from '../components/Icon.js';
import { Card, Alert } from '../components/ui.js';

export const SettingsPage = {
  name: 'SettingsPage',
  components: { AppLayout, Icon, Card, Alert },
  setup() {
    const { isAdmin } = useAuth();
    const { toast } = useToast();

    const loading = ref(true);
    const saving = ref(false);
    const formError = ref('');
    const form = ref({
      site_name: '',
      site_description: '',
      support_email: '',
    });

    async function loadSettings() {
      loading.value = true;
      try {
        const res = await api.get('api/settings');
        if (res) {
          form.value.site_name = res.site_name || '';
          form.value.site_description = res.site_description || '';
          form.value.support_email = res.support_email || '';
        }
      } catch (err) {
        toast('Gagal memuat pengaturan', { description: err.message, variant: 'destructive' });
      } finally {
        loading.value = false;
      }
    }

    async function handleSave() {
      if (!isAdmin.value) return;
      formError.value = '';
      saving.value = true;
      try {
        await api.put('api/settings', form.value);
        toast('Pengaturan Disimpan', { description: 'Konfigurasi sistem berhasil diperbarui.', variant: 'success' });
      } catch (err) {
        formError.value = err.message || 'Gagal menyimpan pengaturan.';
      } finally {
        saving.value = false;
      }
    }

    onMounted(loadSettings);

    return {
      isAdmin,
      loading,
      saving,
      formError,
      form,
      handleSave,
    };
  },
  template: `
    <AppLayout title="Pengaturan Sistem">
      <div class="max-w-3xl space-y-6">
        <Alert
          v-if="!isAdmin"
          title="Mode Hanya Baca"
          description="Hanya administrator yang dapat mengubah pengaturan sistem aplikasi."
          variant="default"
        />

        <Alert v-if="formError" title="Gagal Menyimpan" :description="formError" variant="destructive" />

        <Card
          title="Informasi Umum"
          description="Atur identitas aplikasi dan kontak utama."
        >
          <div v-if="loading" class="py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
            Memuat pengaturan...
          </div>
          <form v-else @submit.prevent="handleSave" class="space-y-4">
            <div class="space-y-1.5">
              <label class="text-xs font-medium">Nama Aplikasi / Organisasi</label>
              <input
                v-model="form.site_name"
                type="text"
                required
                :disabled="!isAdmin"
                class="sh-input disabled:opacity-60"
              />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-medium">Deskripsi Singkat</label>
              <textarea
                v-model="form.site_description"
                rows="3"
                :disabled="!isAdmin"
                class="sh-textarea disabled:opacity-60"
              ></textarea>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-medium">Email Support</label>
              <input
                v-model="form.support_email"
                type="email"
                :disabled="!isAdmin"
                class="sh-input disabled:opacity-60"
              />
            </div>

            <div v-if="isAdmin" class="pt-3 flex justify-end">
              <button
                type="submit"
                :disabled="saving"
                class="sh-btn sh-btn-default"
              >
                <Icon name="save" class="w-4 h-4" />
                <span>{{ saving ? 'Menyimpan...' : 'Simpan Pengaturan' }}</span>
              </button>
            </div>
          </form>
        </Card>
      </div>
    </AppLayout>
  `,
};
