<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Lock, ArrowRight, ShieldCheck, User, Users } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

const route = useRoute()
const router = useRouter()
const code = ref('')
const error = ref(false)
const activeTab = ref<'admin' | 'poseur'>('admin')

const verifyCode = () => {
  const isAllZeros = code.value.length > 0 && /^0+$/.test(code.value)
  const isPoseur = code.value === '1234' // Code for Amar

  if (isAllZeros) {
    sessionStorage.setItem('md_auth', 'true')
    sessionStorage.setItem('md_role', 'admin')
    const redirect = route.query.redirect as string
    router.push(redirect || '/')
  } else if (isPoseur) {
    sessionStorage.setItem('md_auth', 'true')
    sessionStorage.setItem('md_role', 'poseur')
    const redirect = route.query.redirect as string
    router.push(redirect || '/installer')
  } else {
    error.value = true
    code.value = ''
    setTimeout(() => {
      error.value = false
    }, 2000)
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50/50 flex flex-col justify-center items-center p-4">
    <Card class="max-w-md w-full border border-slate-100 shadow-2xl space-y-6 p-2 animate-in fade-in zoom-in-95 duration-300 bg-white rounded-[32px]">
      
      <CardHeader class="flex flex-col items-center text-center pb-2 pt-4">
        <div class="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100 text-indigo-600 mb-2 shadow-sm">
          <Lock class="h-5 w-5" />
        </div>
        <CardTitle class="text-2xl font-black tracking-tight text-slate-900">Accès Sécurisé</CardTitle>
        <CardDescription class="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Logiciel MicroDidact</CardDescription>
      </CardHeader>

      <!-- Segmented Tab Toggle -->
      <div class="px-6">
        <div class="flex p-1 bg-slate-100 rounded-2xl">
          <button 
            @click="activeTab = 'admin'"
            class="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-black rounded-xl transition-all uppercase tracking-wider"
            :class="[
              activeTab === 'admin' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900'
            ]"
          >
            <Users class="w-4 h-4" />
            Espace Patron
          </button>
          <button 
            @click="activeTab = 'poseur'"
            class="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-black rounded-xl transition-all uppercase tracking-wider"
            :class="[
              activeTab === 'poseur' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900'
            ]"
          >
            <User class="w-4 h-4" />
            Espace Amar
          </button>
        </div>
      </div>

      <!-- Code Input -->
      <CardContent class="space-y-4 px-6 pb-6">
        <div class="space-y-1">
          <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest block text-center mb-2">
            {{ activeTab === 'admin' ? 'Entrez le code administrateur' : 'Entrez le code poseur' }}
          </label>
          <Input 
            v-model="code"
            type="password"
            inputmode="numeric"
            pattern="[0-9]*"
            :placeholder="activeTab === 'admin' ? '••••' : '••••'"
            maxlength="4"
            @keyup.enter="verifyCode"
            class="text-center tracking-[0.5em] text-xl font-bold py-6 bg-slate-50 border-slate-100 rounded-2xl focus-visible:ring-indigo-100 focus-visible:ring-2"
            :class="[error ? 'border-destructive focus-visible:ring-destructive animate-shake' : '']"
          />
        </div>

        <p v-if="error" class="text-rose-500 text-xs text-center font-bold animate-pulse">
          Code incorrect. Veuillez réessayer.
        </p>

        <Button @click="verifyCode" class="w-full text-sm font-black flex items-center justify-center gap-2 py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-100 active:scale-98 transition-all uppercase tracking-wider">
          Se Connecter <ArrowRight class="h-4 w-4" />
        </Button>
      </CardContent>

      <!-- Help / Footer -->
      <CardFooter class="justify-center border-t border-slate-50 pt-4 pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
        <ShieldCheck class="h-4.5 w-4.5 text-indigo-500" /> Sécurisé par MicroDidact
      </CardFooter>

    </Card>
  </div>
</template>

<style>
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-10px); }
  40%, 80% { transform: translateX(10px); }
}
.animate-shake {
  animation: shake 0.3s ease-in-out;
}
</style>
