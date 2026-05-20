import { supabase } from '@/lib/supabase'

export const api = {
  // Gestion des clients
  getCustomers: async () => {
    const { data, error } = await supabase.from('customers').select('*').order('name')
    if (error) {
      console.error('Error fetching customers:', error)
      return []
    }
    // Ajout d'un champ simulé pour la compatibilité UI si nécessaire
    return (data || []).map(c => ({ ...c, totalSpent: c.total_spent || '0 €', status: c.status || 'Actif' }))
  },

  createCustomer: async (customerData: any) => {
    const { data, error } = await supabase.from('customers').insert([customerData]).select()
    if (error) throw error
    return { success: true, data }
  },

  updateCustomer: async (id: number, customerData: any) => {
    const { error } = await supabase.from('customers').update(customerData).eq('id', id)
    if (error) throw error
    return { success: true }
  },

  // Suivis internes (Tracking)
  getTracking: async () => {
    const { data, error } = await supabase.from('customer_tracking').select('*').order('created_at', { ascending: false })
    if (error) {
      console.error('Error fetching tracking:', error)
      return []
    }
    return data || []
  },

  createTracking: async (trackingData: any) => {
    const { data, error } = await supabase.from('customer_tracking').insert([trackingData]).select()
    if (error) throw error
    return { success: true, data }
  },

  updateTracking: async (id: number, trackingData: any) => {
    const { error } = await supabase.from('customer_tracking').update(trackingData).eq('id', id)
    if (error) throw error
    return { success: true }
  },

  // Gestion des sites web
  getWebsites: async () => {
    const { data, error } = await supabase.from('websites').select('*').order('name')
    if (error) {
      console.error('Error fetching websites:', error)
      return []
    }
    return (data || []).map(s => ({
      ...s,
      stats: s.stats || { sessions: 0, bounceRate: '0%', avgDuration: '0:00' }
    }))
  },

  createWebsite: async (siteData: any) => {
    const { data, error } = await supabase.from('websites').insert([siteData]).select()
    if (error) throw error
    return { success: true, data }
  },

  updateWebsite: async (id: number, siteData: any) => {
    const { error } = await supabase.from('websites').update(siteData).eq('id', id)
    if (error) throw error
    return { success: true }
  },

  // Gestion des abonnements
  getSubscriptions: async () => {
    const { data, error } = await supabase.from('subscriptions').select('*').order('created_at')
    if (error) {
      console.error('Error fetching subscriptions:', error)
      return []
    }
    return data || []
  },

  updateSubscription: async (id: number, subData: any) => {
    const { error } = await supabase.from('subscriptions').update(subData).eq('id', id)
    if (error) throw error
    return { success: true }
  },

  // Gestion des paiements / ventes
  getPayments: async () => {
    const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false })
    if (error) {
      console.error('Error fetching payments:', error)
      return []
    }
    return data || []
  },

  createSale: async (saleData: any) => {
    const { data, error } = await supabase.from('transactions').insert([saleData]).select()
    if (error) throw error
    return { success: true, data }
  }
}
