<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Globe, 
  ExternalLink, 
  BarChart3, 
  Users, 
  Clock, 
  ArrowUpRight,
  RefreshCw,
  Plus,
  Loader2,
  Pencil,
  CreditCard,
  Copy,
  X,
  Receipt,
  Search
} from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '@/services/api'

const websites = ref<any[]>([])
const customers = ref<any[]>([])
const isLoading = ref(true)
const isAdding = ref(false)
const isRefreshing = ref(false)
const isDialogOpen = ref(false)
const searchQuery = ref('')
const refreshInterval = ref<any>(null)

const newSite = ref({
  name: '',
  url: '',
  customerId: ''
})

const editingSite = ref<any>(null)
const isEditingDialogVisible = ref(false)
const isUpdating = ref(false)

// Stripe Logic
const stripeCustomers = ref<any[]>([])
const stripeCustomerSearch = ref('')
const isStripeDropdownOpen = ref(false)

const filteredStripeCustomers = computed(() => {
  if (!stripeCustomerSearch.value) return stripeCustomers.value.slice(0, 5)
  const q = stripeCustomerSearch.value.toLowerCase()
  return stripeCustomers.value.filter(c => 
    (c.name && c.name.toLowerCase().includes(q)) || 
    (c.email && c.email.toLowerCase().includes(q))
  ).slice(0, 5)
})

const fetchStripeCustomers = async () => {
  try {
    const res = await fetch('/api/stripe/customers')
    const data = await res.json()
    stripeCustomers.value = data
  } catch (error) {
    console.error('Failed to fetch stripe customers', error)
  }
}

const stripeInvoicesMap = ref<Record<string, any[]>>({})
const fetchingInvoicesMap = ref<Record<string, boolean>>({})

const fetchStripeInvoicesForCustomer = async (customerId: string) => {
  if (stripeInvoicesMap.value[customerId] || fetchingInvoicesMap.value[customerId]) return
  
  fetchingInvoicesMap.value[customerId] = true
  try {
    const res = await fetch(`/api/stripe/customer-invoices?customer_id=${customerId}`)
    const data = await res.json()
    stripeInvoicesMap.value[customerId] = data
  } catch (error) {
    console.error('Failed to fetch stripe invoices', error)
  } finally {
    fetchingInvoicesMap.value[customerId] = false
  }
}

const getInvoicesForSite = (site: any) => {
  if (!site.stripe_customer_id) return []
  return stripeInvoicesMap.value[site.stripe_customer_id] || []
}

const isFetchingInvoices = (site: any) => {
  if (!site.stripe_customer_id) return false
  return fetchingInvoicesMap.value[site.stripe_customer_id] || false
}

const loadAllInvoices = () => {
  websites.value.forEach(site => {
    if (site.stripe_customer_id) {
      fetchStripeInvoicesForCustomer(site.stripe_customer_id)
    }
  })
}

// Subscription State
const isSubscriptionDialogOpen = ref(false)
const isCreatingSubscription = ref(false)
const selectedSiteForSubscription = ref<any>(null)
const subscriptionDetails = ref({
  amount: 50,
  description: 'Maintenance Mensuelle'
})
const generatedPaymentLink = ref('')

const openSubscriptionDialog = (site: any) => {
  selectedSiteForSubscription.value = site
  subscriptionDetails.value.description = `Maintenance - ${site.name}`
  generatedPaymentLink.value = ''
  isSubscriptionDialogOpen.value = true
}

const handleCreateSubscription = async () => {
  if (!selectedSiteForSubscription.value) return
  isCreatingSubscription.value = true
  try {
    const customer = customers.value.find(c => c.id === selectedSiteForSubscription.value.customerId)
    const response = await fetch('/api/stripe/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: subscriptionDetails.value.amount,
        description: subscriptionDetails.value.description,
        customerEmail: customer ? customer.email : undefined
      })
    })
    
    if (!response.ok) throw new Error('Erreur lors de la création')
    
    const data = await response.json()
    generatedPaymentLink.value = data.url
  } catch (error) {
    console.error('Erreur', error)
    alert("Impossible de créer l'abonnement. Vérifiez vos clés Stripe.")
  } finally {
    isCreatingSubscription.value = false
  }
}

