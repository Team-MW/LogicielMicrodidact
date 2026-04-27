<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { 
  LayoutDashboard,
  ShoppingCart,
  Briefcase, 
  Users, 
  Settings, 
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  MessageSquareText,
  Truck
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const router = useRouter()
const isSidebarOpen = ref(true)
const isProfileMenuOpen = ref(false)

const logout = () => {
  sessionStorage.removeItem('md_auth')
  router.push('/login')
}

const navItems = [
  { name: 'Tableau de Bord', icon: LayoutDashboard, path: '/' },
  { name: 'Encaissement', icon: ShoppingCart, path: '/pos' },
  { name: 'Projets', icon: Briefcase, path: '/projects' },
  { name: 'Suivi Poseurs', icon: Truck, path: '/installers' },
  { name: 'Clients', icon: Users, path: '/customers' },
  { name: 'Suivis Clients', icon: MessageSquareText, path: '/tracking' },
]
</script>

<template>
  <div class="flex h-screen bg-slate-50/50">
    <!-- Sidebar -->
    <aside 
      class="border-r bg-white transition-all duration-300 flex flex-col"
      :class="[isSidebarOpen ? 'w-64' : 'w-20']"
    >
      <div class="p-6 flex items-center gap-3">
        <img v-if="isSidebarOpen" src="/microdidac.png" alt="MicroDidact" class="h-16 object-contain" />
        <div v-else class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
          <Briefcase class="h-5 w-5 text-white" />
        </div>
      </div>

      <nav class="flex-1 px-3 space-y-1">
        <RouterLink 
          v-for="item in navItems" 
          :key="item.name" 
          :to="item.path"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group"
          :class="[
            $route.path === item.path 
              ? 'bg-primary text-primary-foreground shadow-sm' 
              : 'text-muted-foreground hover:bg-slate-100/80 hover:text-foreground'
          ]"
        >
          <component :is="item.icon" class="h-5 w-5 shrink-0" />
          <span v-if="isSidebarOpen" class="font-medium text-sm">{{ item.name }}</span>
          <div v-if="!isSidebarOpen" class="absolute left-14 bg-slate-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            {{ item.name }}
          </div>
        </RouterLink>
      </nav>

      <div class="p-4 border-t space-y-2">
        <Button 
          variant="ghost" 
          class="w-full justify-start gap-3 p-2 h-auto hover:bg-slate-100"
          :class="[!isSidebarOpen && 'justify-center']"
        >
          <Settings class="h-5 w-5 text-muted-foreground" />
          <span v-if="isSidebarOpen" class="font-medium text-sm text-muted-foreground">Paramètres</span>
        </Button>
        <Button 
          variant="ghost" 
          class="w-full justify-start gap-3 p-2 h-auto text-rose-500 hover:text-rose-600 hover:bg-rose-50"
          :class="[!isSidebarOpen && 'justify-center']"
        >
          <LogOut class="h-5 w-5" />
          <span v-if="isSidebarOpen" class="font-medium text-sm">Déconnexion</span>
        </Button>
      </div>
      
      <Button 
        variant="ghost" 
        size="icon" 
        class="absolute -right-3 top-20 h-6 w-6 rounded-full border bg-white shadow-sm"
        @click="isSidebarOpen = !isSidebarOpen"
      >
        <ChevronLeft v-if="isSidebarOpen" class="h-3 w-3" />
        <ChevronRight v-else class="h-3 w-3" />
      </Button>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Header -->
      <header class="h-16 border-b bg-white flex items-center justify-between px-8 shrink-0">
        <div class="flex-1 max-w-xl relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher partout..." class="pl-10 h-10 border-none bg-slate-100 focus-visible:ring-1 focus-visible:ring-slate-200" />
        </div>

        <div class="flex items-center gap-4">
          <Button variant="ghost" size="icon" class="relative">
            <Bell class="h-5 w-5 text-muted-foreground" />
            <span class="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
          </Button>

          <DropdownMenu v-model:open="isProfileMenuOpen">
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" class="gap-3 p-1 h-auto hover:bg-transparent">
                <div class="text-right hidden sm:block">
                  <div class="text-sm font-semibold">Admin User</div>
                  <div class="text-xs text-muted-foreground">Manager General</div>
                </div>
                <Avatar class="h-9 w-9 border-2 border-primary/20">
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent class="w-56" align="end">
              <DropdownMenuLabel class="font-normal">
                <div class="flex flex-col space-y-1">
                  <p class="text-sm font-medium leading-none">Admin User</p>
                  <p class="text-xs leading-none text-muted-foreground">admin@microdidact.com</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profil</DropdownMenuItem>
              <DropdownMenuItem>Facturation</DropdownMenuItem>
              <DropdownMenuItem>Paramètres</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="logout" @select="logout" class="text-rose-500 font-medium cursor-pointer">Déconnexion</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <!-- View Area -->
      <main class="flex-1 overflow-auto bg-slate-50/50">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.router-link-active {
  @apply bg-primary text-primary-foreground shadow-sm;
}
</style>
