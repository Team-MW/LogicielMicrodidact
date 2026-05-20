<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft, 
  Camera, 
  X, 
  Send, 
  CheckCircle2, 
  Image as ImageIcon,
  Loader2,
  Trash2,
  Clock
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const route = useRoute()
const router = useRouter()
const instId = Number(route.params.id)

const installation = ref<any>(null)
const loading = ref(true)
const reportText = ref('')
const status = ref('')
const photos = ref<string[]>([])
const uploading = ref(false)
const saving = ref(false)

// Predefined hours dropdown selections
const startTime = ref('08:00')
const endTime = ref('17:00')

const startHoursOptions = [
  '05:00', '06:00', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'
]

const endHoursOptions = [
  '12:00', '13:00', '14:00', '15:00', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '20:00', '21:00', '22:00'
]

const fetchInstallation = async () => {
  loading.value = true
  const { data, error } = await supabase.from('installations').select('*').eq('id', instId).single()
  if (data && !error) {
    installation.value = data
    status.value = data.status
  }
  loading.value = false
}

const handlePhotoUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files) return

  uploading.value = true
  Array.from(target.files).forEach(file => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        photos.value.push(e.target.result as string)
      }
    }
    reader.readAsDataURL(file)
  })
  
  setTimeout(() => {
    uploading.value = false
  }, 1000)
}

const removePhoto = (index: number) => {
  photos.value.splice(index, 1)
}

