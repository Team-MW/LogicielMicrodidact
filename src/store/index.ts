import { reactive } from 'vue'

// Simulations de données initiales
const initialCustomers = [
  { id: 1, name: 'Jean Dupont', email: 'jean.dupont@email.com', phone: '+33 6 12 34 56 78', totalSpent: '1,450 €', status: 'Actif' },
  { id: 2, name: 'Marie Curie', email: 'm.curie@science.fr', phone: '+33 6 98 76 54 32', totalSpent: '450 €', status: 'Inactif' },
  { id: 3, name: 'Pierre Martin', email: 'pierre.martin@pro.com', phone: '+33 7 11 22 33 44', totalSpent: '2,800 €', status: 'Actif' },
  { id: 4, name: 'Sophie Lefebvre', email: 'sophie.l@design.com', phone: '+33 6 55 44 33 22', totalSpent: '900 €', status: 'Actif' },
  { id: 5, name: 'Thomas Bernard', email: 't.bernard@tech.io', phone: '+33 6 12 34 88 99', totalSpent: '12,400 €', status: 'VIP' },
]

const initialTracking = [
  { id: 1, customerId: 1, type: 'Appel', date: '2024-03-20', notes: 'Prise de contact pour nouveau projet', agent: 'Alice' },
  { id: 2, customerId: 3, type: 'Email', date: '2024-03-21', notes: 'Envoi devis maintenance', agent: 'Bob' },
  { id: 3, customerId: 5, type: 'Réunion', date: '2024-03-22', notes: 'Validation maquettes site web', agent: 'Alice' },
]

const initialWebsites = [
  { 
    id: 1, 
    name: 'Portfolio Jean', 
    url: 'https://jeandupont.fr', 
    customerId: 1, 
    status: 'En ligne',
    stats: { sessions: 1250, bounceRate: '45%', avgDuration: '2:30' }
  },
  { 
    id: 2, 
    name: 'Shop Science', 
    url: 'https://mcurie-shop.com', 
    customerId: 2, 
    status: 'Maintenance',
    stats: { sessions: 850, bounceRate: '52%', avgDuration: '1:45' }
  },
  { 
    id: 3, 
    name: 'Tech Blog', 
    url: 'https://bernard-tech.io', 
    customerId: 5, 
    status: 'En ligne',
    stats: { sessions: 15400, bounceRate: '38%', avgDuration: '3:15' }
  },
]

const initialPayments = [
  { id: 101, customerId: 1, amount: '150.00 €', status: 'Payé', date: '2024-03-01', method: 'Carte Bleue' },
  { id: 102, customerId: 1, amount: '49.99 €', status: 'Payé', date: '2024-03-15', method: 'Virement' },
  { id: 103, customerId: 5, amount: '1,200.00 €', status: 'Payé', date: '2024-03-20', method: 'Stripe' },
  { id: 104, customerId: 3, amount: '250.00 €', status: 'En attente', date: '2024-04-05', method: 'Prélèvement' },
]

const initialSubscriptions = [
  { id: 1, customerId: 1, name: 'Maintenance Mensuelle', amount: '49.99 €', frequency: 'Mensuel', nextBilling: '2024-04-15', status: 'Actif' },
  { id: 2, customerId: 5, name: 'Hébergement Platinum', amount: '199.00 €', frequency: 'Mensuel', nextBilling: '2024-04-22', status: 'Actif' },
  { id: 3, customerId: 2, name: 'Pack SEO', amount: '75.00 €', frequency: 'Mensuel', nextBilling: '2024-04-10', status: 'Suspendu' },
]

// State global réactif
export const store = reactive({
  customers: [...initialCustomers],
  tracking: [...initialTracking],
  websites: [...initialWebsites],
  payments: [...initialPayments],
  subscriptions: [...initialSubscriptions],

  // Actions
  addCustomer(customer: any) {
    const newId = this.customers.length > 0 ? Math.max(...this.customers.map(c => c.id)) + 1 : 1
    this.customers.push({
      id: newId,
      totalSpent: '0 €',
      status: 'Actif',
      ...customer
    })
  },

  deleteCustomer(id: number) {
    this.customers = this.customers.filter(c => c.id !== id)
  },

  addTracking(entry: any) {
    const newId = this.tracking.length > 0 ? Math.max(...this.tracking.map(t => t.id)) + 1 : 1
    this.tracking.push({
      id: newId,
      date: new Date().toISOString().split('T')[0],
      ...entry
    })
  },

  addWebsite(site: any) {
    const newId = this.websites.length > 0 ? Math.max(...this.websites.map(s => s.id)) + 1 : 1
    this.websites.push({
      id: newId,
      status: 'En ligne',
      stats: { sessions: 0, bounceRate: '0%', avgDuration: '0:00' },
      ...site
    })
  },

  addSubscription(sub: any) {
    const newId = this.subscriptions.length > 0 ? Math.max(...this.subscriptions.map(s => s.id)) + 1 : 1
    this.subscriptions.push({ id: newId, status: 'Actif', ...sub })
  }
})
