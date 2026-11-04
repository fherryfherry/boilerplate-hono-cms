import { onMounted, onUnmounted } from 'vue';

export const Modal = {
  name: 'Modal',
  props: {
    open: {
      type: Boolean,
      default: false,
    },
    maxWidth: {
      type: String,
      default: 'max-w-lg',
    },
  },
  emits: ['update:open', 'close'],
  setup(props, { emit }) {
    function close() {
      emit('update:open', false);
      emit('close');
    }

    function onKeydown(e) {
      if (e.key === 'Escape' && props.open) {
        close();
      }
    }

    onMounted(() => window.addEventListener('keydown', onKeydown));
    onUnmounted(() => window.removeEventListener('keydown', onKeydown));

    return { close };
  },
  template: `
    <teleport to="body">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        @click.self="close"
      >
        <div
          class="sh-card w-full overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-150"
          :class="maxWidth"
        >
          <slot></slot>
        </div>
      </div>
    </teleport>
  `,
};
