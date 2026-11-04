import { ref } from 'vue';

const toasts = ref([]);

export function useToast() {
  function toast(title, { description = '', variant = 'default', duration = 3500 } = {}) {
    const id = Date.now() + Math.random();
    const item = { id, title, description, variant };
    toasts.value.push(item);

    if (duration > 0) {
      setTimeout(() => {
        remove(id);
      }, duration);
    }
  }

  function remove(id) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  return { toasts, toast, remove };
}
