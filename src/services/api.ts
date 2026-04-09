/**
 * Simulation d'une API pour la connexion future à une base de données.
 * Vous pourrez remplacer ces fonctions par des appels réels (ex: fetch, axios, Supabase, Firebase)
 */

export const api = {
  // Gestion des ventes
  getSales: async () => {
    // return await fetch('/api/sales').then(r => r.json())
    return [
      { id: 'TX1234', customer: 'Jean Dupont', product: 'Logiciel CRM', amount: '1,200.00 €', status: 'Payé', date: 'il y a 2h' },
      // ...
    ]
  },

  // Gestion des projets
  getProjects: async () => {
    // return await fetch('/api/projects').then(r => r.json())
    return [
      { id: 1, name: 'Migration Serveur Cloud', client: 'TechNova', status: 'En cours', progress: 65 },
      // ...
    ]
  },

  // Gestion des clients
  getCustomers: async () => {
    // return await fetch('/api/customers').then(r => r.json())
    return [
      { id: 1, name: 'Jean Dupont', email: 'jean.dupont@email.com', status: 'Actif' },
      // ...
    ]
  },

  // Création d'une vente
  createSale: async (saleData: any) => {
    console.log('Enregistrement de la vente dans la base de données...', saleData)
    // return await fetch('/api/sales', { method: 'POST', body: JSON.stringify(saleData) })
    return { success: true }
  }
}
