<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Package, 
  Plus, 
  Search, 
  Trash2, 
  AlertTriangle, 
  Truck, 
  RefreshCw,
  Pencil,
  ArrowUpRight,
  ArrowDownRight
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
import { Label } from '@/components/ui/label'

interface StockItem {
  id: number
  name: string
  category: string
  quantity: number
  unit: string
  min_quantity: number
  supplier: string
  last_restock: string
}

const stockItems = ref<StockItem[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const isAdding = ref(false)
const isDialogOpen = ref(false)

const newItem = ref({
  name: '',
  category: 'Matériau',
  quantity: 0,
  unit: 'm²',
  min_quantity: 5,
  supplier: ''
})

const fetchStock = async () => {
  isLoading.value = true
  const { data, error } = await supabase.from('inventory').select('*').order('name')
  if (data && !error) {
    stockItems.value = data
  } else if (error) {
    console.error('Error fetching stock:', error)
  }
  isLoading.value = false
}

onMounted(() => {
  fetchStock()
})

const filteredStock = computed(() => {
  if (!searchQuery.value) return stockItems.value
  const query = searchQuery.value.toLowerCase()
  return stockItems.value.filter(item => 
    item.name.toLowerCase().includes(query) || 
    item.category.toLowerCase().includes(query) ||
    item.supplier.toLowerCase().includes(query)
  )
})

const handleAddItem = async () => {
  if (!newItem.value.name || !newItem.value.supplier) return
  isAdding.value = true
  
  const { error } = await supabase.from('inventory').insert({
    ...newItem.value,
    last_restock: new Date().toISOString().split('T')[0]
  }).select()

  if (!error) {
    fetchStock()
    newItem.value = { name: '', category: 'Matériau', quantity: 0, unit: 'm²', min_quantity: 5, supplier: '' }
    isDialogOpen.value = false
  }
  isAdding.value = false
}

const deleteItem = async (id: number) => {
  if (!confirm('Supprimer cet article ?')) return
  const { error } = await supabase.from('inventory').delete().eq('id', id)
  if (!error) {
    stockItems.value = stockItems.value.filter(i => i.id !== id)
  }
}

const updateQuantity = async (item: StockItem, delta: number) => {
  const newQty = Math.max(0, item.quantity + delta)
  const { error } = await supabase.from('inventory').update({ quantity: newQty }).eq('id', item.id)
  if (!error) {
    item.quantity = newQty
  }
}

const getStatusBadge = (item: StockItem) => {
  if (item.quantity <= 0) return { label: 'Rupture', variant: 'destructive' as const }
  if (item.quantity <= item.min_quantity) return { label: 'Alerte', variant: 'outline' as const, class: 'bg-amber-50 text-amber-700 border-amber-200' }
  return { label: 'En stock', variant: 'secondary' as const, class: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
}
</script>

<template>
  <div class="flex-1 space-y-6 p-6 bg-slate-50/30 min-h-screen">
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900">Gestion du Stock</h2>
        <p class="text-muted-foreground text-xs font-medium">Inventaire du matériel et consommables.</p>
      </div>
      
      <Dialog v-model:open="isDialogOpen">
        <DialogTrigger asChild>
          <Button class="bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-100 rounded-xl px-6">
            <Plus class="mr-2 h-4 w-4" /> Nouvel Article
          </Button>
        </DialogTrigger>
        <DialogContent class="sm:max-w-[425px] rounded-3xl">
          <DialogHeader>
            <DialogTitle class="text-xl font-bold">Ajouter au stock</DialogTitle>
            <DialogDescription class="text-xs">
              Enregistrez un nouveau matériau ou produit.
            </DialogDescription>
          </DialogHeader>
          <div class="grid gap-6 py-4">
            <div class="space-y-2">
              <Label class="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nom de l'article</Label>
              <Input v-model="newItem.name" placeholder="Ex: Dibon 3mm Blanc" class="rounded-xl border-slate-200 font-bold" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label class="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Catégorie</Label>
                <select v-model="newItem.category" class="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-indigo-100 outline-none">
                  <option value="Matériau">Matériau</option>
                  <option value="Adhésif">Adhésif</option>
                  <option value="Consommable">Consommable</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
              <div class="space-y-2">
                <Label class="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Unité</Label>
                <Input v-model="newItem.unit" placeholder="m², rouleau, pc" class="rounded-xl border-slate-200 font-bold" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label class="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Quantité Initiale</Label>
                <Input v-model.number="newItem.quantity" type="number" class="rounded-xl border-slate-200 font-bold" />
              </div>
              <div class="space-y-2">
                <Label class="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Seuil d'alerte</Label>
                <Input v-model.number="newItem.min_quantity" type="number" class="rounded-xl border-slate-200 font-bold" />
              </div>
            </div>
            <div class="space-y-2">
              <Label class="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Fournisseur Principal</Label>
              <Input v-model="newItem.supplier" placeholder="Nom du fournisseur" class="rounded-xl border-slate-200 font-bold" />
            </div>
          </div>
          <DialogFooter>
            <Button :disabled="isAdding" @click="handleAddItem" class="w-full bg-indigo-600 hover:bg-indigo-500 rounded-xl font-black uppercase tracking-widest h-12 shadow-lg shadow-indigo-100">
              <RefreshCw v-if="isAdding" class="mr-2 h-4 w-4 animate-spin" />
              Enregistrer l'article
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

    <div class="grid gap-6 md:grid-cols-4">
      <Card class="bg-white border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <CardContent class="p-6">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Package class="w-6 h-6" />
            </div>
            <div>
              <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Articles</p>
              <h3 class="text-2xl font-bold text-slate-900">{{ stockItems.length }}</h3>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card class="bg-white border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <CardContent class="p-6">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
              <AlertTriangle class="w-6 h-6" />
            </div>
            <div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alertes Stock</p>
              <h3 class="text-2xl font-black text-slate-900">{{ stockItems.filter(i => i.quantity <= i.min_quantity).length }}</h3>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card class="bg-white border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <CardContent class="p-6">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Truck class="w-6 h-6" />
            </div>
            <div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fournisseurs</p>
              <h3 class="text-2xl font-black text-slate-900">{{ new Set(stockItems.map(i => i.supplier)).size }}</h3>
            </div>
          </div>
        </CardContent>
      </Card>

      <div class="relative flex items-center px-4 bg-white border border-slate-100 rounded-3xl shadow-sm">
        <Search class="absolute left-7 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input 
          v-model="searchQuery"
          placeholder="Rechercher un matériau..." 
          class="w-full pl-10 pr-4 py-3 bg-transparent border-none outline-none font-bold text-sm text-slate-700 placeholder:text-slate-300"
        />
      </div>
    </div>

    <Card class="bg-white border-slate-100 rounded-[32px] shadow-sm overflow-hidden border-none shadow-xl shadow-slate-200/50">
      <CardContent class="p-0">
        <Table>
          <TableHeader class="bg-slate-50/50">
            <TableRow class="hover:bg-transparent border-slate-100">
              <TableHead class="text-xs font-bold uppercase tracking-wider h-12 pl-8">Article</TableHead>
              <TableHead class="text-xs font-bold uppercase tracking-wider h-12">Catégorie</TableHead>
              <TableHead class="text-xs font-bold uppercase tracking-wider h-12">Quantité</TableHead>
              <TableHead class="text-xs font-bold uppercase tracking-wider h-12">Statut</TableHead>
              <TableHead class="text-[10px] font-black uppercase tracking-widest h-14">Fournisseur</TableHead>
              <TableHead class="text-[10px] font-black uppercase tracking-widest h-14 text-right pr-8">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="item in filteredStock" :key="item.id" class="border-slate-50 hover:bg-slate-50/50 transition-colors group">
              <TableCell class="pl-8">
                <div class="flex flex-col">
                  <span class="font-black text-slate-900">{{ item.name }}</span>
                  <span class="text-[10px] text-slate-400 font-bold uppercase">Réf: #STK{{ item.id }}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" class="rounded-lg font-black text-[9px] uppercase tracking-wider px-2 py-0.5 bg-white shadow-xs">
                  {{ item.category }}
                </Badge>
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-3">
                  <span class="text-lg font-black text-slate-900 w-16">{{ item.quantity }} {{ item.unit }}</span>
                  <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button @click="updateQuantity(item, -1)" class="w-8 h-8 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center transition-all">
                      <ArrowDownRight class="w-4 h-4" />
                    </button>
                    <button @click="updateQuantity(item, 1)" class="w-8 h-8 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 flex items-center justify-center transition-all">
                      <ArrowUpRight class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge :variant="getStatusBadge(item).variant" :class="[getStatusBadge(item).class, 'rounded-lg font-black text-[9px] uppercase tracking-wider px-2.5 py-1']">
                  {{ getStatusBadge(item).label }}
                </Badge>
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-2 text-slate-600 font-bold text-sm">
                  <Truck class="w-3.5 h-3.5 opacity-40" />
                  {{ item.supplier }}
                </div>
              </TableCell>
              <TableCell class="text-right pr-8">
                <div class="flex justify-end gap-2">
                  <button class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button @click="deleteItem(item.id)" class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </TableCell>
            </TableRow>
            <TableRow v-if="filteredStock.length === 0">
              <TableCell colspan="6" class="h-64 text-center">
                <div class="flex flex-col items-center justify-center space-y-4 opacity-20">
                  <Package class="w-16 h-16" />
                  <p class="font-black uppercase tracking-widest text-sm">Aucun article trouvé</p>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
</template>
