<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Lock, ArrowRight, ShieldCheck } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

const router = useRouter()
const code = ref('')
const error = ref(false)

const verifyCode = () => {
  const isAllZeros = code.value.length > 0 && /^0+$/.test(code.value)
  
  if (isAllZeros) {
    sessionStorage.setItem('md_auth', 'true')
    router.push('/')
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
  <div class="min-h-screen bg-background flex flex-col justify-center items-center p-4">
    <Card class="max-w-md w-full border shadow-2xl space-y-6 p-2 animate-in fade-in zoom-in-95 duration-300">
      
      <CardHeader class="flex flex-col items-center text-center pb-2">
        <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 text-primary mb-2">
          <Lock class="h-5 w-5" />
        </div>
        <CardTitle class="text-2xl font-bold tracking-tight">Accès Sécurisé</CardTitle>
        <CardDescription class="text-sm">Veuillez entrer le code d'accès pour continuer.</CardDescription>
      </CardHeader>

      <!-- Code Input -->
      <CardContent class="space-y-4">
        <div class="relative">
          <Input 
            v-model="code"
            type="password"
            placeholder="Entrez le code"
            maxlength="4"
            @keyup.enter="verifyCode"
            class="text-center tracking-[0.5em] text-xl font-bold py-6 bg-slate-50/50"
            :class="[error ? 'border-destructive focus-visible:ring-destructive animate-shake' : '']"
          />
        </div>

        <p v-if="error" class="text-destructive text-xs text-center font-semibold animate-pulse">
          Code incorrect. Réessayez.
        </p>

        <Button @click="verifyCode" class="w-full text-base font-bold flex items-center justify-center gap-2 py-6">
          Valider <ArrowRight class="h-4 w-4" />
        </Button>
      </CardContent>

      <!-- Help / Footer -->
      <CardFooter class="justify-center border-t pt-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <ShieldCheck class="h-3.5 w-3.5 text-primary" /> Sécurisé par MicroDidact
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
