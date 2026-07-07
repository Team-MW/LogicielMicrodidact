<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, Users, DollarSign, Package } from 'lucide-vue-next'
import { supabase } from '@/lib/supabase'

const stats = ref([
  { name: 'Ventes Totales (Stripe)', value: '0.00 €', change: 'En direct', icon: DollarSign, color: 'text-emerald-600' },
  { name: 'Clients Actifs', value: '0', change: 'En direct', icon: Users, color: 'text-blue-600' },
  { name: 'Projets Actifs', value: '0', change: 'En direct', icon: Package, color: 'text-orange-600' },
  { name: 'Revenus (7 jours)', value: '0.00 €', change: '+ 0.00 € aujourd\'hui', icon: BarChart3, color: 'text-purple-600' },
])

const chartData = ref(Array(12).fill(0))
const maxMonthlySale = ref(1) // Avoid division by zero
const isStripeLoading = ref(true)

onMounted(async () => {
  try {
    // 1. Ventes Totales (Stripe + Transactions locales si besoin, on priorise Stripe ici)
    try {
      const res = await fetch('/api/stripe/invoices')
      const invoices = await res.json()
      
      if (Array.isArray(invoices)) {
        let totalStripeSales = 0
        let revenueWeek = 0
        let revenueToday = 0
        
        const monthlySales = Array(12).fill(0)
        const now = new Date()
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
        const weekStart = todayStart - (7 * 24 * 60 * 60 * 1000)
        
        invoices.forEach(inv => {
          if (inv.status === 'paid') {
            const amount = inv.amount_paid / 100 // Convertir les centimes en euros
            totalStripeSales += amount
            
            const date = new Date(inv.created * 1000)
            const time = date.getTime()
            
            // Calcul semaine et aujourd'hui
            if (time >= weekStart) {
              revenueWeek += amount
            }
            if (time >= todayStart) {
              revenueToday += amount
            }
            
            // Calculer pour le graphique
            const currentYear = now.getFullYear()
            if (date.getFullYear() === currentYear) {
              const month = date.getMonth() // 0 to 11
              monthlySales[month] += amount
            }
          }
        })
        
        stats.value[0].value = `${totalStripeSales.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`
        stats.value[3].value = `${revenueWeek.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`
        stats.value[3].change = `+ ${revenueToday.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € aujourd'hui`
        
        // Mise à jour du graphique
        chartData.value = monthlySales
        const max = Math.max(...monthlySales)
        maxMonthlySale.value = max > 0 ? max : 1
      }
    } catch (e) {
      console.error('Erreur Stripe Dashboard:', e)
    } finally {
      isStripeLoading.value = false
    }

    // 2. Clients Actifs
    const { count: clientCount } = await supabase.from('customers').select('*', { count: 'exact', head: true })
    if (clientCount !== null) {
      stats.value[1].value = clientCount.toString()
    }

    // 3. Projets Actifs
    const { count: projectCount } = await supabase.from('projects').select('*', { count: 'exact', head: true })
    if (projectCount !== null) {
      stats.value[2].value = projectCount.toString()
    }
  } catch (err) {
    console.error('Error fetching dashboard stats:', err)
  }
})


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
            <span :class="(stat.change.includes('+') || stat.change === 'En direct') ? 'text-emerald-600' : 'text-rose-600'" class="font-medium">
              {{ stat.change }}
            </span>
            <span v-if="stat.name === 'Ventes Totales (Stripe)' || stat.name === 'Clients Actifs' || stat.name === 'Projets Actifs'">
              par rapport au mois dernier
            </span>
          </p>
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-4 grid-cols-1">
      <Card class="col-span-1">
        <CardHeader>
          <CardTitle>Aperçu des Ventes</CardTitle>
          <CardDescription>Visualisation de vos revenus ce mois-ci.</CardDescription>
        </CardHeader>
        <CardContent class="pl-2">
          <div class="h-[300px] w-full flex items-end justify-between px-4 pb-2 border-b">
            <div v-for="(val, i) in chartData" :key="i" 
              class="w-[6%] bg-indigo-500/20 rounded-t-lg transition-all hover:bg-indigo-600 relative group"
              :style="{ height: Math.max((val / maxMonthlySale) * 100, 2) + '%' }"
            >
              <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {{ val.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} €
              </div>
            </div>
          </div>
          <div class="flex justify-between px-4 text-xs text-muted-foreground mt-2">
            <span>Jan</span><span>Fev</span><span>Mar</span><span>Avr</span><span>Mai</span><span>Jun</span>
            <span>Jul</span><span>Aou</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
