import { createApp, h } from 'vue';
import { createRouter, createWebHashHistory } from 'vue-router';
import { useAuth } from './lib/auth.js';
import { useTheme } from './lib/theme.js';
import { ToastStack } from './components/ToastStack.js';
import { HomePage } from './pages/HomePage.js';
import { LoginPage } from './pages/LoginPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { UsersPage } from './pages/UsersPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { NotFoundPage } from './pages/NotFoundPage.js';

const routes = [
  { path: '/', component: HomePage },
  { path: '/login', component: LoginPage, meta: { guestOnly: true } },
  { path: '/register', component: LoginPage, meta: { guestOnly: true } },
  { path: '/admin', component: DashboardPage, meta: { requiresAuth: true } },
  { path: '/admin/users', component: UsersPage, meta: { requiresAuth: true, requiresRole: 'admin' } },
  { path: '/admin/settings', component: SettingsPage, meta: { requiresAuth: true } },
  { path: '/:pathMatch(.*)*', component: NotFoundPage },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

router.beforeEach(async (to, from, next) => {
  const { isAuthenticated, user, fetchMe } = useAuth();

  // If token exists but user info isn't cached, try fetching profile once
  if (isAuthenticated.value && !user.value) {
    await fetchMe();
  }

  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return next({ path: '/login', query: { redirect: to.fullPath } });
  }

  if (to.meta.guestOnly && isAuthenticated.value) {
    return next('/admin');
  }

  if (to.meta.requiresRole && user.value?.role !== to.meta.requiresRole) {
    return next('/admin');
  }

  next();
});

const App = {
  name: 'App',
  components: { ToastStack },
  setup() {
    const { apply } = useTheme();
    apply();
  },
  template: `
    <div class="min-h-screen">
      <router-view></router-view>
      <ToastStack />
    </div>
  `,
};

const app = createApp(App);
app.use(router);
app.mount('#app');
