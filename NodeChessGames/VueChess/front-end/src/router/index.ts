import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import MatchListView from '../views/MatchListView.vue'
import ProfileView from '../views/ProfilView.vue'
import ChessBoard from '../views/ChessBoard.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'login', component: LoginView },
    { path: '/register', name: 'register', component: RegisterView },
    { path: '/match-list', name: 'match-list', component: MatchListView, meta: { requiresAuth: true } },
    { path: '/game/:id', name: 'game', component: ChessBoard, meta: { requiresAuth: true } },
    { path: '/profile', name: 'profile', component: ProfileView, meta: { requiresAuth: true } },
  ],
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    next({ name: 'login' })
  } else {
    next()
  }
})

export default router
