<script setup lang="ts">
import { ref, computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus, Minus, Search, ShoppingCart, CreditCard, Banknote } from 'lucide-vue-next'

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
</script>

<template>
  <div class="flex h-full gap-6 p-8">
    <!-- Products List -->
    <div class="flex-1 space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-3xl font-bold tracking-tight">Encaissement</h2>
        <div class="relative w-64">
          <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input v-model="searchQuery" placeholder="Rechercher un produit..." class="pl-8" />
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card v-for="product in filteredProducts" :key="product.id" 
          class="cursor-pointer transition-all hover:border-primary hover:shadow-sm"
          @click="addToCart(product)">
          <CardHeader class="pb-2">
            <Badge variant="secondary" class="w-fit mb-2">{{ product.category }}</Badge>
            <CardTitle class="text-lg">{{ product.name }}</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-xl font-bold text-primary">{{ product.price.toFixed(2) }} €</div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Checkout Sidebar -->
    <Card class="w-[400px] flex flex-col h-[calc(100vh-8rem)]">
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <ShoppingCart class="h-5 w-5" /> Panier Actuel
        </CardTitle>
      </CardHeader>
      <CardContent class="flex-1 overflow-auto space-y-4">
        <div v-if="cart.length === 0" class="h-full flex flex-col items-center justify-center text-muted-foreground italic">
          <ShoppingCart class="h-12 w-12 mb-2 opacity-20" />
          Votre panier est vide
        </div>
        <div v-for="(item, index) in cart" :key="item.id" class="flex items-center justify-between border-b pb-4 last:border-0">
          <div class="space-y-1">
            <p class="font-medium">{{ item.name }}</p>
            <p class="text-sm text-muted-foreground">{{ item.price.toFixed(2) }} €</p>
          </div>
          <div class="flex items-center gap-3">
            <div class="flex items-center border rounded-md">
              <Button variant="ghost" size="icon" class="h-8 w-8" @click="updateQuantity(index, -1)">
                <Minus class="h-3 w-3" />
              </Button>
              <span class="w-8 text-center text-sm font-medium">{{ item.quantity }}</span>
              <Button variant="ghost" size="icon" class="h-8 w-8" @click="updateQuantity(index, 1)">
                <Plus class="h-3 w-3" />
              </Button>
            </div>
            <Button variant="ghost" size="icon" class="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50" @click="removeFromCart(index)">
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter class="flex-col gap-4 border-t pt-6 bg-slate-50/50">
        <div class="w-full flex justify-between items-center text-lg font-bold">
          <span>Total à payer</span>
          <span class="text-2xl text-primary">{{ total }} €</span>
        </div>
        <div class="grid grid-cols-2 gap-3 w-full">
          <Button variant="outline" class="h-12 flex gap-2">
            <Banknote class="h-4 w-4" /> Espèces
          </Button>
          <Button class="h-12 flex gap-2">
            <CreditCard class="h-4 w-4" /> Carte Bancaire
          </Button>
        </div>
      </CardFooter>
    </Card>
  </div>
</template>
