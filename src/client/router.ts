import { createRouter, createWebHistory } from 'vue-router';
import SpatialShell from './components/SpatialShell.vue';
import StartPage from './pages/StartPage.vue';
import SessionDetailView from './pages/SessionDetailView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'shell',
      component: SpatialShell,
      children: [
        {
          path: '',
          name: 'home',
          component: StartPage,
        },
        {
          path: 'session/:id',
          name: 'session-detail',
          component: SessionDetailView,
        },
        {
          // Catch-all: redirect unknown paths to home
          path: ':pathMatch(.*)*',
          redirect: { name: 'home' },
        },
      ],
    },
  ],
});

export default router;
