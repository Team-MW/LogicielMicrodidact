<script setup lang="ts">
import { ref } from 'vue'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Search, UserPlus, Mail, Phone, MoreHorizontal } from 'lucide-vue-next'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'

const customers = [
  { id: 1, name: 'Jean Dupont', email: 'jean.dupont@email.com', phone: '+33 6 12 34 56 78', totalSpent: '1,450 €', status: 'Actif' },
  { id: 2, name: 'Marie Curie', email: 'm.curie@science.fr', phone: '+33 6 98 76 54 32', totalSpent: '450 €', status: 'Inactif' },
  { id: 3, name: 'Pierre Martin', email: 'pierre.martin@pro.com', phone: '+33 7 11 22 33 44', totalSpent: '2,800 €', status: 'Actif' },
  { id: 4, name: 'Sophie Lefebvre', email: 'sophie.l@design.com', phone: '+33 6 55 44 33 22', totalSpent: '900 €', status: 'Actif' },
  { id: 5, name: 'Thomas Bernard', email: 't.bernard@tech.io', phone: '+33 6 12 34 88 99', totalSpent: '12,400 €', status: 'VIP' },
]

const searchQuery = ref('')
</script>

<template>
  <div class="flex-1 space-y-4 p-8 pt-6">
    <div class="flex items-center justify-between">
      <h2 class="text-3xl font-bold tracking-tight">Gestion des Clients</h2>
      <Button><UserPlus class="mr-2 h-4 w-4" /> Ajouter un client</Button>
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
              <TableHead class="text-right">Total Dépensé</TableHead>
              <TableHead class="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="customer in customers" :key="customer.id">
              <TableCell class="font-medium">
                <div class="flex items-center gap-3">
                  <Avatar class="h-8 w-8">
                    <AvatarFallback>{{ customer.name.split(' ').map(n => n[0]).join('') }}</AvatarFallback>
                  </Avatar>
                  {{ customer.name }}
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
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
</template>