onMounted(() => {
  fetchStripeCustomers()
  fetchData()
  
  // Système de récupération automatique si pas de données (toutes les 3s)
  refreshInterval.value = setInterval(() => {
    if (websites.value.length === 0) {
      fetchData()
    }
  }, 3000)
})

onUnmounted(() => {
  if (refreshInterval.value) clearInterval(refreshInterval.value)
})

const copyLink = (url: string) => {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(url)
  }
  if (typeof window !== 'undefined' && window.alert) {
    window.alert('Lien copié !')
  }
}

const openLink = (url: string) => {
  if (typeof window !== 'undefined') {
    window.open(url, '_blank')
  }
}

const fetchData = async () => {
  isLoading.value = true
  try {
    websites.value = await api.getWebsites()
    customers.value = await api.getCustomers()
    loadAllInvoices()
    if (websites.value.length > 0 && refreshInterval.value) {
      clearInterval(refreshInterval.value)
      refreshInterval.value = null
    }
  } catch (error) {
    console.error('Error fetching data:', error)
  } finally {
    isLoading.value = false
  }
}

const getCustomerName = (id: number) => {
  const customer = customers.value.find(c => c.id === id)
  return customer ? customer.name : 'Client Inconnu'
}

const filteredWebsites = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return websites.value.filter(site => {
    const customerName = getCustomerName(site.customerId).toLowerCase()
    return (site.name || '').toLowerCase().includes(query) || 
           (site.url || '').toLowerCase().includes(query) ||
           customerName.includes(query)
  })
})

const handleAddWebsite = async () => {
  if (!newSite.value.name || !newSite.value.url || !newSite.value.customerId) return
  
  isAdding.value = true
  await api.createWebsite({
    ...newSite.value,
    customerId: parseInt(newSite.value.customerId)
  })
  websites.value = await api.getWebsites()
  
  newSite.value = { name: '', url: '', customerId: '' }
  isAdding.value = false
  isDialogOpen.value = false
}

const refreshStats = async () => {
  isRefreshing.value = true
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  // Randomize stats for demo
  websites.value = websites.value.map(site => ({
    ...site,
    stats: {
      sessions: Math.floor(Math.random() * 20000) + 500,
      bounceRate: (Math.random() * 30 + 30).toFixed(1) + '%',
      avgDuration: Math.floor(Math.random() * 5) + ':' + Math.floor(Math.random() * 60).toString().padStart(2, '0')
    }
  }))
  
  isRefreshing.value = false
}

const openEditDialog = (site: any) => {
  editingSite.value = { ...site, customerId: site.customerId ? site.customerId.toString() : '' }
  isEditingDialogVisible.value = true
  
  if (site.stripe_customer_id) {
    const cust = stripeCustomers.value.find(c => c.id === site.stripe_customer_id)
    stripeCustomerSearch.value = cust?.name || cust?.email || cust?.id || ''
  } else {
    stripeCustomerSearch.value = ''
  }
}

const handleUpdateWebsite = async () => {
  if (!editingSite.value || !editingSite.value.name || !editingSite.value.url) return
  
  isUpdating.value = true
  await api.updateWebsite(editingSite.value.id, {
    name: editingSite.value.name,
    url: editingSite.value.url,
    customerId: parseInt(editingSite.value.customerId),
    status: editingSite.value.status,
    stripe_customer_id: editingSite.value.stripe_customer_id || null
  })
  
  websites.value = await api.getWebsites()
  loadAllInvoices()
  isUpdating.value = false
  isEditingDialogVisible.value = false
  editingSite.value = null
}
</script>

