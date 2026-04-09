import { createRouter, createWebHistory } from 'vue-router'
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
    },
    {
      path: '/customers',
      name: 'customers',
      component: Customers
    },
    {
      path: '/customers/:id',
      name: 'customer-detail',
      component: CustomerDetail
    },
    {
      path: '/tracking',
      name: 'tracking',
      component: CustomerTracking
    },
    {
      path: '/websites',
      name: 'websites',
      component: Websites
    }
  ]
})

export default router
