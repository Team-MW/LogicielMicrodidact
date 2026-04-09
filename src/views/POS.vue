<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus, Minus, Search, ShoppingCart, CreditCard, Banknote, CheckCircle2, XCircle } from 'lucide-vue-next'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { api } from '@/services/api'

const products = [
  { id: 1, name: 'Logiciel de Gestion', price: 299.99, category: 'Logiciel' },
  { id: 2, name: 'Maintenance Mensuelle', price: 49.99, category: 'Service' },
  { id: 3, name: 'Formation Utilisateur', price: 150.00, category: 'Service' },
  { id: 4, name: 'Licence Supplémentaire', price: 89.00, category: 'Logiciel' },
  { id: 5, name: 'Support Premium', price: 199.00, category: 'Service' },
  { id: 6, name: 'Installation sur Site', price: 250.00, category: 'Service' },
]

const cart = ref<any[]>([])
const searchQuery = ref('')
const payments = ref<any[]>([])
const customers = ref<any[]>([])

onMounted(async () => {
  payments.value = await api.getPayments ? await api.getPayments() : []
  customers.value = await api.getCustomers()
})

const getCustomerName = (id: number) => {
  const customer = customers.value.find(c => c.id === id)
  return customer ? customer.name : 'Inconnu'
}

const filteredProducts = computed(() => {
  return products.filter(p => p.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
})

const addToCart = (product: any) => {
  const item = cart.value.find(i => i.id === product.id)
  if (item) {
    item.quantity++
  } else {
    cart.value.push({ ...product, quantity: 1 })
  }
}

const removeFromCart = (index: number) => {
  cart.value.splice(index, 1)
}

const updateQuantity = (index: number, delta: number) => {
  const item = cart.value[index]
  item.quantity += delta
  if (item.quantity <= 0) {
    removeFromCart(index)
  }
}

const total = computed(() => {
  return cart.value.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2)
})

const handleCheckout = async (method: string) => {
  if (cart.value.length === 0) return
  
  // Simulate payment processing
  // Randomly fail for demo purposes if it's over 500e
  const success = parseFloat(total.value) > 500 ? Math.random() > 0.3 : true
  
  const newPayment = {
    customerId: 1, // Default for POS
    amount: `${total.value} €`,
    status: success ? 'Payé' : 'Refusé',
    date: new Date().toISOString().split('T')[0],
    method: method
  }
  
  // Save to api
  // In a real app we'd have a createPayment method
  // For now let's just push to our local state
  payments.value.unshift({ id: Date.now(), ...newPayment })
  
  if (success) {
    alert('Paiement validé avec succès !')
    cart.value = []
  } else {
    alert('Paiement refusé par la banque.')
  }
}
</script>

