function normalizePrefix(raw) {
  if (!raw) return '';
  const trimmed = String(raw).trim().replace(/\/+$/, '');
  if (!trimmed || trimmed === '/') return '';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

async function proxyPrefixMiddleware(c, next) {
  const prefix = normalizePrefix(c.req.header('x-forwarded-prefix'));
  c.set('basePath', prefix);
  c.set('url', (targetPath = '/') => {
    const clean = String(targetPath || '/');
    if (/^https?:\/\//i.test(clean)) return clean;
    const normalized = clean.startsWith('/') ? clean : `/${clean}`;
    return `${prefix}${normalized}` || '/';
  });
  await next();
}

module.exports = { proxyPrefixMiddleware, normalizePrefix };
