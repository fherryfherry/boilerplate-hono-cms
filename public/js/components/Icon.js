import { h } from 'vue';

function toPascalCase(str) {
  return String(str || '')
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

export const Icon = {
  name: 'Icon',
  props: {
    name: {
      type: String,
      required: true,
    },
    class: {
      type: String,
      default: 'w-4 h-4',
    },
  },
  render() {
    const pascal = toPascalCase(this.name);
    const iconDef = window.lucide?.[pascal] || window.lucide?.icons?.[pascal];
    if (!iconDef || !Array.isArray(iconDef)) {
      return h('span', { class: this.class });
    }
    const children = iconDef.map(([tag, attrs]) => h(tag, attrs));
    return h(
      'svg',
      {
        xmlns: 'http://www.w3.org/2000/svg',
        width: 24,
        height: 24,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': 2,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        class: this.class,
      },
      children
    );
  },
};