const submitReport = async () => {
  if (!reportText.value.trim()) {
    alert('Veuillez expliquer ce que vous avez fait.')
    return
  }

  saving.value = true
  
  try {
    // 1. Update Status in database
    await supabase.from('installations').update({ status: status.value }).eq('id', instId)
    
    // 2. Add Note/Report formatted as JSON for rich rendering
    const now = new Date()
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')} ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`
    
    const reportData = {
      isReport: true,
      hours: `${startTime.value} - ${endTime.value}`, // Saved clean as "08:00 - 17:00"
      text: reportText.value.trim(),
      photos: photos.value
    }

    const { error } = await supabase.from('installation_notes').insert({
      installation_id: instId,
      text: JSON.stringify(reportData),
      date: formattedDate
    })

    if (!error) {
      alert('Rapport de chantier enregistré avec succès !')
      router.push('/installer')
    } else {
      throw error
    }
  } catch (e) {
    console.error(e)
    alert('Erreur lors de l\'enregistrement du rapport.')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchInstallation()
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex flex-col pb-10">
    <!-- Header -->
    <header class="bg-white border-b px-6 py-5 sticky top-0 z-10 flex items-center gap-4">
      <button 
        @click="router.push('/installer')" 
        class="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 active:scale-95 transition-all"
      >
        <ArrowLeft class="w-5 h-5" />
      </button>
      <div>
        <h1 class="text-lg font-black text-slate-900 uppercase tracking-tight">Rapport de Pose</h1>
        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mise à jour rapide</p>
      </div>
    </header>

    <!-- Main Content -->
    <main v-if="loading" class="flex-1 flex flex-col items-center justify-center py-20 space-y-4">
      <div class="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
      <p class="text-slate-400 font-semibold animate-pulse">Chargement du chantier...</p>
    </main>

    <main v-else-if="installation" class="flex-1 px-6 py-6 space-y-6 max-w-xl mx-auto w-full">
      <!-- Chantier card overview -->
      <div class="bg-white p-6 rounded-[28px] border border-slate-100/80 shadow-sm space-y-2">
        <span class="text-[9px] font-black uppercase text-indigo-500 tracking-wider">Client</span>
        <h2 class="text-2xl font-black text-slate-900 leading-tight">{{ installation.client }}</h2>
        <div class="flex items-start gap-1.5 text-slate-500 pt-1">
          <MapPin class="w-4 h-4 mt-0.5 shrink-0 opacity-40" />
          <p class="text-xs font-bold leading-snug">{{ installation.address }}</p>
        </div>
      </div>

      <!-- Action: Choose Status -->
      <section class="space-y-3">
        <h2 class="text-xs font-black text-slate-400 uppercase tracking-widest">Statut du Chantier</h2>
        <div class="grid grid-cols-2 gap-3 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
          <button 
            @click="status = 'En cours'"
            class="flex items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all font-bold text-sm"
            :class="[status === 'En cours' ? 'bg-indigo-50 border-indigo-600 text-indigo-600' : 'bg-white border-slate-100 text-slate-400']"
          >
            <Loader2 class="w-4 h-4" :class="{'animate-spin': status === 'En cours'}" />
            En cours
          </button>
          <button 
            @click="status = 'Terminé'"
            class="flex items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all font-bold text-sm"
            :class="[status === 'Terminé' ? 'bg-emerald-50 border-emerald-600 text-emerald-600' : 'bg-white border-slate-100 text-slate-400']"
          >
            <CheckCircle2 class="w-4 h-4" />
            Terminé
          </button>
        </div>
      </section>

      <!-- Work Hours Dropdowns (Start and End) -->
      <section class="space-y-3">
        <h2 class="text-xs font-black text-slate-400 uppercase tracking-widest">Horaires de travail</h2>
        <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Commencé à :</label>
              <div class="relative flex items-center bg-slate-50 rounded-2xl border border-slate-100/80">
                <Clock class="absolute left-4 w-4 h-4 text-indigo-500 pointer-events-none" />
                <select 
                  v-model="startTime"
                  class="w-full pl-11 pr-8 py-3.5 bg-transparent border-none text-sm font-black text-slate-800 outline-none appearance-none"
                >
                  <option v-for="h in startHoursOptions" :key="h" :value="h">{{ h }}</option>
                </select>
                <div class="absolute right-3 pointer-events-none text-slate-400 text-xs">▼</div>
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fini à :</label>
              <div class="relative flex items-center bg-slate-50 rounded-2xl border border-slate-100/80">
                <Clock class="absolute left-4 w-4 h-4 text-indigo-500 pointer-events-none" />
                <select 
                  v-model="endTime"
                  class="w-full pl-11 pr-8 py-3.5 bg-transparent border-none text-sm font-black text-slate-800 outline-none appearance-none"
                >
                  <option v-for="h in endHoursOptions" :key="h" :value="h">{{ h }}</option>
                </select>
                <div class="absolute right-3 pointer-events-none text-slate-400 text-xs">▼</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Photos -->
      <section class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-xs font-black text-slate-400 uppercase tracking-widest">Photos du chantier</h2>
          <span class="text-[10px] font-bold text-slate-400">{{ photos.length }} photo(s)</span>
        </div>
        
        <div class="grid grid-cols-2 gap-3">
          <!-- Photo Preview -->
          <div v-for="(photo, index) in photos" :key="index" class="relative aspect-square rounded-2xl overflow-hidden shadow-sm group">
            <img :src="photo" class="w-full h-full object-cover" />
            <button 
              @click="removePhoto(index)"
              class="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>

          <!-- Upload Button -->
          <label class="aspect-square rounded-2xl border-2 border-dashed border-slate-200 bg-white flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-50 active:scale-95 transition-all shadow-sm">
            <input type="file" multiple accept="image/*" class="hidden" @change="handlePhotoUpload" />
            <Camera v-if="!uploading" class="w-6 h-6 text-indigo-500" />
            <Loader2 v-else class="w-6 h-6 text-indigo-500 animate-spin" />
            <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ajouter Photo</span>
          </label>
        </div>
      </section>

      <!-- Notes / Compte-rendu -->
      <section class="space-y-3">
        <h2 class="text-xs font-black text-slate-400 uppercase tracking-widest">Notes de pose / Commentaires *</h2>
        <textarea 
          v-model="reportText"
          rows="4"
          placeholder="Ex: Pose de l'enseigne lumineuse effectuée, branchements électriques terminés, tests OK."
          class="w-full p-5 bg-white border border-slate-100 rounded-3xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm resize-none"
        ></textarea>
      </section>

      <!-- Submit Button -->
      <button 
        @click="submitReport"
        :disabled="saving"
        class="w-full py-4.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-indigo-100 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
        <Send v-else class="w-4 h-4" />
        Enregistrer le rapport
      </button>
    </main>
  </div>
</template>
