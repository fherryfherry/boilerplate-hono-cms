export class ApiError extends Error {
  constructor(status, message, code = 'ERROR', fields = undefined) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields || {};
  }
}

export async function request(path, options = {}) {
  const token = localStorage.getItem('tnpg_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Remove leading slash so browser resolves relative to <base href>
  const cleanPath = String(path).replace(/^\/+/, '');

  let res;
  try {
    res = await fetch(cleanPath, {
      ...options,
      headers,
    });
  } catch (netErr) {
    throw new ApiError(0, 'Gagal terhubung ke server. Periksa koneksi internet Anda.', 'NETWORK_ERROR');
  }

  if (res.status === 204) {
    return null;
  }

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (_) {
    json = null;
  }

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('tnpg_token');
      localStorage.removeItem('tnpg_user');
      // If we are on an admin route, reload or redirect to login
      if (window.location.hash.startsWith('#/admin')) {
        window.location.hash = '#/login';
      }
    }
    const message = json?.error?.message || `Terjadi kesalahan (HTTP ${res.status})`;
    const code = json?.error?.code || 'ERROR';
    const fields = json?.error?.fields;
    throw new ApiError(res.status, message, code, fields);
  }

  return json?.data;
}

export const api = {
  get: (path, options) => request(path, { method: 'GET', ...options }),
  post: (path, body, options) => request(path, { method: 'POST', body: JSON.stringify(body || {}), ...options }),
  put: (path, body, options) => request(path, { method: 'PUT', body: JSON.stringify(body || {}), ...options }),
  delete: (path, options) => request(path, { method: 'DELETE', ...options }),
};
