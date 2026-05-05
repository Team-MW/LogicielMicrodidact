<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  CreditCard,  
  Calendar,  
  ArrowLeft,  
  Mail,  
  Globe,  
  TrendingUp,  
  CheckCircle2,
  AlertCircle,  
  Plus,
  Pencil,
  Loader2
} from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { api } from '@/services/api'

const route = useRoute()
const customerId = parseInt(route.params.id as string)

const customer = ref<any>(null)
const payments = ref<any[]>([])
const subscriptions = ref<any[]>([])
const websites = ref<any[]>([])
const isLoading = ref(true)

onMounted(async () => {
  const allCustomers = await api.getCustomers()
  customer.value = allCustomers.find(c => c.id === customerId)
  
  const allPayments = await api.getPayments ? await api.getPayments() : []
  payments.value = (allPayments || []).filter((p: any) => p.customerId === customerId)
  
  const allSubscriptions = await api.getSubscriptions ? await api.getSubscriptions() : []
  subscriptions.value = (allSubscriptions || []).filter((s: any) => s.customerId === customerId)

  const allWebsites = await api.getWebsites()
  websites.value = allWebsites.filter(s => s.customerId === customerId)
  
  isLoading.value = false
})

const totalPaid = computed(() => {
  return payments.value
    .filter(p => p.status === 'Payé')
    .reduce((acc, p) => acc + parseFloat(p.amount.replace(' €', '').replace(',', '.')), 0)
    .toLocaleString() + ' €'
})

const editingCustomer = ref<any>(null)
const isEditingDialogVisible = ref(false)
const isUpdating = ref(false)

const openEditDialog = () => {
  editingCustomer.value = { ...customer.value }
  isEditingDialogVisible.value = true
}

const handleUpdateCustomer = async () => {
  if (!editingCustomer.value || !editingCustomer.value.name || !editingCustomer.value.email) return
  
  isUpdating.value = true
  await api.updateCustomer(editingCustomer.value.id, {
    name: editingCustomer.value.name,
    email: editingCustomer.value.email,
    phone: editingCustomer.value.phone,
    status: editingCustomer.value.status
  })
  
  customer.value = { ...editingCustomer.value }
  isUpdating.value = false
  isEditingDialogVisible.value = false
  editingCustomer.value = null
}
</script>

