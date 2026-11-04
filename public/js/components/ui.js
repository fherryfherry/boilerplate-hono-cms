import { Icon } from './Icon.js';

export const Badge = {
  name: 'Badge',
  props: {
    variant: {
      type: String,
      default: 'default', // default | secondary | success | warning | destructive | outline
    },
    className: {
      type: String,
      default: '',
    },
  },
  template: `
    <span :class="['sh-badge', 'sh-badge-' + variant, className]">
      <slot></slot>
    </span>
  `,
};

export const Card = {
  name: 'Card',
  props: {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    className: { type: String, default: '' },
  },
  template: `
    <div :class="['sh-card', className]">
      <div
        v-if="title || description || $slots.actions"
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-6 pb-4 border-b border-[hsl(var(--border))]"
      >
        <div>
          <h3 v-if="title" class="text-base font-semibold tracking-tight">{{ title }}</h3>
          <p v-if="description" class="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">{{ description }}</p>
        </div>
        <div v-if="$slots.actions" class="flex items-center gap-2">
          <slot name="actions"></slot>
        </div>
      </div>
      <div class="p-6">
        <slot></slot>
      </div>
    </div>
  `,
};

export const StatCard = {
  name: 'StatCard',
  components: { Icon },
  props: {
    label: { type: String, required: true },
    value: { type: [String, Number], required: true },
    trend: { type: String, default: '' },
    icon: { type: String, default: 'activity' },
  },
  template: `
    <div class="sh-card p-6">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-[hsl(var(--muted-foreground))]">{{ label }}</span>
        <div class="h-8 w-8 rounded-md bg-[hsl(var(--secondary))] flex items-center justify-center text-[hsl(var(--muted-foreground))]">
          <Icon :name="icon" class="w-4 h-4" />
        </div>
      </div>
      <div class="mt-3 flex items-baseline justify-between">
        <div class="text-2xl font-bold tracking-tight">{{ value }}</div>
        <span v-if="trend" class="text-xs font-medium text-emerald-500">{{ trend }}</span>
      </div>
    </div>
  `,
};

export const Alert = {
  name: 'Alert',
  props: {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    variant: {
      type: String,
      default: 'default', // default | success | destructive
    },
  },
  computed: {
    classes() {
      if (this.variant === 'destructive') {
        return 'border-red-500/40 bg-red-500/10 text-red-500';
      }
      if (this.variant === 'success') {
        return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500';
      }
      return 'border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))]';
    },
  },
  template: `
    <div :class="['rounded-lg border p-4 text-sm', classes]" role="alert">
      <div v-if="title" class="font-semibold mb-1">{{ title }}</div>
      <div v-if="description" class="opacity-90">{{ description }}</div>
      <slot></slot>
    </div>
  `,
};

export const EmptyState = {
  name: 'EmptyState',
  components: { Icon },
  props: {
    icon: { type: String, default: 'inbox' },
    title: { type: String, default: 'Belum ada data' },
    description: { type: String, default: '' },
  },
  template: `
    <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div class="h-12 w-12 rounded-full bg-[hsl(var(--secondary))] flex items-center justify-center text-[hsl(var(--muted-foreground))] mb-3">
        <Icon :name="icon" class="w-6 h-6" />
      </div>
      <h4 class="text-sm font-semibold">{{ title }}</h4>
      <p v-if="description" class="text-xs text-[hsl(var(--muted-foreground))] mt-1 max-w-sm">{{ description }}</p>
      <div v-if="$slots.action" class="mt-4">
        <slot name="action"></slot>
      </div>
    </div>
  `,
};
