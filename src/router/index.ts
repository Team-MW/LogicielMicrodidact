import { createRouter, createWebHistory } from 'vue-router'
import Landing from '@/views/Landing.vue'
import Dashboard from '@/views/Dashboard.vue'
import POS from '@/views/POS.vue'
import Projects from '@/views/Projects.vue'
import Customers from '@/views/Customers.vue'
import CustomerDetail from '@/views/CustomerDetail.vue'
import CustomerTracking from '@/views/CustomerTracking.vue'
import Websites from '@/views/Websites.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: Landing,
      meta: { layout: 'public' }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: Dashboard,
      meta: { layout: 'admin' }
    },
    {
      path: '/pos',
      name: 'pos',
      component: POS,
      meta: { layout: 'admin' }
    },
    {
      path: '/projects',
      name: 'projects',
      component: Projects,
      meta: { layout: 'admin' }
    },
    {
      path: '/customers',
      name: 'customers',
      component: Customers,
      meta: { layout: 'admin' }
    },
    {
      path: '/customers/:id',
      name: 'customer-detail',
      component: CustomerDetail,
      meta: { layout: 'admin' }
    },
    {
      path: '/tracking',
      name: 'tracking',
      component: CustomerTracking,
      meta: { layout: 'admin' }
    },
    {
      path: '/websites',
      name: 'websites',
      component: Websites,
      meta: { layout: 'admin' }
    }
  ]
})

export default router
