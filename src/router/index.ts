import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/views/Dashboard.vue'
import POS from '@/views/POS.vue'
import Projects from '@/views/Projects.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: Dashboard
    },
    {
      path: '/pos',
      name: 'pos',
      component: POS
    },
    {
      path: '/projects',
      name: 'projects',
      component: Projects
    }
  ]
})

export default router
