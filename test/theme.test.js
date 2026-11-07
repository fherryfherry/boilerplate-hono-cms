const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
const startup = html.match(/<script>\s*([\s\S]*?)\s*<\/script>/)[1];
const theme = fs.readFileSync(path.join(root, 'public/js/lib/theme.js'), 'utf8')
  .replace("import { ref } from 'vue';", '')
  .replace('export function useTheme()', 'function useTheme()');

for (const [saved, expected] of [[null, false], ['light', false], ['dark', true], ['invalid', false]]) {
  test(`theme initialization and toggle for ${saved}`, () => {
    let value = saved;
    const classes = new Set();
    const context = {
      localStorage: { getItem: () => value, setItem: (_, next) => { value = next; } },
      document: { documentElement: { classList: { add: name => classes.add(name), remove: name => classes.delete(name) } } },
      ref: initial => ({ value: initial }),
    };
    vm.createContext(context);
    vm.runInContext(startup, context);
    assert.equal(classes.has('dark'), expected);
    vm.runInContext(theme, context);
    const instance = vm.runInContext('useTheme()', context);
    assert.equal(instance.isDark.value, expected);
    instance.apply();
    assert.equal(classes.has('dark'), expected);
    instance.toggle();
    assert.equal(classes.has('dark'), !expected);
    assert.equal(value, expected ? 'light' : 'dark');
    instance.toggle();
    assert.equal(classes.has('dark'), expected);
  });
}