<template>
  <div class="flex-1 space-y-4 p-8 pt-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">Sites Internet</h2>
        <p class="text-muted-foreground">Gestion des sites web clients et statistiques Google API.</p>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" :disabled="isRefreshing" @click="refreshStats">
          <RefreshCw class="mr-2 h-4 w-4" :class="isRefreshing && 'animate-spin'" /> 
          {{ isRefreshing ? 'Mise à jour...' : 'Actualiser Stats' }}
        </Button>

        <Dialog v-model:open="isDialogOpen">
          <DialogTrigger asChild>
            <Button>
              <Plus class="mr-2 h-4 w-4" /> Nouveau Site
            </Button>
          </DialogTrigger>
          <DialogContent class="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Ajouter un site web</DialogTitle>
              <DialogDescription>
                Reliez un nouveau site internet à l'un de vos clients.
              </DialogDescription>
            </DialogHeader>
            <div class="grid gap-4 py-4">
              <div class="grid gap-2">
                <Label>Nom du site</Label>
                <Input v-model="newSite.name" placeholder="Ex: Boutique Bio" />
              </div>
              <div class="grid gap-2">
                <Label>URL</Label>
                <Input v-model="newSite.url" placeholder="https://..." />
              </div>
              <div class="grid gap-2">
                <Label>Client Propriétaire</Label>
                <Select v-model="newSite.customerId">
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="c in customers" :key="c.id" :value="c.id.toString()">
                      {{ c.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button :disabled="isAdding || !newSite.name || !newSite.url || !newSite.customerId" @click="handleAddWebsite">
                <Loader2 v-if="isAdding" class="mr-2 h-4 w-4 animate-spin" />
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog v-model:open="isEditingDialogVisible">
          <DialogContent class="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Modifier le site web</DialogTitle>
              <DialogDescription>
                Modifiez les informations du site internet.
              </DialogDescription>
            </DialogHeader>
            <div v-if="editingSite" class="grid gap-4 py-4">
              <div class="grid gap-2">
                <Label>Nom du site</Label>
                <Input v-model="editingSite.name" />
              </div>
              <div class="grid gap-2">
                <Label>URL</Label>
                <Input v-model="editingSite.url" />
              </div>
              <div class="grid gap-2">
                <Label>Client Propriétaire</Label>
                <Select v-model="editingSite.customerId">
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="c in customers" :key="c.id" :value="c.id.toString()">
                      {{ c.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="grid gap-2">
                <Label>Statut</Label>
                <Select v-model="editingSite.status">
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="En ligne">En ligne</SelectItem>
                    <SelectItem value="En maintenance">En maintenance</SelectItem>
                    <SelectItem value="En développement">En développement</SelectItem>
                    <SelectItem value="Suspendu">Suspendu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="grid gap-2 relative">
                <Label>Lier à un client Stripe (Facturation)</Label>
                <div class="relative">
                  <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    v-model="stripeCustomerSearch" 
                    placeholder="Rechercher un client Stripe..." 
                    class="pl-9"
                    @focus="isStripeDropdownOpen = true"
                  />
                  <div v-if="isStripeDropdownOpen" class="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    <div class="p-2 sticky top-0 bg-white border-b border-slate-100 flex justify-between items-center">
                      <span class="text-xs font-semibold text-slate-500">Sélectionner un client</span>
                      <button @click.prevent="isStripeDropdownOpen = false" class="text-slate-400 hover:text-slate-600">
                        <X class="h-4 w-4" />
                      </button>
                    </div>
                    <div 
                      v-if="!stripeCustomerSearch && editingSite.stripe_customer_id" 
                      class="p-2 cursor-pointer hover:bg-rose-50 flex items-center justify-between text-rose-600 border-b border-slate-100"
                      @click="() => { editingSite.stripe_customer_id = null; stripeCustomerSearch = ''; isStripeDropdownOpen = false }"
                    >
                      <span class="text-sm font-medium">Détacher le client actuel</span>
                      <X class="h-4 w-4" />
                    </div>
                    <div 
                      v-for="cust in filteredStripeCustomers" 
                      :key="cust.id" 
                      class="p-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                      @click="() => { 
                        editingSite.stripe_customer_id = cust.id; 
                        stripeCustomerSearch = cust.name || cust.email; 
                        isStripeDropdownOpen = false 
                      }"
                    >
                      <div class="font-medium text-sm text-slate-900">{{ cust.name || 'Sans nom' }}</div>
                      <div class="text-xs text-slate-500">{{ cust.email || 'Pas d\'email' }}</div>
                    </div>
                    <div v-if="filteredStripeCustomers.length === 0" class="p-4 text-center text-sm text-slate-500">
                      Aucun client trouvé
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button :disabled="isUpdating || !editingSite?.name || !editingSite?.url" @click="handleUpdateWebsite">
                <Loader2 v-if="isUpdating" class="mr-2 h-4 w-4 animate-spin" />
                Mettre à jour
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <!-- Subscription Dialog -->
        <Dialog v-model:open="isSubscriptionDialogOpen">
          <DialogContent class="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Créer un abonnement (Stripe)</DialogTitle>
              <DialogDescription>
                Générer un lien de paiement sécurisé pour {{ selectedSiteForSubscription?.name }}
              </DialogDescription>
            </DialogHeader>
            <div class="grid gap-4 py-4" v-if="!generatedPaymentLink">
              <div class="grid gap-2">
                <Label>Montant mensuel (€)</Label>
                <Input type="number" v-model="subscriptionDetails.amount" placeholder="50" min="1" />
              </div>
              <div class="grid gap-2">
                <Label>Libellé de l'abonnement</Label>
                <Input v-model="subscriptionDetails.description" />
              </div>
              <p class="text-[10px] text-muted-foreground bg-slate-50 p-2 rounded border border-slate-100">
                Un lien de paiement sécurisé sera généré. Le client ({{ getCustomerName(selectedSiteForSubscription?.customerId) }}) pourra payer par carte bancaire ou prélèvement SEPA, et sera prélevé tous les mois.
              </p>
            </div>
            
            <div v-else class="space-y-4 py-4">
              <div class="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-sm font-medium border border-emerald-200 flex items-center gap-2">
                <CreditCard class="h-4 w-4" /> Abonnement prêt !
              </div>
              <div class="space-y-2">
                <Label>Lien à envoyer au client :</Label>
                <div class="flex gap-2">
                  <Input :value="generatedPaymentLink" readonly class="text-xs bg-slate-50 font-mono" />
                  <Button size="icon" variant="outline" @click="copyLink(generatedPaymentLink)" title="Copier le lien">
                    <Copy class="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div class="flex justify-end pt-2">
                <Button variant="link" class="text-xs text-indigo-600" @click="openLink(generatedPaymentLink)">
                  Ouvrir le lien moi-même &rarr;
                </Button>
              </div>
            </div>

            <DialogFooter v-if="!generatedPaymentLink">
              <Button :disabled="isCreatingSubscription || !subscriptionDetails.amount || !subscriptionDetails.description" @click="handleCreateSubscription" class="bg-indigo-600 hover:bg-indigo-500">
                <Loader2 v-if="isCreatingSubscription" class="mr-2 h-4 w-4 animate-spin" />
                <CreditCard v-else class="mr-2 h-4 w-4" />
                Générer le lien
              </Button>
            </DialogFooter>
            <DialogFooter v-else>
              <Button @click="isSubscriptionDialogOpen = false" variant="outline">Fermer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>

    <div class="flex items-center pb-4">
      <div class="relative w-full max-w-sm">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input v-model="searchQuery" placeholder="Rechercher un site ou un client..." class="pl-10" />
      </div>
    </div>

    <div v-if="isLoading" class="flex items-center justify-center h-64">
      <RefreshCw class="h-8 w-8 animate-spin text-primary" />
    </div>

    <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card v-for="site in filteredWebsites" :key="site.id" class="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300">
        <CardHeader class="pb-2">
          <div class="flex justify-between items-start">
            <div class="flex items-center gap-2">
              <div class="p-2 bg-primary/10 rounded-lg">
                <Globe class="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle class="text-lg">{{ site.name }}</CardTitle>
                <CardDescription class="flex items-center gap-1 truncate max-w-[150px]">
                  {{ site.url }}
                  <ExternalLink class="h-3 w-3" />
                </CardDescription>
              </div>
            </div>
            <Badge :variant="site.status === 'En ligne' ? 'default' : 'secondary'">
              {{ site.status }}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div class="mt-2 text-sm">
            <span class="text-muted-foreground">Propriétaire:</span>
            <span class="ml-2 font-medium">{{ getCustomerName(site.customerId) }}</span>
          </div>

          <!-- Google API Stats Mockup -->
          <div class="mt-6 space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Statistiques Google API</span>
              <BarChart3 class="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div class="flex items-center gap-2 text-muted-foreground mb-1">
                  <Users class="h-3.5 w-3.5" />
                  <span class="text-[10px] font-bold">SESSIONS</span>
                </div>
                <div class="text-xl font-bold">{{ site.stats.sessions }}</div>
                <div class="text-[10px] text-emerald-600 flex items-center gap-0.5 mt-1 font-medium">
                  <ArrowUpRight class="h-2 w-2" /> +{{ Math.floor(Math.random() * 20) }}%
                </div>
              </div>
              
              <div class="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div class="flex items-center gap-2 text-muted-foreground mb-1">
                  <Clock class="h-3.5 w-3.5" />
                  <span class="text-[10px] font-bold">REBOND</span>
                </div>
                <div class="text-xl font-bold">{{ site.stats.bounceRate }}</div>
                <div class="text-[10px] text-rose-600 flex items-center gap-0.5 mt-1 font-medium">
                  <ArrowUpRight class="h-2 w-2" /> +{{ (Math.random() * 5).toFixed(1) }}%
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <div class="flex justify-between text-xs">
                <span class="text-muted-foreground line-clamp-1">Performance SEO</span>
                <span class="font-bold">{{ 70 + Math.floor(Math.random() * 25) }}/100</span>
              </div>
              <Progress :model-value="85" class="h-1" />
            </div>
          </div>

          <!-- Stripe Invoices Section -->
          <div v-if="site.stripe_customer_id" class="mt-4 pt-4 border-t border-slate-100">
            <div class="flex items-center gap-2 mb-3">
              <CreditCard class="h-3.5 w-3.5 text-indigo-500" />
              <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Historique Paiements</span>
            </div>
            
            <div v-if="isFetchingInvoices(site)" class="text-[10px] text-slate-400 animate-pulse">Chargement...</div>
            <div v-else-if="getInvoicesForSite(site).length === 0" class="text-[10px] text-slate-400">Aucune facture récente.</div>
            <div v-else class="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
              <div v-for="inv in getInvoicesForSite(site)" :key="inv.id" class="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-100">
                <div class="flex items-center gap-2">
                  <Receipt class="h-3 w-3 text-slate-400" />
                  <span class="text-[10px] font-medium text-slate-700">{{ new Date(inv.created * 1000).toLocaleDateString('fr-FR') }}</span>
                  <span class="text-[10px] font-bold text-slate-900">{{ (inv.amount_due / 100).toFixed(2) }} €</span>
                </div>
                <Badge :variant="inv.status === 'paid' ? 'default' : inv.status === 'open' ? 'secondary' : 'destructive'" class="text-[8px] px-1 py-0 shadow-none border-0" :class="inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : inv.status === 'open' ? 'bg-amber-100 text-amber-700' : ''">
                  {{ inv.status === 'paid' ? 'Payé' : inv.status === 'open' ? 'En attente' : 'Échoué' }}
                </Badge>
              </div>
            </div>
          </div>

          <div class="mt-6 flex gap-2">
            <Button variant="outline" class="w-full text-xs h-8">
              <BarChart3 class="mr-2 h-3 w-3" /> Report
            </Button>
            <Button variant="outline" class="w-full text-xs h-8 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200 shadow-none" @click="openSubscriptionDialog(site)">
              <CreditCard class="mr-2 h-3 w-3" /> Abo
            </Button>
            <Button variant="ghost" size="icon" class="h-8 w-8 text-indigo-600 hover:bg-indigo-50" @click="openEditDialog(site)" title="Modifier">
              <Pencil class="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div v-if="filteredWebsites.length === 0" class="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl flex flex-col items-center justify-center">
        <Globe class="mx-auto h-12 w-12 opacity-20 mb-4" />
        <p class="mb-4">Aucun site web trouvé.</p>
        <Button variant="outline" size="sm" @click="fetchData">
          <RefreshCw class="mr-2 h-4 w-4" />
          Réessayer de charger
        </Button>
      </div>
    </div>
  </div>
</template>
