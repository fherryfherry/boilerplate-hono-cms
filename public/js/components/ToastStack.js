import { useToast } from '../lib/toast.js';

export const ToastStack = {
  name: 'ToastStack',
  setup() {
    const { toasts, remove } = useToast();
    return { toasts, remove };
  },
  template: `
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none px-4 sm:px-0">
      <transition-group
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="transform translate-y-2 opacity-0"
        enter-to-class="transform translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-for="t in toasts"
          :key="t.id"
          class="sh-card p-4 shadow-lg pointer-events-auto flex items-start justify-between gap-3 border-l-4"
          :class="t.variant === 'destructive' ? 'border-l-red-500' : t.variant === 'success' ? 'border-l-emerald-500' : 'border-l-[hsl(var(--primary))]'"
        >
          <div class="min-w-0 flex-1">
            <div class="text-sm font-semibold">{{ t.title }}</div>
            <div v-if="t.description" class="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 whitespace-pre-wrap">{{ t.description }}</div>
          </div>
          <button
            type="button"
            @click="remove(t.id)"
            class="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors shrink-0"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      </transition-group>
    </div>
  `,
};
