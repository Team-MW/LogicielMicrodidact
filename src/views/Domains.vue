<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

import { 
  Globe, 
  Search, 
  Calendar, 
  AlertTriangle, 
  RefreshCw, 
  ExternalLink, 
  Server,
  ShieldCheck,
  ChevronRight,
  Settings
} from 'lucide-vue-next'
import { infomaniakApi } from '@/services/infomaniak'

interface Domain {
  id: string | number
  name: string
  customer: string
  type: 'Domaine' | 'Hébergement' | 'Email'
  status: 'Actif' | 'Expiré' | 'Attention'
  expirationDate: string
  hostingPlan?: string
  autoRenew: boolean
}

const domains = ref<Domain[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const activeFilter = ref('Tous')

const isDemoMode = computed(() => {
  const token = import.meta.env.VITE_INFOMANIAK_TOKEN
  return !token || token === 'YOUR_INFOMANIAK_TOKEN'
})

const fetchData = async () => {
  isLoading.value = true
  const token = import.meta.env.VITE_INFOMANIAK_TOKEN

  if (token && token !== 'YOUR_INFOMANIAK_TOKEN') {
    try {
      const domainsResult = await infomaniakApi.getDomains(token)
      const servicesResult = await infomaniakApi.getServices(token)
      
      console.log('Infomaniak Domains:', domainsResult)
      console.log('Infomaniak Services:', servicesResult)

      const allItems: Domain[] = []

      // Helper to process Infomaniak data structure (can be array or object-per-account)
      const processData = (data: any, defaultType: any) => {
        if (!data) return
        
        const list = Array.isArray(data) ? data : Object.values(data).flat()
        
        list.forEach((item: any) => {
          if (!item) return
          allItems.push({
            id: item.id || item.service_id,
            name: item.domain || item.name || item.customer_name || 'Inconnu',
            customer: item.customer_name || 'Client',
            type: item.product_type || defaultType,
            status: (item.status === 'active' || item.state === 'active') ? 'Actif' : 'Attention',
            expirationDate: item.expiration_date || item.expiry_date || item.expiration || item.end_date,
            autoRenew: !!(item.auto_renew || item.autorenew),
            hostingPlan: item.plan_name || item.product_name || (defaultType === 'Hébergement' ? 'Web' : 'Standard')
          })
        })
      }

      processData(domainsResult?.data, 'Domaine')
      processData(servicesResult?.data, 'Hébergement')

      // Deduplicate by name and filter out items without expiration
      const uniqueItems = Array.from(new Map(allItems.map(item => [item.name, item])).values())
      domains.value = uniqueItems.filter(d => d.expirationDate)
      
      isLoading.value = false
      return
    } catch (error) {
      console.error('Fetch error:', error)
    }
  }

  // Simulation d'appel à l'API Infomaniak si pas de token
  setTimeout(() => {
    domains.value = [
      { id: 1, name: 'mwcrea.com', customer: 'MWCREA', type: 'Domaine', status: 'Actif', expirationDate: '2025-06-15', autoRenew: true, hostingPlan: 'Web + Mail' },
      { id: 2, name: 'microdidact.fr', customer: 'Interne', type: 'Domaine', status: 'Actif', expirationDate: '2025-01-10', autoRenew: true, hostingPlan: 'Cloud Dédié' },
      { id: 3, name: 'stayzen.fr', customer: 'StayZen', type: 'Hébergement', status: 'Attention', expirationDate: '2024-05-25', autoRenew: false, hostingPlan: 'Hébergement Web' },
      { id: 4, name: 'mon-portfolio.io', customer: 'Jean Dupont', type: 'Domaine', status: 'Actif', expirationDate: '2025-03-22', autoRenew: true, hostingPlan: 'Start' },
      { id: 5, name: 'boutique-test.com', customer: 'Marie Curie', type: 'Domaine', status: 'Expiré', expirationDate: '2024-04-15', autoRenew: false, hostingPlan: 'Hébergement Web' },
      { id: 6, name: 'blog-tech.net', customer: 'Thomas Bernard', type: 'Hébergement', status: 'Actif', expirationDate: '2025-08-12', autoRenew: true, hostingPlan: 'WordPress Managed' },
    ]
    isLoading.value = false
  }, 800)
}

onMounted(() => {
  fetchData()
})

const getDaysRemaining = (dateStr: string) => {
  const expiry = new Date(dateStr)
  const now = new Date()
  const diff = expiry.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const getStatusColor = (domain: Domain) => {
  const days = getDaysRemaining(domain.expirationDate)
  if (days < 0) return 'bg-rose-50 text-rose-700 border-rose-200'
  if (days < 30) return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-emerald-50 text-emerald-700 border-emerald-200'
}

const getProgressValue = (dateStr: string) => {
  const days = getDaysRemaining(dateStr)
  if (days < 0) return 0
  if (days > 365) return 100
  return (days / 365) * 100
}

const filteredDomains = computed(() => {
  let result = domains.value
  
  if (activeFilter.value === 'Expirant bientôt') {
    result = result.filter(d => {
      const days = getDaysRemaining(d.expirationDate)
      return days > 0 && days < 30
    })
  } else if (activeFilter.value === 'Expiré') {
    result = result.filter(d => getDaysRemaining(d.expirationDate) <= 0)
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(d => d.name.toLowerCase().includes(q) || d.customer.toLowerCase().includes(q))
  }
  
  return result
})

const stats = computed(() => {
  const expiringSoon = domains.value.filter(d => {
    const days = getDaysRemaining(d.expirationDate)
    return days > 0 && days < 30
  }).length
  const expired = domains.value.filter(d => getDaysRemaining(d.expirationDate) <= 0).length
  
  return {
    total: domains.value.length,
    expiringSoon,
    expired
  }
})

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}
</script>

<template>
  <div class="flex-1 space-y-6 p-6 bg-slate-50/30 min-h-screen">
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900">Domaines & Hébergement</h2>
        <p class="text-muted-foreground text-xs font-medium flex items-center gap-1">
          <ShieldCheck class="h-3 w-3 text-indigo-500" /> Synchronisé avec l'API Infomaniak
        </p>
      </div>
      <Button size="sm" @click="fetchData" :disabled="isLoading" class="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-xs">
        <RefreshCw class="mr-1.5 h-3.5 w-3.5" :class="isLoading && 'animate-spin'" /> Actualiser
      </Button>
    </div>

    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card class="bg-white border-slate-100 shadow-xs">
        <CardContent class="p-4 flex items-center gap-4">
          <div class="p-3 rounded-xl bg-indigo-50 text-indigo-600">
            <Globe class="h-5 w-5" />
          </div>
          <div>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Produits</p>
            <p class="text-xl font-bold text-slate-900">{{ stats.total }}</p>
          </div>
        </CardContent>
      </Card>

      <Card class="bg-white border-slate-100 shadow-xs">
        <CardContent class="p-4 flex items-center gap-4">
          <div class="p-3 rounded-xl bg-amber-50 text-amber-600">
            <AlertTriangle class="h-5 w-5" />
          </div>
          <div>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expirant bientôt</p>
            <p class="text-xl font-bold text-slate-900">{{ stats.expiringSoon }}</p>
          </div>
        </CardContent>
      </Card>

      <Card class="bg-white border-slate-100 shadow-xs">
        <CardContent class="p-4 flex items-center gap-4">
          <div class="p-3 rounded-xl bg-rose-50 text-rose-600">
            <Calendar class="h-5 w-5" />
          </div>
          <div>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expirés</p>
            <p class="text-xl font-bold text-slate-900">{{ stats.expired }}</p>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Token Warning -->
    <div v-if="isDemoMode" class="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-center gap-3">
      <div class="p-2 bg-indigo-100 rounded-lg text-indigo-600">
        <Settings class="h-4 w-4" />
      </div>
      <div class="flex-1">
        <p class="text-xs font-bold text-indigo-900">Mode Démo Actif</p>
        <p class="text-[10px] text-indigo-700 font-medium">Configurez <code class="bg-indigo-100/50 px-1 rounded">VITE_INFOMANIAK_TOKEN</code> dans votre fichier .env pour voir vos données réelles.</p>
      </div>
    </div>

    <!-- Filters & Search -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-xl w-fit shrink-0">
        <button 
          v-for="filter in ['Tous', 'Expirant bientôt', 'Expiré']" 
          :key="filter"
          @click="activeFilter = filter"
          class="px-4 py-1.5 text-xs font-bold rounded-lg transition-all"
          :class="[activeFilter === filter ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700']"
        >
          {{ filter }}
        </button>
      </div>

      <div class="relative w-full md:max-w-xs flex-1">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input 
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher un domaine, client..."
          class="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium placeholder:text-slate-400 shadow-xs"
        />
      </div>
    </div>

    <!-- Domains Grid -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center py-24 space-y-4">
      <RefreshCw class="h-8 w-8 animate-spin text-indigo-500" />
      <p class="text-sm font-medium text-slate-500 italic">Interrogation des serveurs Infomaniak...</p>
    </div>

    <div v-else-if="filteredDomains.length === 0" class="flex flex-col items-center justify-center py-24 space-y-4 bg-white rounded-2xl border border-dashed border-slate-200">
      <div class="p-4 rounded-full bg-slate-50 text-slate-300">
        <Globe class="h-10 w-10" />
      </div>
      <p class="text-slate-500 font-medium text-sm">Aucun résultat ne correspond à votre recherche.</p>
      <Button variant="ghost" size="sm" @click="searchQuery = ''; activeFilter = 'Tous'" class="text-indigo-600 font-bold">Voir tous les domaines</Button>
    </div>

    <div v-else class="grid gap-4 grid-cols-1 lg:grid-cols-2">
      <Card v-for="domain in filteredDomains" :key="domain.id" 
        class="bg-white border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl overflow-hidden group"
      >
        <CardContent class="p-0">
          <div class="p-5 flex items-start justify-between">
            <div class="flex items-start gap-4">
              <div class="p-3 rounded-2xl bg-slate-50 group-hover:bg-indigo-50 transition-colors">
                <Server v-if="domain.type === 'Hébergement'" class="h-6 w-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                <Globe v-else class="h-6 w-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </div>
              <div class="space-y-1">
                <h3 class="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  {{ domain.name }}
                  <Badge variant="outline" :class="[getStatusColor(domain), 'text-[10px] px-2 py-0 font-bold border']">
                    {{ getDaysRemaining(domain.expirationDate) < 0 ? 'Expiré' : getDaysRemaining(domain.expirationDate) < 30 ? 'Bientôt' : 'Actif' }}
                  </Badge>
                </h3>
                <p class="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                  Client: <span class="text-slate-600">{{ domain.customer }}</span>
                  <span class="w-1 h-1 rounded-full bg-slate-200"></span>
                  Plan: <span class="text-slate-600">{{ domain.hostingPlan || 'Standard' }}</span>
                </p>
              </div>
            </div>
            <a :href="'https://' + domain.name" target="_blank" class="p-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all">
              <ExternalLink class="h-4 w-4" />
            </a>
          </div>

          <div class="px-5 pb-5 pt-0 space-y-4">
            <div class="space-y-2">
              <div class="flex justify-between items-end">
                <div class="space-y-0.5">
                  <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Échéance</p>
                  <p class="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                    <Calendar class="h-3.5 w-3.5 text-slate-400" /> {{ formatDate(domain.expirationDate) }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jours restants</p>
                  <p class="text-sm font-black" :class="[getDaysRemaining(domain.expirationDate) < 30 ? 'text-rose-600' : 'text-indigo-600']">
                    {{ Math.max(0, getDaysRemaining(domain.expirationDate)) }} jours
                  </p>
                </div>
              </div>
              <Progress :model-value="getProgressValue(domain.expirationDate)" class="h-1.5 bg-slate-100" />
            </div>

            <div class="flex items-center justify-between pt-2 border-t border-slate-50">
              <div class="flex items-center gap-4">
                <div class="flex items-center gap-1.5">
                  <div class="w-2 h-2 rounded-full" :class="[domain.autoRenew ? 'bg-emerald-500' : 'bg-slate-300']"></div>
                  <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Auto-renouvellement</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" class="text-xs font-bold text-slate-400 hover:text-indigo-600 gap-1 pr-0">
                Gérer sur Infomaniak <ChevronRight class="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
