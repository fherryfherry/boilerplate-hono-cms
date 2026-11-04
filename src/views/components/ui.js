const { html } = require('hono/html');

function Badge({ children, variant = 'default', className = '' }) {
  return html`<span class="sh-badge sh-badge-${variant} ${className}">${children}</span>`;
}

function Card({ title = '', description = '', actions = '', children, className = '' }) {
  return html`
    <div class="sh-card ${className}">
      ${title || description || actions
        ? html`
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-6 pb-4 border-b border-[hsl(var(--border))]">
              <div>
                ${title ? html`<h3 class="text-base font-semibold tracking-tight">${title}</h3>` : ''}
                ${description ? html`<p class="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">${description}</p>` : ''}
              </div>
              ${actions ? html`<div class="flex items-center gap-2">${actions}</div>` : ''}
            </div>
          `
        : ''}
      <div class="p-6">${children}</div>
    </div>
  `;
}

function StatCard({ label, value, trend = '', icon = 'activity' }) {
  return html`
    <div class="sh-card p-6">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-[hsl(var(--muted-foreground))]">${label}</span>
        <div class="h-8 w-8 rounded-md bg-[hsl(var(--secondary))] flex items-center justify-center text-[hsl(var(--muted-foreground))]">
          <i data-lucide="${icon}" class="w-4 h-4"></i>
        </div>
      </div>
      <div class="mt-3 flex items-baseline justify-between">
        <div class="text-2xl font-bold tracking-tight">${value}</div>
        ${trend ? html`<span class="text-xs font-medium text-emerald-500">${trend}</span>` : ''}
      </div>
    </div>
  `;
}

function Alert({ title, description, variant = 'default' }) {
  const styles =
    variant === 'destructive'
      ? 'border-red-500/40 bg-red-500/10 text-red-500'
      : variant === 'success'
      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500'
      : 'border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))]';

  return html`
    <div class="rounded-lg border p-4 text-sm ${styles}" role="alert">
      ${title ? html`<div class="font-semibold mb-1">${title}</div>` : ''}
      ${description ? html`<div class="opacity-90">${description}</div>` : ''}
    </div>
  `;
}

function EmptyState({ icon = 'inbox', title = 'Belum ada data', description = '', action = '' }) {
  return html`
    <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div class="h-12 w-12 rounded-full bg-[hsl(var(--secondary))] flex items-center justify-center text-[hsl(var(--muted-foreground))] mb-3">
        <i data-lucide="${icon}" class="w-6 h-6"></i>
      </div>
      <h4 class="text-sm font-semibold">${title}</h4>
      ${description ? html`<p class="text-xs text-[hsl(var(--muted-foreground))] mt-1 max-w-sm">${description}</p>` : ''}
      ${action ? html`<div class="mt-4">${action}</div>` : ''}
    </div>
  `;
}

module.exports = {
  Badge,
  Card,
  StatCard,
  Alert,
  EmptyState,
};
