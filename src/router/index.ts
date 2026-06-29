import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/views/Dashboard.vue'
import POS from '@/views/POS.vue'
import Projects from '@/views/Projects.vue'
import SoftwareProjects from '@/views/SoftwareProjects.vue'
import Customers from '@/views/Customers.vue'
import CustomerDetail from '@/views/CustomerDetail.vue'
import CustomerTracking from '@/views/CustomerTracking.vue'
import Installers from '@/views/Installers.vue'
import Calendar from '@/views/Calendar.vue'
import Login from '@/views/Login.vue'
import Domains from '@/views/Domains.vue'
import InstallerField from '@/views/InstallerField.vue'
import InstallerReport from '@/views/InstallerReport.vue'
import CommercialTasks from '@/views/CommercialTasks.vue'
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: Login,
      meta: { layout: 'empty' } // Layout vide pour la page de login
    },
    {
      path: '/',
      name: 'home',
      component: Dashboard,
      meta: { layout: 'admin' }
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
      path: '/software',
      name: 'software',
      component: SoftwareProjects,
      meta: { layout: 'admin' }
    },
    {
      path: '/calendar',
      name: 'calendar',
      component: Calendar,
      meta: { layout: 'admin' }
    },
    {
      path: '/installers',
      name: 'installers',
      component: Installers,
      meta: { layout: 'admin' }
    },
    {
      path: '/installer',
      name: 'installer-field',
      component: InstallerField,
      meta: { layout: 'empty' }
    },
    {
      path: '/installer/report/:id',
      name: 'installer-report',
      component: InstallerReport,
      meta: { layout: 'empty' }
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
      path: '/domains',
      name: 'domains',
      component: Domains,
      meta: { layout: 'admin' }
    },
    {
      path: '/commercial',
      name: 'commercial',
      component: CommercialTasks,
      meta: { layout: 'admin' }
    }
  ]
})

// Route Guard pour demander le code
router.beforeEach((to, _from, next) => {
  const isAuthenticated = sessionStorage.getItem('md_auth') === 'true'
  const role = sessionStorage.getItem('md_role') || 'admin'
  
  if (to.name !== 'login' && !isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (isAuthenticated && role === 'poseur' && !to.path.startsWith('/installer') && to.name !== 'login') {
    // Si connecté en tant que poseur mais essaie d'accéder à l'admin, rediriger vers l'espace poseur
    next({ name: 'installer-field' })
  } else {
    next()
  }
})

export default router
