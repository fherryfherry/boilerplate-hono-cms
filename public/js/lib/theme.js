import { ref } from 'vue';

const isDark = ref(localStorage.getItem('tnpg_theme') === 'dark');

export function useTheme() {
  function apply() {
    if (isDark.value) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('tnpg_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('tnpg_theme', 'light');
    }
  }

  function toggle() {
    isDark.value = !isDark.value;
    apply();
  }

  return { isDark, toggle, apply };
}
