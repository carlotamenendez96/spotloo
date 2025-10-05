import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import './style.css'
import App from './App.vue'
import MapView from './views/MapView.vue'
import RankingView from './views/RankingView.vue'
import { authGuard } from './router/guards.js'

// Router configuration
const routes = [
  {
    path: '/',
    name: 'MapView',
    component: MapView,
    meta: { requiresAuth: false }
  },
  {
    path: '/ranking',
    name: 'RankingView',
    component: RankingView,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Add route guards
router.beforeEach(authGuard)

// Create Vue app
const app = createApp(App)
app.use(router)
app.mount('#app')
