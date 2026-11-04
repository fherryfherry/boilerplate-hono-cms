const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const envPath = path.resolve(process.cwd(), '.env');
const examplePath = path.resolve(process.cwd(), '.env.example');

if (!fs.existsSync(envPath) && fs.existsSync(examplePath)) {
  fs.copyFileSync(examplePath, envPath);
}

const key = 'base64:' + crypto.randomBytes(32).toString('base64');
let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

if (/^APP_KEY=/m.test(content)) {
  content = content.replace(/^APP_KEY=.*$/m, `APP_KEY=${key}`);
} else {
  content = `${content.trim()}\nAPP_KEY=${key}\n`;
}

fs.writeFileSync(envPath, content, 'utf8');
console.log('Application key set successfully.');
