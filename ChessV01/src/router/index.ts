import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
// Importez vos nouvelles vues ici (ou utilisez le lazy-loading comme ci-dessous)

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/matches',
      name: 'matches',
      component: () => import('../views/MatchListView.vue')
    },
    // Ajoutez les autres routes ici (Game, Profile, etc.)
    {
      path: '/game',
      name: 'game',
      component: () => import('../views/GameView.vue') // Il faudra créer ce fichier
    }
  ]
})

export default router