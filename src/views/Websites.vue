<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
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
  Settings2,
  RefreshCw,
  Plus,
  Loader2
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

const newSite = ref({
  name: '',
  url: '',
  customerId: ''
})

onMounted(async () => {
  websites.value = await api.getWebsites()
  customers.value = await api.getCustomers()
  isLoading.value = false
})

const getCustomerName = (id: number) => {
  const customer = customers.value.find(c => c.id === id)
  return customer ? customer.name : 'Client Inconnu'
}

const filteredWebsites = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return websites.value.filter(site => {
    const customerName = getCustomerName(site.customerId).toLowerCase()
    return site.name.toLowerCase().includes(query) || 
           site.url.toLowerCase().includes(query) ||
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

          <div class="mt-6 flex gap-2">
            <Button variant="outline" class="w-full text-xs h-8">
              <BarChart3 class="mr-2 h-3 w-3" /> Report
            </Button>
            <Button variant="ghost" size="icon" class="h-8 w-8">
              <Settings2 class="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div v-if="filteredWebsites.length === 0" class="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
        <Globe class="mx-auto h-12 w-12 opacity-20 mb-4" />
        <p>Aucun site web trouvé.</p>
      </div>
    </div>
  </div>
</template>