<template>
  <div class="flex-1 space-y-8 p-8 pt-6">
    <div class="flex items-center justify-between">
      <h2 class="text-3xl font-bold tracking-tight">Espace Vente & Encaissement</h2>
    </div>

    <!-- Top Section: POS Interface -->
    <div class="flex gap-6 h-[500px]">
      <!-- Products List -->
      <Card class="flex-1 flex flex-col overflow-hidden">
        <CardHeader class="border-b pb-4">
          <div class="flex items-center justify-between">
            <CardTitle>Catalogue Produits</CardTitle>
            <div class="relative w-64">
              <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input v-model="searchQuery" placeholder="Rechercher..." class="pl-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent class="flex-1 overflow-auto p-6">
          <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="product in filteredProducts" :key="product.id" 
              class="group p-4 rounded-xl border-2 border-slate-100 hover:border-primary hover:shadow-md transition-all cursor-pointer active:scale-95 bg-white"
              @click="addToCart(product)">
              <Badge variant="secondary" class="mb-2">{{ product.category }}</Badge>
              <h4 class="font-bold text-slate-800">{{ product.name }}</h4>
              <p class="text-xl font-black text-primary mt-2">{{ product.price.toFixed(2) }} €</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Cart Sidebar -->
      <Card class="w-[400px] flex flex-col border-2 border-primary/10 shadow-lg">
        <CardHeader class="bg-primary/5 border-b">
          <CardTitle class="flex items-center gap-2 text-primary">
            <ShoppingCart class="h-5 w-5" /> Panier Actuel
          </CardTitle>
        </CardHeader>
        <CardContent class="flex-1 overflow-auto p-4 space-y-3">
          <div v-if="cart.length === 0" class="h-full flex flex-col items-center justify-center text-muted-foreground italic py-12">
            <ShoppingCart class="h-10 w-10 opacity-10 mb-2" />
            <p>Panier vide</p>
          </div>
          <div v-for="(item, index) in cart" :key="item.id" class="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-100">
            <div class="space-y-1">
              <p class="font-bold text-sm">{{ item.name }}</p>
              <p class="text-xs text-muted-foreground font-medium">{{ item.price.toFixed(2) }} €</p>
            </div>
            <div class="flex items-center gap-2">
              <div class="flex items-center bg-slate-100 rounded-lg p-1">
                <Button variant="ghost" size="icon" class="h-6 w-6" @click="updateQuantity(index, -1)">
                  <Minus class="h-3 w-3" />
                </Button>
                <span class="w-6 text-center text-xs font-bold">{{ item.quantity }}</span>
                <Button variant="ghost" size="icon" class="h-6 w-6" @click="updateQuantity(index, 1)">
                  <Plus class="h-3 w-3" />
                </Button>
              </div>
              <Button variant="ghost" size="icon" class="h-8 w-8 text-rose-500 hover:bg-rose-50" @click="removeFromCart(index)">
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter class="flex-col gap-4 border-t pt-6 bg-slate-50/80 p-6">
          <div class="w-full flex justify-between items-center px-1">
            <span class="text-slate-500 font-bold uppercase text-xs tracking-wider">Total à payer</span>
            <span class="text-2xl font-black text-primary">{{ total }} €</span>
          </div>
          <div class="grid grid-cols-2 gap-3 w-full">
            <Button variant="outline" class="h-12 border-2" @click="handleCheckout('Espèces')">
              <Banknote class="h-4 w-4 mr-2" /> Espèces
            </Button>
            <Button class="h-12 shadow-md shadow-primary/20" @click="handleCheckout('Carte Bancaire')">
              <CreditCard class="h-4 w-4 mr-2" /> Carte
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>

    <!-- Bottom Section: Simple History Table -->
    <Card>
      <CardHeader>
        <CardTitle>Dernières Transactions</CardTitle>
        <CardDescription>Historique des paiements encaissés ou refusés.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Mode</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="payment in payments" :key="payment.id" class="hover:bg-slate-50/50 transition-colors">
              <TableCell class="text-xs text-muted-foreground">{{ payment.date }}</TableCell>
              <TableCell class="font-semibold">{{ getCustomerName(payment.customerId) }}</TableCell>
              <TableCell class="font-bold text-lg">{{ payment.amount }}</TableCell>
              <TableCell>
                <Badge 
                  :variant="payment.status === 'Payé' ? 'default' : 'destructive'"
                  class="rounded-full px-3"
                  :class="payment.status === 'Payé' ? 'bg-emerald-500' : ''"
                >
                  <CheckCircle2 v-if="payment.status === 'Payé'" class="h-3 w-3 mr-1" />
                  <XCircle v-else class="h-3 w-3 mr-1" />
                  {{ payment.status === 'Payé' ? 'Validé' : 'Refusé' }}
                </Badge>
              </TableCell>
              <TableCell>
                <span class="text-xs uppercase font-medium text-slate-400 tracking-tighter">{{ payment.method }}</span>
              </TableCell>
            </TableRow>
            <TableRow v-if="payments.length === 0">
              <TableCell colspan="5" class="h-24 text-center text-muted-foreground">
                Aucune transaction enregistrée.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
</template>
