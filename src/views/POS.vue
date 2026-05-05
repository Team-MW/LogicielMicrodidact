<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { XCircle, CreditCard, ExternalLink, Link2, AlertCircle, RefreshCw, Pencil } from 'lucide-vue-next'

const transactions = ref<any[]>([])
const customers = ref<any[]>([])
const activeTab = ref('refused') // 'refused' | 'stripe'

// Formulaire Lien Stripe
const stripeAmount = ref('')
const stripeClient = ref('')
const stripeDesc = ref('')
const generatedLink = ref('')
const isLoading = ref(false)
const editingTx = ref<any>(null)
const isEditingDialogVisible = ref(false)
const isUpdating = ref(false)

const fetchTransactions = async () => {
  const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false })
  if (data && !error) {
    transactions.value = data
  }
}

const fetchCustomers = async () => {
  const { data, error } = await supabase.from('customers').select('*').order('name')
  if (data && !error) {
    customers.value = data
  }
}

onMounted(() => {
  fetchTransactions()
  fetchCustomers()
})

const getCustomerName = (customerId: any) => {
  if (!customerId) return 'Client Inconnu'
  const customer = customers.value.find(c => c.id === customerId)
  return customer ? customer.name : 'Client #' + customerId
}

const refusedTransactions = computed(() => {
  return transactions.value.filter(t => t.status === 'Refusé')
})

