<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BarChart3, Users, DollarSign, Package, ArrowUpRight } from 'lucide-vue-next'

const stats = [
  { name: 'Ventes Totales', value: '45,231.89 €', change: '+20.1%', icon: DollarSign, color: 'text-emerald-600' },
  { name: 'Nouveaux Clients', value: '+2,350', change: '+180.1%', icon: Users, color: 'text-blue-600' },
  { name: 'Projets Actifs', value: '12', change: '+2', icon: Package, color: 'text-orange-600' },
  { name: 'Taux de Conversion', value: '4.3%', change: '+1.2%', icon: BarChart3, color: 'text-purple-600' },
]

const recentTransactions = [
  { id: 'TX1234', customer: 'Jean Dupont', product: 'Logiciel CRM', amount: '1,200.00 €', status: 'Payé', date: 'il y a 2h' },
  { id: 'TX1235', customer: 'Marie Curie', product: 'Maintenance Annuelle', amount: '450.00 €', status: 'En attente', date: 'il y a 5h' },
  { id: 'TX1236', customer: 'Pierre Martin', product: 'Consulting', amount: '2,500.00 €', status: 'Payé', date: 'Hier' },
  { id: 'TX1237', customer: 'Sophie Lefebvre', product: 'Licence Pro', amount: '899.00 €', status: 'Annulé', date: 'Hier' },
]
</script>

<template>
  <div class="flex-1 space-y-4 p-8 pt-6">
    <div class="flex items-center justify-between space-y-2">
      <h2 class="text-3xl font-bold tracking-tight">Tableau de bord</h2>
      <div class="flex items-center space-x-2">
        <Button>Télécharger le rapport</Button>
      </div>
    </div>
    
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card v-for="stat in stats" :key="stat.name" class="overflow-hidden transition-all hover:shadow-md">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">{{ stat.name }}</CardTitle>
          <component :is="stat.icon" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stat.value }}</div>
          <p class="text-xs text-muted-foreground">
            <span :class="stat.change.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'" class="font-medium">
              {{ stat.change }}
            </span>
            par rapport au mois dernier
          </p>
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card class="col-span-4">
        <CardHeader>
          <CardTitle>Aperçu des Ventes</CardTitle>
          <CardDescription>Visualisation de vos revenus ce mois-ci.</CardDescription>
        </CardHeader>
        <CardContent class="pl-2">
          <div class="h-[300px] w-full flex items-end justify-between px-4 pb-2">
            <!-- Simulated Chart -->
            <div v-for="i in 12" :key="i" 
              class="w-8 bg-primary/20 rounded-t-sm transition-all hover:bg-primary"
              :style="{ height: Math.floor(Math.random() * 80 + 20) + '%' }"
            ></div>
          </div>
          <div class="flex justify-between px-4 text-xs text-muted-foreground mt-2">
            <span>Jan</span><span>Fev</span><span>Mar</span><span>Avr</span><span>Mai</span><span>Jun</span>
            <span>Jul</span><span>Aou</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
          </div>
        </CardContent>
      </Card>

      <Card class="col-span-3">
        <CardHeader>
          <CardTitle>Transactions Récentes</CardTitle>
          <CardDescription>Vous avez réalisé 25 ventes aujourd'hui.</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-8">
            <div v-for="tx in recentTransactions" :key="tx.id" class="flex items-center">
              <div class="ml-4 space-y-1">
                <p class="text-sm font-medium leading-none">{{ tx.customer }}</p>
                <p class="text-sm text-muted-foreground">{{ tx.product }}</p>
              </div>
              <div class="ml-auto font-medium">
                <div class="text-right">{{ tx.amount }}</div>
                <Badge :variant="tx.status === 'Payé' ? 'default' : tx.status === 'En attente' ? 'secondary' : 'destructive'" class="mt-1">
                  {{ tx.status }}
                </Badge>
              </div>
            </div>
          </div>
          <Button variant="ghost" class="w-full mt-6">
            Voir tout <ArrowUpRight class="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
