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
  Truck,
  Menu,
  X,
  Monitor,
  Calendar
} from 'lucide-vue-next'

const isMobileMenuOpen = ref(false)
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
  { name: 'Suivi Logiciels', icon: Monitor, path: '/software' },
  { name: 'Planning', icon: Calendar, path: '/calendar' },
  { name: 'Suivi Poseurs', icon: Truck, path: '/installers' },
  { name: 'Clients', icon: Users, path: '/customers' },
  { name: 'Suivis Clients', icon: MessageSquareText, path: '/tracking' },
]
</script>

<template>
  <div class="flex h-screen bg-slate-50/50 relative overflow-hidden">
    <!-- Overlay Mobile Backdrop -->
    <div 
      v-if="isMobileMenuOpen" 
      class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden" 
      @click="isMobileMenuOpen = false"
    ></div>

    <!-- Mobile Slide-over Sidebar -->
    <aside 
      class="fixed inset-y-0 left-0 bg-white z-50 w-64 border-r flex flex-col transform transition-transform duration-300 ease-in-out md:hidden"
      :class="[isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full']"
    >
      <div class="p-6 flex items-center justify-between border-b">
        <img src="/microdidac.png" alt="MicroDidact" class="h-10 object-contain" />
        <Button variant="ghost" size="icon" @click="isMobileMenuOpen = false" class="rounded-xl hover:bg-slate-50">
          <X class="h-5 w-5 text-slate-500" />
        </Button>
      </div>
      
      <nav class="flex-1 px-3 py-4 space-y-1">
        <RouterLink 
          v-for="item in navItems" 
          :key="item.name" 
          :to="item.path"
          @click="isMobileMenuOpen = false"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors font-medium text-sm"
          :class="[
            $route.path === item.path 
              ? 'bg-primary text-primary-foreground shadow-sm font-bold' 
              : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
          ]"
        >
          <component :is="item.icon" class="h-5 w-5 shrink-0" />
          <span>{{ item.name }}</span>
        </RouterLink>
      </nav>

      <div class="p-4 border-t">
        <Button 
          variant="ghost" 
          class="w-full justify-start gap-3 p-2 h-auto text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl font-bold text-sm"
          @click="logout"
        >
          <LogOut class="h-5 w-5" />
          <span>Déconnexion</span>
        </Button>
      </div>
    </aside>

    <!-- Desktop Sidebar -->
    <aside 
      class="border-r bg-white transition-all duration-300 flex-col hidden md:flex relative"
      :class="[isSidebarOpen ? 'w-64' : 'w-20']"
    >
      <div class="p-6 flex items-center gap-3 h-20 shrink-0">
        <img v-if="isSidebarOpen" src="/microdidac.png" alt="MicroDidact" class="h-16 object-contain" />
        <div v-else class="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-sm shadow-indigo-200">
          <Briefcase class="h-5 w-5 text-white" />
        </div>
      </div>

      <nav class="flex-1 px-3 space-y-1">
        <RouterLink 
          v-for="item in navItems" 
          :key="item.name" 
          :to="item.path"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors group"
          :class="[
            $route.path === item.path 
              ? 'bg-primary text-primary-foreground shadow-sm font-bold' 
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
          ]"
        >
          <component :is="item.icon" class="h-5 w-5 shrink-0" />
          <span v-if="isSidebarOpen" class="text-sm">{{ item.name }}</span>
          <div v-if="!isSidebarOpen" class="absolute left-16 bg-slate-900 text-white px-2 py-1 rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 font-medium">
            {{ item.name }}
          </div>
        </RouterLink>
      </nav>

      <div class="p-4 border-t space-y-2">
        <Button 
          variant="ghost" 
          class="w-full justify-start gap-3 p-2 h-auto hover:bg-slate-50 rounded-xl"
          :class="[!isSidebarOpen && 'justify-center']"
        >
          <Settings class="h-5 w-5 text-slate-400" />
          <span v-if="isSidebarOpen" class="font-medium text-sm text-slate-600">Paramètres</span>
        </Button>
        <Button 
          variant="ghost" 
          @click="logout"
          class="w-full justify-start gap-3 p-2 h-auto text-rose-500 hover:text-rose-600 hover:bg-rose-50/50 rounded-xl font-bold"
          :class="[!isSidebarOpen && 'justify-center']"
        >
          <LogOut class="h-5 w-5" />
          <span v-if="isSidebarOpen" class="font-medium text-sm">Déconnexion</span>
        </Button>
      </div>
      
      <Button 
        variant="ghost" 
        size="icon" 
        class="absolute -right-3 top-7 h-6 w-6 rounded-full border bg-white shadow-xs z-10"
        @click="isSidebarOpen = !isSidebarOpen"
      >
        <ChevronLeft v-if="isSidebarOpen" class="h-3 w-3 text-slate-600" />
        <ChevronRight v-else class="h-3 w-3 text-slate-600" />
      </Button>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Header -->
      <header class="h-16 border-b bg-white flex items-center justify-between px-4 md:px-8 shrink-0 gap-4">
        <div class="flex items-center gap-3 flex-1">
          <Button variant="ghost" size="icon" class="md:hidden rounded-xl" @click="isMobileMenuOpen = true">
            <Menu class="h-5 w-5 text-slate-600" />
          </Button>

          <div class="flex-1 max-w-xl relative hidden md:block">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Rechercher partout..." class="pl-10 h-10 border-none bg-slate-50 rounded-xl focus-visible:ring-1 focus-visible:ring-slate-200" />
          </div>
        </div>

        <div class="flex items-center gap-2 md:gap-4">
          <Button variant="ghost" size="icon" class="relative rounded-xl hover:bg-slate-50 shrink-0">
            <Bell class="h-5 w-5 text-slate-600" />
            <span class="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
          </Button>

          <DropdownMenu v-model:open="isProfileMenuOpen">
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" class="gap-2 p-1 h-auto hover:bg-transparent rounded-xl">
                <div class="text-right hidden sm:block">
                  <div class="text-sm font-bold text-slate-900">Admin User</div>
                  <div class="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Manager</div>
                </div>
                <Avatar class="h-9 w-9 border border-slate-100 shadow-2xs">
                  <AvatarFallback class="font-bold text-slate-700 bg-slate-100 text-xs">AD</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent class="w-56 rounded-2xl border-slate-100" align="end">
              <DropdownMenuLabel class="font-normal">
                <div class="flex flex-col space-y-1">
                  <p class="text-sm font-bold text-slate-900">Admin User</p>
                  <p class="text-xs text-slate-400 font-medium">admin@microdidact.com</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem class="rounded-xl text-slate-700 font-medium">Profil</DropdownMenuItem>
              <DropdownMenuItem class="rounded-xl text-slate-700 font-medium">Facturation</DropdownMenuItem>
              <DropdownMenuItem class="rounded-xl text-slate-700 font-medium">Paramètres</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="logout" @select="logout" class="text-rose-500 font-bold cursor-pointer rounded-xl hover:bg-rose-50/50">Déconnexion</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <!-- View Area -->
      <main class="flex-1 overflow-auto bg-slate-50/20">
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