const createStripeLink = () => {
  if (!stripeAmount.value) return
  isLoading.value = true
  
  // Préparation Stripe (simulation)
  setTimeout(async () => {
    const fakeId = Math.random().toString(36).substring(2, 11).toUpperCase()
    generatedLink.value = `https://checkout.stripe.com/pay/cs_live_${fakeId}`
    
    // Loguer la transaction "En attente" dans Supabase (Optionnel)
    await supabase.from('transactions').insert({
      amount: parseFloat(stripeAmount.value),
      payment_method: 'Stripe Link',
      status: 'En attente'
    })
    
    isLoading.value = false
    fetchTransactions()
  }, 1200)
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const openEditDialog = (tx: any) => {
  editingTx.value = { ...tx }
  isEditingDialogVisible.value = true
}

const handleUpdateTransaction = async () => {
  if (!editingTx.value) return
  
  isUpdating.value = true
  const { error } = await supabase.from('transactions').update({
    amount: parseFloat(editingTx.value.amount),
    status: editingTx.value.status,
    payment_method: editingTx.value.payment_method
  }).eq('id', editingTx.value.id)
  
  if (!error) {
    fetchTransactions()
    isEditingDialogVisible.value = false
    editingTx.value = null
  }
  isUpdating.value = false
}
</script>

<template>
  <div class="flex-1 space-y-6 p-6 bg-slate-50/30 min-h-screen relative">
    
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900">Espace Encaissements</h2>
        <p class="text-muted-foreground text-xs">Suivi des transactions échouées et création de liens de paiement.</p>
      </div>
      
      <!-- Tabs Switcher -->
      <div class="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
        <button 
          @click="activeTab = 'refused'"
          class="px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5"
          :class="[activeTab === 'refused' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700']"
        >
          <AlertCircle class="h-3.5 w-3.5" /> Paiements Refusés
        </button>
        <button 
          @click="activeTab = 'stripe'"
          class="px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5"
          :class="[activeTab === 'stripe' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700']"
        >
          <Link2 class="h-3.5 w-3.5" /> Liens Stripe
        </button>
      </div>

      <Dialog v-model:open="isEditingDialogVisible">
        <DialogContent class="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifier la transaction</DialogTitle>
            <DialogDescription>
              Modifiez les détails de la transaction.
            </DialogDescription>
          </DialogHeader>
          <div v-if="editingTx" class="grid gap-4 py-4">
            <div class="grid gap-2">
              <Label>Montant (€)</Label>
              <Input type="number" v-model="editingTx.amount" />
            </div>
            <div class="grid gap-2">
              <Label>Méthode de paiement</Label>
              <Input v-model="editingTx.payment_method" />
            </div>
            <div class="grid gap-2">
              <Label>Statut</Label>
              <select v-model="editingTx.status" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <option value="Refusé">Refusé</option>
                <option value="Payé">Payé</option>
                <option value="En attente">En attente</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button :disabled="isUpdating" @click="handleUpdateTransaction">
              <RefreshCw v-if="isUpdating" class="mr-2 h-4 w-4 animate-spin" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

    <!-- 1. SECTION: PAIEMENTS REFUSES -->
    <div v-if="activeTab === 'refused'" class="space-y-4">
      <Card class="border-slate-100 shadow-xs rounded-2xl overflow-hidden">
        <CardHeader class="p-6 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle class="text-base font-bold text-slate-900">Transactions Échouées</CardTitle>
            <CardDescription class="text-xs">Consultez la liste des rejets bancaires.</CardDescription>
          </div>
          <Button variant="ghost" size="icon" @click="fetchTransactions" class="rounded-xl">
            <RefreshCw class="h-4 w-4 text-slate-500" />
          </Button>
        </CardHeader>
        <CardContent class="p-0">
          <Table>
            <TableHeader class="bg-slate-50">
              <TableRow class="hover:bg-transparent border-slate-100">
                <TableHead class="text-slate-600 font-bold text-xs h-11">Date</TableHead>
                <TableHead class="text-slate-600 font-bold text-xs h-11">Client</TableHead>
                <TableHead class="text-slate-600 font-bold text-xs h-11">Montant</TableHead>
                <TableHead class="text-slate-600 font-bold text-xs h-11">Mode</TableHead>
                <TableHead class="text-slate-600 font-bold text-xs h-11">Statut</TableHead>
                <TableHead class="text-slate-600 font-bold text-xs h-11 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="tx in refusedTransactions" :key="tx.id" @click="openEditDialog(tx)" class="border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer">
                <TableCell class="text-xs font-medium text-slate-500">{{ formatDate(tx.created_at) }}</TableCell>
                <TableCell class="font-bold text-slate-800 text-sm">{{ getCustomerName(tx.customer_id) }}</TableCell>
                <TableCell class="font-black text-slate-900 text-sm">{{ tx.amount }} €</TableCell>
                <TableCell>
                  <Badge variant="secondary" class="text-[9px] uppercase font-bold px-2 py-0.5">{{ tx.payment_method || 'Inconnu' }}</Badge>
                </TableCell>
                <TableCell>
                  <Badge class="bg-rose-50 text-rose-600 border border-rose-200/50 text-[10px] font-bold rounded-lg px-2.5 py-1">
                    <XCircle class="h-3.5 w-3.5 mr-1" /> Refusé
                  </Badge>
                </TableCell>
                <TableCell class="text-right">
                   <Button variant="ghost" size="icon" @click.stop="openEditDialog(tx)" title="Modifier">
                    <Pencil class="h-4 w-4 text-indigo-600" />
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow v-if="refusedTransactions.length === 0">
                <TableCell colspan="5" class="h-32 text-center text-slate-400 text-sm italic">
                  Aucun paiement refusé dans l'historique.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>

    <!-- 2. SECTION: LIENS STRIPE -->
    <div v-if="activeTab === 'stripe'" class="grid gap-6 md:grid-cols-3">
      <!-- Formulaire de génération -->
      <Card class="border-slate-100 shadow-xs rounded-2xl md:col-span-1">
        <CardHeader class="p-6 border-b border-slate-100">
          <CardTitle class="text-base font-bold text-slate-900">Créer un Lien</CardTitle>
          <CardDescription class="text-xs">Générez un portail Stripe sécurisé.</CardDescription>
        </CardHeader>
        <CardContent class="p-6 space-y-4">
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-600 uppercase tracking-wider">Montant (€)</label>
            <Input 
              v-model="stripeAmount" 
              type="number" 
              placeholder="Ex: 150.00" 
              class="rounded-xl border-slate-200 focus-visible:ring-indigo-100" 
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-600 uppercase tracking-wider">Client (Optionnel)</label>
            <Input 
              v-model="stripeClient" 
              type="text" 
              placeholder="Ex: StayZen Conciergerie" 
              class="rounded-xl border-slate-200 focus-visible:ring-indigo-100" 
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-600 uppercase tracking-wider">Description</label>
            <Input 
              v-model="stripeDesc" 
              type="text" 
              placeholder="Ex: Facture #0144" 
              class="rounded-xl border-slate-200 focus-visible:ring-indigo-100" 
            />
          </div>

          <Button 
            @click="createStripeLink" 
            :disabled="isLoading || !stripeAmount"
            class="w-full bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl h-11"
          >
            {{ isLoading ? 'Génération...' : 'Créer le lien Stripe' }}
          </Button>
        </CardContent>
      </Card>

      <!-- Lien Généré -->
      <Card class="border-slate-100 shadow-xs rounded-2xl md:col-span-2 flex flex-col justify-center items-center p-8 bg-slate-50/50">
        <div v-if="generatedLink" class="w-full max-w-md bg-white p-6 rounded-2xl border border-indigo-50 shadow-md space-y-4 text-center animate-in fade-in zoom-in-95 duration-300">
          <div class="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto border border-indigo-100">
            <CreditCard class="h-6 w-6" />
          </div>
          <h3 class="text-lg font-bold text-slate-900">Lien Prêt à l'Envoi</h3>
          <p class="text-xs text-slate-500 font-medium">Partagez cette adresse de paiement Stripe avec le client.</p>
          
          <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-mono text-indigo-600 break-all select-all select-none">
            {{ generatedLink }}
          </div>

          <div class="flex gap-2">
            <Button variant="outline" class="flex-1 rounded-xl font-bold" @click="generatedLink = ''">
              Nouveau
            </Button>
            <a :href="generatedLink" target="_blank" class="flex-1">
              <Button class="w-full bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold flex items-center justify-center gap-1.5">
                Ouvrir <ExternalLink class="h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>

        <div v-else class="text-center text-slate-400 space-y-2">
          <div class="w-12 h-12 bg-slate-100/80 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Link2 class="h-5 w-5" />
          </div>
          <p class="text-sm font-bold">En attente de création...</p>
          <p class="text-xs max-w-xs text-slate-400">Remplissez les informations de prix pour générer le lien sécurisé.</p>
        </div>
      </Card>
    </div>

  </div>
</template>
