import { store } from '@/store'

export const api = {
  // Gestion des ventes
  getSales: async () => {
    return [
      { id: 'TX1234', customer: 'Jean Dupont', product: 'Logiciel CRM', amount: '1,200.00 €', status: 'Payé', date: 'il y a 2h' },
    ]
  },

  // Gestion des projets
  getProjects: async () => {
    return [
      { id: 1, name: 'Migration Serveur Cloud', client: 'TechNova', status: 'En cours', progress: 65 },
    ]
  },

  // Gestion des clients
  getCustomers: async () => {
    return store.customers
  },

  createCustomer: async (customerData: any) => {
    store.addCustomer(customerData)
    return { success: true }
  },

  // Suivis internes
  getTracking: async () => {
    return store.tracking
  },

  createTracking: async (trackingData: any) => {
    store.addTracking(trackingData)
    return { success: true }
  },

  // Gestion des sites web
  getWebsites: async () => {
    return store.websites
  },

  createWebsite: async (siteData: any) => {
    store.addWebsite(siteData)
    return { success: true }
  },

  // Gestion des paiements
  getPayments: async () => {
    return store.payments
  },

  // Gestion des abonnements
  getSubscriptions: async () => {
    return store.subscriptions
  },

  // Création d'une vente
  createSale: async (saleData: any) => {
    console.log('Enregistrement de la vente...', saleData)
    return { success: true }
  }
}