<template>
  <div v-if="customer" class="flex-1 space-y-6 p-8 pt-6">
    <!-- Header with Back Button -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <Button variant="outline" size="icon" @click="$router.back()">
          <ArrowLeft class="h-4 w-4" />
        </Button>
        <Avatar class="h-12 w-12 border-2 border-primary/10">
          <AvatarFallback>{{ customer.name.split(' ').map((n: string) => n[0]).join('') }}</AvatarFallback>
        </Avatar>
        <div>
          <h2 class="text-3xl font-bold tracking-tight">{{ customer.name }}</h2>
          <p class="text-muted-foreground">Tableau de bord personnel du client</p>
        </div>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" @click="openEditDialog"><Pencil class="mr-2 h-4 w-4" /> Modifier Profil</Button>
        <Button variant="outline"><Mail class="mr-2 h-4 w-4" /> Message</Button>
        <Button><Plus class="mr-2 h-4 w-4" /> Créer Facture</Button>
      </div>
    </div>

    <!-- Edit Customer Dialog -->
    <Dialog v-model:open="isEditingDialogVisible">
        <DialogContent class="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifier le client</DialogTitle>
            <DialogDescription>
              Modifiez les informations du client ci-dessous.
            </DialogDescription>
          </DialogHeader>
          <div v-if="editingCustomer" class="grid gap-4 py-4">
            <div class="space-y-4">
              <div class="grid grid-cols-4 items-center gap-4">
                <Label for="edit-name" class="text-right">Nom</Label>
                <Input id="edit-name" v-model="editingCustomer.name" class="col-span-3" />
              </div>
              <div class="grid grid-cols-4 items-center gap-4">
                <Label for="edit-email" class="text-right">Email</Label>
                <Input id="edit-email" v-model="editingCustomer.email" class="col-span-3" />
              </div>
              <div class="grid grid-cols-4 items-center gap-4">
                <Label for="edit-phone" class="text-right">Téléphone</Label>
                <Input id="edit-phone" v-model="editingCustomer.phone" class="col-span-3" />
              </div>
              <div class="grid grid-cols-4 items-center gap-4">
                <Label for="edit-status" class="text-right">Statut</Label>
                <select id="edit-status" v-model="editingCustomer.status" class="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <option value="Actif">Actif</option>
                  <option value="Inactif">Inactif</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" :disabled="isUpdating" @click="handleUpdateCustomer">
              <Loader2 v-if="isUpdating" class="mr-2 h-4 w-4 animate-spin" />
              Enregistrer les modifications
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    <!-- Quick Stats -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Total Encaissé</CardTitle>
          <TrendingUp class="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-emerald-600">{{ totalPaid }}</div>
          <p class="text-xs text-muted-foreground">Depuis le début du contrat</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Abonnements Actifs</CardTitle>
          <CreditCard class="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ subscriptions.length }}</div>
          <p class="text-xs text-muted-foreground">Revenus récurrents actifs</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Sites Web</CardTitle>
          <Globe class="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ websites.length }}</div>
          <p class="text-xs text-muted-foreground">Propriétés déployées</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Statut Client</CardTitle>
          <CheckCircle2 v-if="customer.status === 'Actif' || customer.status === 'VIP'" class="h-4 w-4 text-emerald-500" />
          <AlertCircle v-else class="h-4 w-4 text-rose-500" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ customer.status }}</div>
          <Badge class="mt-1" :variant="customer.status === 'VIP' ? 'default' : 'secondary'">{{ customer.status }}</Badge>
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
      <!-- Payments Table -->
      <Card class="lg:col-span-4">
        <CardHeader>
          <CardTitle>Historique des Paiements</CardTitle>
          <CardDescription>Liste des dernières transactions validées ou en attente.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Méthode</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="payment in payments" :key="payment.id">
                <TableCell>{{ payment.date }}</TableCell>
                <TableCell class="font-bold">{{ payment.amount }}</TableCell>
                <TableCell>{{ payment.method }}</TableCell>
                <TableCell>
                  <Badge :variant="payment.status === 'Payé' ? 'default' : 'outline'">
                    {{ payment.status }}
                  </Badge>
                </TableCell>
              </TableRow>
              <TableRow v-if="payments.length === 0">
                <TableCell colspan="4" class="text-center py-6 text-muted-foreground italic">
                  Aucun paiement enregistré pour ce client.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <!-- Subscriptions / Recurring Payments -->
      <Card class="lg:col-span-3">
        <CardHeader>
          <CardTitle>Abonnements & Récurrents</CardTitle>
          <CardDescription>Paiements automatiques (Prélèvement Stripe).</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div v-for="sub in subscriptions" :key="sub.id" 
              class="flex items-center justify-between p-4 rounded-xl border bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div class="space-y-1">
                <p class="font-semibold text-sm">{{ sub.name }}</p>
                <div class="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar class="h-3 w-3" />
                  Próchain prélèvement : {{ sub.nextBilling }}
                </div>
              </div>
              <div class="text-right">
                <p class="font-bold">{{ sub.amount }}</p>
                <Badge :variant="sub.status === 'Actif' ? 'default' : 'destructive'" class="text-[10px] h-4">
                  {{ sub.status }}
                </Badge>
              </div>
            </div>

            <div v-if="subscriptions.length === 0" class="text-center py-12 border-2 border-dashed rounded-xl">
              <CreditCard class="h-8 w-8 mx-auto opacity-20 mb-2" />
              <p class="text-sm text-muted-foreground italic">Aucun abonnement actif</p>
              <Button variant="ghost" size="sm" class="mt-2 text-primary font-medium">Activer Stripe</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Websites Linked -->
    <Card>
      <CardHeader>
        <CardTitle>Sites Internet Assignés</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div v-for="site in websites" :key="site.id" 
            class="flex items-center justify-between p-4 rounded-lg border">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-primary/10 rounded-lg">
                <Globe class="h-4 w-4 text-primary" />
              </div>
              <div>
                <p class="font-semibold text-sm">{{ site.name }}</p>
                <p class="text-xs text-muted-foreground">{{ site.url }}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" @click="$router.push('/websites')">
              <TrendingUp class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
  <div v-else-if="!isLoading" class="flex flex-col items-center justify-center h-[80vh]">
    <AlertCircle class="h-12 w-12 text-rose-500 opacity-20 mb-4" />
    <h3 class="text-xl font-bold">Client non trouvé</h3>
    <Button class="mt-4" @click="$router.push('/customers')">Retour à la liste</Button>
  </div>
</template>
