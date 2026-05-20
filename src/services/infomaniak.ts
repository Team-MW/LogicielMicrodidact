/**
 * Service pour l'API Infomaniak
 * Documentation: https://developer.infomaniak.com/
 */

const BASE_URL = 'https://api.infomaniak.com'

export const infomaniakApi = {
  /**
   * Récupère la liste des domaines
   * @param token Token d'API Infomaniak
   */
  getDomains: async (token: string) => {
    try {
      const response = await fetch(`${BASE_URL}/1/domain`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) throw new Error('Erreur API Infomaniak')
      return await response.json()
    } catch (error) {
      console.error('Infomaniak API Error:', error)
      return null
    }
  },

  /**
   * Récupère la liste des produits (hébergements, etc.)
   * @param token Token d'API Infomaniak
   */
  /**
   * Récupère la liste des services (tous les produits)
   * @param token Token d'API Infomaniak
   */
  getServices: async (token: string) => {
    try {
      const response = await fetch(`${BASE_URL}/1/service`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) throw new Error('Erreur API Infomaniak')
      return await response.json()
    } catch (error) {
      console.error('Infomaniak API Error:', error)
      return null
    }
  }
}
