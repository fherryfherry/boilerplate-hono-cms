import { ref, computed } from 'vue';
import { api } from './api.js';

let initialUser = null;
try {
  const stored = localStorage.getItem('tnpg_user');
  if (stored) initialUser = JSON.parse(stored);
} catch (_) {}

const user = ref(initialUser);
const token = ref(localStorage.getItem('tnpg_token') || null);

function setSession(newToken, newUser) {
  token.value = newToken;
  user.value = newUser;
  if (newToken) {
    localStorage.setItem('tnpg_token', newToken);
  } else {
    localStorage.removeItem('tnpg_token');
  }
  if (newUser) {
    localStorage.setItem('tnpg_user', JSON.stringify(newUser));
  } else {
    localStorage.removeItem('tnpg_user');
  }
}

export function useAuth() {
  const isAuthenticated = computed(() => Boolean(token.value));
  const isAdmin = computed(() => user.value?.role === 'admin');

  async function login(email, password) {
    const res = await api.post('api/auth/login', { email, password });
    setSession(res.token, res.user);
    return res.user;
  }

  async function register(name, email, password) {
    const res = await api.post('api/auth/register', { name, email, password });
    setSession(res.token, res.user);
    return res.user;
  }

  async function fetchMe() {
    if (!token.value) {
      setSession(null, null);
      return null;
    }
    try {
      const res = await api.get('api/auth/me');
      setSession(token.value, res.user);
      return res.user;
    } catch (_) {
      setSession(null, null);
      return null;
    }
  }

  async function logout() {
    try {
      if (token.value) {
        await api.post('api/auth/logout');
      }
    } catch (_) {
    } finally {
      setSession(null, null);
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    isAdmin,
    login,
    register,
    fetchMe,
    logout,
  };
}
