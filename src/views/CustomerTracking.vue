<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Search, Plus, MessageSquare, Phone, Mail, Calendar, Loader2 } from 'lucide-vue-next'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/services/api'

const trackingData = ref<any[]>([])
const customers = ref<any[]>([])
const searchQuery = ref('')
const isAdding = ref(false)
const isDialogOpen = ref(false)

const newEntry = ref({
  customerId: '',
  type: 'Appel',
  notes: '',
  agent: 'Admin User'
})

onMounted(async () => {
  trackingData.value = await api.getTracking()
  customers.value = await api.getCustomers()
})

const getCustomerName = (id: number) => {
  const customer = customers.value.find(c => c.id === id)
  return customer ? customer.name : 'Inconnu'
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'Appel': return Phone
    case 'Email': return Mail
    case 'Réunion': return MessageSquare
    default: return MessageSquare
  }
}

const filteredTracking = computed(() => {
  if (!searchQuery.value) return trackingData.value
  const query = searchQuery.value.toLowerCase()
  return trackingData.value.filter(item => {
    const customerName = getCustomerName(item.customerId).toLowerCase()
    return customerName.includes(query) || 
           item.notes.toLowerCase().includes(query) || 
           item.agent.toLowerCase().includes(query)
  })
})

const handleAddTracking = async () => {
  if (!newEntry.value.customerId || !newEntry.value.notes) return
  
  isAdding.value = true
  await api.createTracking({ 
    ...newEntry.value, 
    customerId: parseInt(newEntry.value.customerId) 
  })
  trackingData.value = await api.getTracking()
  
  newEntry.value = { customerId: '', type: 'Appel', notes: '', agent: 'Admin User' }
  isAdding.value = false
  isDialogOpen.value = false
}
</script>

<template>
  <div class="flex-1 space-y-4 p-8 pt-6">
    <div class="flex items-center justify-between">
      <h2 class="text-3xl font-bold tracking-tight">Suivis Clients</h2>
      
      <Dialog v-model:open="isDialogOpen">
        <DialogTrigger asChild>
          <Button><Plus class="mr-2 h-4 w-4" /> Nouveau Suivi</Button>
        </DialogTrigger>
        <DialogContent class="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Ajouter un suivi</DialogTitle>
            <DialogDescription>
              Enregistrez une nouvelle interaction avec un client.
            </DialogDescription>
          </DialogHeader>
          <div class="grid gap-4 py-4">
            <div class="grid gap-2">
              <Label>Client</Label>
              <Select v-model="newEntry.customerId">
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
              <Label>Type d'interaction</Label>
              <Select v-model="newEntry.type">
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Appel">Appel</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="Réunion">Réunion</SelectItem>
                  <SelectItem value="Autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="grid gap-2">
              <Label>Notes</Label>
              <Textarea v-model="newEntry.notes" placeholder="Détails de l'échange..." />
            </div>
          </div>
          <DialogFooter>
            <Button :disabled="isAdding || !newEntry.customerId || !newEntry.notes" @click="handleAddTracking">
              <Loader2 v-if="isAdding" class="mr-2 h-4 w-4 animate-spin" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Historique des interactions</CardTitle>
        <CardDescription>Suivi interne des échanges avec vos clients.</CardDescription>
        <div class="flex items-center pt-4">
          <div class="relative w-full max-w-sm">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input v-model="searchQuery" placeholder="Rechercher un suivi (client, note, agent)..." class="pl-10" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Agent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="item in filteredTracking" :key="item.id">
              <TableCell class="font-medium">
                {{ getCustomerName(item.customerId) }}
              </TableCell>
              <TableCell>
                <Badge variant="outline" class="flex w-fit items-center gap-1">
                  <component :is="getTypeIcon(item.type)" class="h-3.5 w-3.5" />
                  {{ item.type }}
                </Badge>
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-2 text-muted-foreground">
                  <Calendar class="h-4 w-4" />
                  {{ item.date }}
                </div>
              </TableCell>
              <TableCell class="max-w-[300px] truncate" :title="item.notes">
                {{ item.notes }}
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-2">
                  <Avatar class="h-6 w-6">
                    <AvatarFallback>{{ item.agent[0] }}</AvatarFallback>
                  </Avatar>
                  {{ item.agent }}
                </div>
              </TableCell>
            </TableRow>
            <TableRow v-if="filteredTracking.length === 0">
              <TableCell colspan="5" class="h-24 text-center text-muted-foreground">
                Aucun suivi trouvé.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
</template>
