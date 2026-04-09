<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Search, UserPlus, Mail, Phone, MoreHorizontal, Loader2, Globe } from 'lucide-vue-next'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
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
import { api } from '@/services/api'

const customers = ref<any[]>([])
const websites = ref<any[]>([])
const searchQuery = ref('')
const isAdding = ref(false)
const isDialogOpen = ref(false)

const newCustomer = ref({
  name: '',
  email: '',
  phone: '',
  websiteName: '',
  websiteUrl: '',
})

onMounted(async () => {
  customers.value = await api.getCustomers()
  websites.value = await api.getWebsites()
})

const getCustomerWebsite = (customerId: number) => {
  return websites.value.find(s => s.customerId === customerId)
}

const filteredCustomers = computed(() => {
  if (!searchQuery.value) return customers.value
  const query = searchQuery.value.toLowerCase()
  return customers.value.filter(c => 
    c.name.toLowerCase().includes(query) || 
    c.email.toLowerCase().includes(query) ||
    c.phone.toLowerCase().includes(query)
  )
})

const handleAddCustomer = async () => {
  if (!newCustomer.value.name || !newCustomer.value.email) return
  
  isAdding.value = true
  
  // Create the customer
  await api.createCustomer({ 
    name: newCustomer.value.name,
    email: newCustomer.value.email,
    phone: newCustomer.value.phone 
  })
  
  // If website info is provided, create the website entry linked to this new customer
  const allCustomers = await api.getCustomers()
  const latestCustomer = allCustomers[allCustomers.length - 1]

  if (newCustomer.value.websiteUrl && latestCustomer) {
    await api.createWebsite({
      name: newCustomer.value.websiteName || 'Site sans nom',
      url: newCustomer.value.websiteUrl,
      customerId: latestCustomer.id
    })
    websites.value = await api.getWebsites() // Refresh websites list too
  }

  customers.value = allCustomers // Refresh list
  
  // Reset form
  newCustomer.value = { name: '', email: '', phone: '', websiteName: '', websiteUrl: '' }
  isAdding.value = false
  isDialogOpen.value = false
}
</script>

<template>
  <div class="flex-1 space-y-4 p-8 pt-6">
    <div class="flex items-center justify-between">
      <h2 class="text-3xl font-bold tracking-tight">Gestion des Clients</h2>
      
      <Dialog v-model:open="isDialogOpen">
        <DialogTrigger asChild>
          <Button><UserPlus class="mr-2 h-4 w-4" /> Ajouter un client</Button>
        </DialogTrigger>
        <DialogContent class="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Ajouter un nouveau client</DialogTitle>
            <DialogDescription>
              Remplissez les informations et optionnellement assignez un site web.
            </DialogDescription>
          </DialogHeader>
          <div class="grid gap-4 py-4">
            <div class="space-y-4">
              <h4 class="text-sm font-medium border-b pb-2">Informations personnelles</h4>
              <div class="grid grid-cols-4 items-center gap-4">
                <Label for="name" class="text-right">Nom</Label>
                <Input id="name" v-model="newCustomer.name" placeholder="Jean Dupont" class="col-span-3" />
              </div>
              <div class="grid grid-cols-4 items-center gap-4">
                <Label for="email" class="text-right">Email</Label>
                <Input id="email" v-model="newCustomer.email" placeholder="jean@email.com" class="col-span-3" />
              </div>
              <div class="grid grid-cols-4 items-center gap-4">
                <Label for="phone" class="text-right">Téléphone</Label>
                <Input id="phone" v-model="newCustomer.phone" placeholder="+33 6..." class="col-span-3" />
              </div>
            </div>

            <div class="space-y-4 pt-2">
              <h4 class="text-sm font-medium border-b pb-2 flex items-center gap-2">
                <Globe class="h-4 w-4" /> Site Internet (Optionnel)
              </h4>
              <div class="grid grid-cols-4 items-center gap-4">
                <Label for="siteName" class="text-right text-xs">Nom Site</Label>
                <Input id="siteName" v-model="newCustomer.websiteName" placeholder="Mon Portfolio" class="col-span-3" />
              </div>
              <div class="grid grid-cols-4 items-center gap-4">
                <Label for="siteUrl" class="text-right text-xs">URL</Label>
                <Input id="siteUrl" v-model="newCustomer.websiteUrl" placeholder="https://..." class="col-span-3" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" :disabled="isAdding" @click="handleAddCustomer">
              <Loader2 v-if="isAdding" class="mr-2 h-4 w-4 animate-spin" />
              Enregistrer le client et le site
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Liste des Clients</CardTitle>
        <CardDescription>Consultez et gérez les informations de vos clients.</CardDescription>
        <div class="flex items-center pt-4">
          <div class="relative w-full max-w-sm">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input v-model="searchQuery" placeholder="Rechercher un client..." class="pl-10" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Site Web</TableHead>
              <TableHead class="text-right">Total Dépensé</TableHead>
              <TableHead class="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="customer in filteredCustomers" :key="customer.id" 
              class="cursor-pointer hover:bg-slate-50 transition-colors"
              @click="$router.push(`/customers/${customer.id}`)">
              <TableCell class="font-medium">
                <div class="flex items-center gap-3">
                  <Avatar class="h-8 w-8">
                    <AvatarFallback>{{ customer.name.split(' ').map((n: string) => n[0]).join('') }}</AvatarFallback>
                  </Avatar>
                  <span class="hover:underline hover:text-primary transition-all">{{ customer.name }}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge :variant="customer.status === 'VIP' ? 'default' : customer.status === 'Actif' ? 'secondary' : 'outline'">
                  {{ customer.status }}
                </Badge>
              </TableCell>
              <TableCell>
                <div class="flex flex-col text-xs text-muted-foreground">
                  <span class="flex items-center gap-1"><Mail class="h-3 w-3" /> {{ customer.email }}</span>
                  <span class="flex items-center gap-1"><Phone class="h-3 w-3" /> {{ customer.phone }}</span>
                </div>
              </TableCell>
              <TableCell>
                <div v-if="getCustomerWebsite(customer.id)" class="flex items-center gap-2">
                  <Badge variant="outline" class="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100 transition-colors">
                    <Globe class="h-3 w-3 mr-1" />
                    {{ getCustomerWebsite(customer.id).name }}
                  </Badge>
                </div>
                <span v-else class="text-xs text-muted-foreground italic">Aucun site</span>
              </TableCell>
              <TableCell class="text-right font-medium">{{ customer.totalSpent }}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal class="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem>Modifier le profil</DropdownMenuItem>
                    <DropdownMenuItem>Voir l'historique</DropdownMenuItem>
                    <DropdownMenuItem class="text-rose-500">Désactiver</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
            <TableRow v-if="filteredCustomers.length === 0">
              <TableCell colspan="6" class="h-24 text-center text-muted-foreground">
                Aucun client trouvé.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
</template>
