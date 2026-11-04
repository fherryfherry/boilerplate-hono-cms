import { ref, watch, onMounted } from 'vue';
import { useAuth } from '../lib/auth.js';
import { useToast } from '../lib/toast.js';
import { api } from '../lib/api.js';
import { AppLayout } from '../components/AppLayout.js';
import { Icon } from '../components/Icon.js';
import { Modal } from '../components/Modal.js';
import { Card, Badge, Alert, EmptyState } from '../components/ui.js';

export const UsersPage = {
  name: 'UsersPage',
  components: { AppLayout, Icon, Modal, Card, Badge, Alert, EmptyState },
  setup() {
    const { user: currentUser } = useAuth();
    const { toast } = useToast();

    const users = ref([]);
    const loading = ref(true);
    const search = ref('');
    const roleFilter = ref('');

    // Modal state
    const modalOpen = ref(false);
    const modalMode = ref('create'); // 'create' | 'edit'
    const editingId = ref(null);
    const form = ref({
      name: '',
      email: '',
      role: 'user',
      status: 'active',
      password: '',
    });
    const formError = ref('');
    const formLoading = ref(false);

    // Delete confirm modal state
    const deleteModalOpen = ref(false);
    const deletingUser = ref(null);
    const deleteLoading = ref(false);

    let searchTimer = null;

    async function loadUsers() {
      loading.value = true;
      try {
        const params = new URLSearchParams();
        if (search.value.trim()) params.set('search', search.value.trim());
        if (roleFilter.value) params.set('role', roleFilter.value);
        const query = params.toString() ? `?${params.toString()}` : '';
        const res = await api.get(`api/users${query}`);
        users.value = Array.isArray(res) ? res : [];
      } catch (err) {
        toast('Gagal memuat pengguna', { description: err.message, variant: 'destructive' });
      } finally {
        loading.value = false;
      }
    }

    watch([search, roleFilter], () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(loadUsers, 250);
    });

    onMounted(loadUsers);

    function openCreateModal() {
      modalMode.value = 'create';
      editingId.value = null;
      form.value = {
        name: '',
        email: '',
        role: 'user',
        status: 'active',
        password: '',
      };
      formError.value = '';
      modalOpen.value = true;
    }

    function openEditModal(user) {
      modalMode.value = 'edit';
      editingId.value = user.id;
      form.value = {
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        password: '',
      };
      formError.value = '';
      modalOpen.value = true;
    }

    async function handleSaveUser() {
      formError.value = '';
      formLoading.value = true;
      try {
        if (modalMode.value === 'create') {
          await api.post('api/users', form.value);
          toast('Pengguna Ditambahkan', { description: `${form.value.name} berhasil disimpan.`, variant: 'success' });
        } else {
          await api.put(`api/users/${editingId.value}`, form.value);
          toast('Perubahan Disimpan', { description: `Data ${form.value.name} berhasil diperbarui.`, variant: 'success' });
        }
        modalOpen.value = false;
        await loadUsers();
      } catch (err) {
        formError.value = err.message || 'Gagal menyimpan pengguna.';
      } finally {
        formLoading.value = false;
      }
    }

    function confirmDelete(user) {
      deletingUser.value = user;
      deleteModalOpen.value = true;
    }

    async function handleDeleteUser() {
      if (!deletingUser.value) return;
      deleteLoading.value = true;
      try {
        await api.delete(`api/users/${deletingUser.value.id}`);
        toast('Pengguna Dihapus', { description: `${deletingUser.value.name} telah dihapus.` });
        deleteModalOpen.value = false;
        await loadUsers();
      } catch (err) {
        toast('Gagal menghapus pengguna', { description: err.message, variant: 'destructive' });
      } finally {
        deleteLoading.value = false;
      }
    }

    return {
      currentUser,
      users,
      loading,
      search,
      roleFilter,
      modalOpen,
      modalMode,
      form,
      formError,
      formLoading,
      openCreateModal,
      openEditModal,
      handleSaveUser,
      deleteModalOpen,
      deletingUser,
      deleteLoading,
      confirmDelete,
      handleDeleteUser,
    };
  },
  template: `
    <AppLayout title="Manajemen Pengguna">
      <Card
        title="Daftar Pengguna"
        description="Kelola akun pengguna, hak akses role, dan status aktif."
      >
        <template #actions>
          <button
            type="button"
            @click="openCreateModal"
            class="sh-btn sh-btn-default"
          >
            <Icon name="plus" class="w-4 h-4" />
            <span>Tambah Pengguna</span>
          </button>
        </template>

        <!-- Filter & Search Bar -->
        <div class="flex flex-col sm:flex-row gap-3 mb-6">
          <div class="relative flex-1">
            <input
              v-model="search"
              type="search"
              placeholder="Cari nama atau email..."
              class="sh-input"
            />
          </div>
          <div class="w-full sm:w-44">
            <select v-model="roleFilter" class="sh-select">
              <option value="">Semua Role</option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
              <option value="user">User</option>
            </select>
          </div>
        </div>

        <div v-if="loading" class="py-12 text-center text-sm text-[hsl(var(--muted-foreground))]">
          Memuat data pengguna...
        </div>

        <EmptyState
          v-else-if="users.length === 0"
          icon="users"
          title="Tidak ada pengguna ditemukan"
          :description="search || roleFilter ? 'Coba ubah kata kunci pencarian atau filter role.' : 'Tambahkan pengguna pertama Anda.'"
        />

        <div v-else class="overflow-x-auto -mx-6 -my-2">
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
              <tr
                v-for="u in users"
                :key="u.id"
                class="hover:bg-[hsl(var(--muted))/0.4] transition-colors"
              >
                <td class="py-3.5 px-6">
                  <div class="font-medium">{{ u.name }}</div>
                  <div class="text-xs text-[hsl(var(--muted-foreground))]">{{ u.email }}</div>
                </td>
                <td class="py-3.5 px-6">
                  <Badge :variant="u.role === 'admin' ? 'default' : 'secondary'">
                    {{ u.role }}
                  </Badge>
                </td>
                <td class="py-3.5 px-6">
                  <Badge :variant="u.status === 'active' ? 'success' : 'warning'">
                    {{ u.status }}
                  </Badge>
                </td>
                <td class="py-3.5 px-6 text-xs text-[hsl(var(--muted-foreground))]">
                  {{ String(u.created_at || '').slice(0, 10) }}
                </td>
                <td class="py-3.5 px-6 text-right">
                  <div class="inline-flex items-center gap-1">
                    <button
                      type="button"
                      @click="openEditModal(u)"
                      class="sh-btn sh-btn-ghost sh-btn-sm"
                      title="Edit"
                    >
                      <Icon name="pencil" class="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      :disabled="String(u.id) === String(currentUser?.id)"
                      @click="confirmDelete(u)"
                      class="sh-btn sh-btn-ghost sh-btn-sm text-red-500 hover:bg-red-500/10 disabled:opacity-40"
                      title="Hapus"
                    >
                      <Icon name="trash-2" class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <!-- Modal Create / Edit User -->
      <Modal v-model:open="modalOpen">
        <div class="p-6">
          <div class="flex items-center justify-between pb-4 border-b border-[hsl(var(--border))]">
            <div>
              <h3 class="text-base font-semibold">
                {{ modalMode === 'edit' ? 'Edit Pengguna' : 'Tambah Pengguna Baru' }}
              </h3>
              <p class="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                {{ modalMode === 'edit' ? 'Perbarui informasi akun pengguna di bawah ini.' : 'Isi detail untuk membuat akun baru.' }}
              </p>
            </div>
            <button
              type="button"
              @click="modalOpen = false"
              class="sh-btn sh-btn-ghost sh-btn-sm"
            >
              <Icon name="x" class="w-4 h-4" />
            </button>
          </div>

          <form @submit.prevent="handleSaveUser" class="space-y-4 mt-4">
            <Alert v-if="formError" title="Gagal Menyimpan" :description="formError" variant="destructive" />

            <div class="space-y-1.5">
              <label class="text-xs font-medium">Nama Lengkap</label>
              <input
                v-model="form.name"
                type="text"
                required
                placeholder="Nama lengkap"
                class="sh-input"
              />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-medium">Email</label>
              <input
                v-model="form.email"
                type="email"
                required
                placeholder="nama@perusahaan.com"
                class="sh-input"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1.5">
                <label class="text-xs font-medium">Role</label>
                <select v-model="form.role" class="sh-select">
                  <option value="user">User</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-medium">Status</label>
                <select v-model="form.status" class="sh-select">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-medium">
                Password
                <span v-if="modalMode === 'edit'" class="text-[hsl(var(--muted-foreground))]">
                  (Kosongkan jika tidak diubah)
                </span>
              </label>
              <input
                v-model="form.password"
                type="password"
                :required="modalMode === 'create'"
                placeholder="••••••••"
                class="sh-input"
              />
            </div>

            <div class="flex items-center justify-end gap-2 pt-4 border-t border-[hsl(var(--border))]">
              <button
                type="button"
                @click="modalOpen = false"
                class="sh-btn sh-btn-outline"
              >
                Batal
              </button>
              <button
                type="submit"
                :disabled="formLoading"
                class="sh-btn sh-btn-default"
              >
                {{ formLoading ? 'Menyimpan...' : 'Simpan' }}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      <!-- Delete Confirmation Modal -->
      <Modal v-model:open="deleteModalOpen" maxWidth="max-w-md">
        <div class="p-6">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
              <Icon name="trash-2" class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base font-semibold">Hapus Pengguna</h3>
              <p class="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                Apakah Anda yakin ingin menghapus akun <strong>{{ deletingUser?.name }}</strong> ({{ deletingUser?.email }})?
              </p>
            </div>
          </div>
          <div class="flex items-center justify-end gap-2 pt-6 mt-4 border-t border-[hsl(var(--border))]">
            <button
              type="button"
              @click="deleteModalOpen = false"
              class="sh-btn sh-btn-outline"
            >
              Batal
            </button>
            <button
              type="button"
              :disabled="deleteLoading"
              @click="handleDeleteUser"
              class="sh-btn sh-btn-destructive"
            >
              {{ deleteLoading ? 'Menghapus...' : 'Ya, Hapus' }}
            </button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  `,
};
