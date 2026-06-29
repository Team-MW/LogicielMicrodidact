<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { 
  Truck, 
  MapPin, 
  ChevronRight, 
  Calendar, 
  Search,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  Plus,
  Camera,
  Trash2,
  Loader2,
  X,
  FileText
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { uploadToCloudinary } from '@/lib/cloudinary'

interface Installation {
  id: number
  client: string
  address: string
  sign_type: string
  status: string
  deadline: string
  poseur: string
  project_id?: number
}

const router = useRouter()
const installations = ref<Installation[]>([])
const loading = ref(true)
const searchQuery = ref('')
const successToast = ref('')
const fetchError = ref('')

const refreshInterval = ref<any>(null)
const debugInfo = ref('')

const showToast = (msg: string) => {
  successToast.value = msg
  setTimeout(() => { successToast.value = '' }, 3500)
}

// --- Nouveau Chantier States ---
const showCreateModal = ref(false)
const savingNew = ref(false)
const createUploading = ref(false)

const newIntervention = ref({
  client: '',
  address: '',
  signType: '',
  status: 'Terminé',
  startTime: '08:00',
  endTime: '17:00',
  photos: [] as string[],
  notes: ''
})

const startHoursOptions = [
  '05:00', '06:00', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'
]

const endHoursOptions = [
  '12:00', '13:00', '14:00', '15:00', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '20:00', '21:00', '22:00'
]

const logout = () => {
  sessionStorage.removeItem('md_auth')
  sessionStorage.removeItem('md_role')
  router.push('/login')
}

const fetchInstallations = async () => {
  loading.value = true
  fetchError.value = ''
  try {
    const { data, error } = await supabase
      .from('installations')
      .select('*')
      .eq('poseur', 'Amar')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Supabase error:', error)
      fetchError.value = error.message || 'Erreur de connexion à la base de données.'
      debugInfo.value = 'Erreur: ' + error.message
    } else if (data) {
      installations.value = data
      fetchError.value = ''
      debugInfo.value = `${data.length} ligne(s) en base.`
    }
  } catch (e: any) {
    console.error('Fetch exception:', e)
    fetchError.value = 'Impossible de contacter la base de données.'
  }
  loading.value = false
}

const handleCreatePhotoUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return

  createUploading.value = true
  try {
    const uploadPromises = Array.from(target.files).map(file => uploadToCloudinary(file))
    const urls = await Promise.all(uploadPromises)
    newIntervention.value.photos.push(...urls)
  } catch (err) {
    console.error('Cloudinary upload error:', err)
    showToast('❌ Erreur lors de l\'upload. Vérifiez la connexion.')
  } finally {
    createUploading.value = false
    target.value = ''
  }
}

const removeCreatePhoto = (index: number) => {
  newIntervention.value.photos.splice(index, 1)
}

const submitNewIntervention = async () => {
  if (!newIntervention.value.client.trim()) {
    showToast('⚠️ Veuillez entrer le nom du client.')
    return
  }
  
  savingNew.value = true
  
  try {
    const { data: instData, error: instErr } = await supabase.from('installations').insert({
      client: newIntervention.value.client.trim(),
      address: newIntervention.value.address.trim() || 'Non spécifiée',
      sign_type: newIntervention.value.signType.trim() || 'Enseigne',
      status: newIntervention.value.status,
      poseur: 'Amar', // Always Amar
      deadline: 'Aujourd\'hui',
      priority: 'Moyenne'
    }).select().single()

    if (instErr) throw instErr

    const now = new Date()
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')} ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`
    
    const reportData = {
      isReport: true,
      hours: `${newIntervention.value.startTime} - ${newIntervention.value.endTime}`,
      text: newIntervention.value.notes.trim() || 'Nouvelle intervention créée directement sur le terrain.',
      photos: newIntervention.value.photos
    }

    await supabase.from('installation_notes').insert({
      installation_id: instData.id,
      text: JSON.stringify(reportData),
      date: formattedDate
    })

    showCreateModal.value = false
    
    newIntervention.value = {
      client: '',
      address: '',
      signType: '',
      status: 'Terminé',
      startTime: '08:00',
      endTime: '17:00',
      photos: [],
      notes: ''
    }
    
    await fetchInstallations()
    showToast('✅ Chantier ajouté avec succès !')
  } catch (error) {
    console.error('Error creating intervention:', error)
    showToast('❌ Erreur lors de la création. Réessayez.')
  } finally {
    savingNew.value = false
  }
}

onUnmounted(() => {
  if (refreshInterval.value) clearInterval(refreshInterval.value)
})

const filteredInstallations = () => {
  if (!searchQuery.value) return installations.value
  const query = searchQuery.value.toLowerCase()
  return installations.value.filter(inst =>
    (inst.client || '').toLowerCase().includes(query) || 
    (inst.address || '').toLowerCase().includes(query)
  )
}

const getStatusIcon = (status: string) => {
  if (status === 'Terminé') return CheckCircle2
  if (status === 'En cours') return Clock
  return AlertCircle
}

const getStatusColor = (status: string) => {
  if (status === 'Terminé') return 'text-emerald-500 bg-emerald-50 border-emerald-100'
  if (status === 'En cours') return 'text-indigo-500 bg-indigo-50 border-indigo-100'
  return 'text-amber-500 bg-amber-50 border-amber-100'
}

const getStatusDot = (status: string) => {
  if (status === 'Terminé') return 'bg-emerald-500'
  if (status === 'En cours') return 'bg-indigo-500'
  return 'bg-amber-500'
}

const goToReport = (id: number) => {
  router.push(`/installer/report/${id}`)
}

onMounted(() => {
  fetchInstallations()
  refreshInterval.value = setInterval(() => {
    fetchInstallations()
  }, 10000)
})
</script>

<template>
  <div class="min-h-screen bg-[#F8FAFC] flex flex-col pb-32 relative font-sans">
    
    <!-- Toast Banner -->
    <transition name="slide-down">
      <div 
        v-if="successToast"
        class="fixed top-6 left-1/2 -translate-x-1/2 z-[200] px-6 py-3.5 bg-slate-900/95 backdrop-blur-md text-white text-sm font-semibold rounded-full shadow-2xl flex items-center gap-3 w-11/12 max-w-sm whitespace-nowrap"
      >
        <span class="flex-1 text-center truncate">{{ successToast }}</span>
      </div>
    </transition>

    <!-- Header (Glassmorphism) -->
    <header class="sticky top-0 z-40 bg-white/70 backdrop-blur-2xl border-b border-slate-200/50 pt-8 pb-5 px-6">
      <div class="max-w-xl mx-auto w-full">
        <div class="flex items-center justify-between mb-6">
          <div class="flex flex-col">
            <span class="text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-1">Espace Poseur</span>
            <h1 class="text-3xl font-black text-slate-900 tracking-tight leading-none">Interventions</h1>
          </div>
          <div class="flex items-center gap-3">
            <button @click="logout" class="w-11 h-11 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-colors shadow-sm" title="Déconnexion">
              <LogOut class="w-5 h-5" />
            </button>
            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-200 ring-4 ring-indigo-50">
              <span class="text-white font-bold text-lg">A</span>
            </div>
          </div>
        </div>

        <!-- Search Bar -->
        <div class="relative">
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Rechercher un client, une adresse..."
            class="w-full pl-12 pr-4 py-4 bg-white/60 backdrop-blur-sm border border-slate-200/60 rounded-2xl text-[15px] font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all outline-none shadow-sm placeholder:text-slate-400"
          />
        </div>
      </div>
    </header>

    <!-- Content -->
    <main class="flex-1 px-6 py-6 space-y-5 max-w-xl mx-auto w-full">
      
      <div class="flex items-center justify-between mb-2">
        <h2 class="text-[11px] font-black uppercase tracking-widest text-slate-400">Mes chantiers assignés</h2>
      </div>

      <div v-if="loading" class="flex flex-col items-center justify-center py-20 space-y-4">
        <div class="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <p class="text-slate-400 font-medium text-sm">Chargement des données...</p>
      </div>

      <div v-else-if="filteredInstallations().length === 0" class="flex flex-col items-center justify-center py-20 text-center space-y-6 px-4">
        <div class="w-24 h-24 bg-indigo-50/50 rounded-full flex items-center justify-center">
          <FileText class="w-10 h-10 text-indigo-300" />
        </div>
        <div class="space-y-2">
          <p class="text-slate-800 font-black text-lg">Aucun chantier en vue</p>
          <div v-if="fetchError" class="mt-2 px-4 py-3 bg-rose-50 border border-rose-100 rounded-2xl max-w-xs mx-auto">
            <p class="text-rose-600 text-xs font-bold">⚠️ Erreur de connexion</p>
            <p class="text-rose-500 text-[10px] font-medium mt-0.5 break-all">{{ fetchError }}</p>
          </div>
          <p v-else class="text-slate-500 text-sm font-medium leading-relaxed max-w-xs mx-auto">
            Vous n'avez pas de chantiers assignés pour le moment.
          </p>
        </div>
        <button 
          @click="fetchInstallations"
          class="px-6 py-3 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-700 shadow-sm active:scale-95 transition-all flex items-center gap-2"
        >
          <RefreshCw class="w-4 h-4" :class="loading && 'animate-spin'" />
          Actualiser
        </button>
      </div>

      <!-- Installation Cards -->
      <div 
        v-else
        v-for="inst in filteredInstallations()" 
        :key="inst.id"
        @click="goToReport(inst.id)"
        class="bg-white p-5 rounded-[28px] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 cursor-pointer group relative overflow-hidden"
      >
        <div class="flex justify-between items-center mb-4">
          <div :class="['px-3 py-1.5 rounded-full border flex items-center gap-2', getStatusColor(inst.status)]">
            <div :class="['w-1.5 h-1.5 rounded-full animate-pulse', getStatusDot(inst.status)]"></div>
            <span class="text-[10px] font-black uppercase tracking-wider">{{ inst.status }}</span>
          </div>
          <div class="flex items-center gap-1.5 text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full">
            <Calendar class="w-3.5 h-3.5" />
            <span class="text-[10px] font-bold uppercase tracking-wider">{{ inst.deadline }}</span>
          </div>
        </div>

        <h3 class="text-xl font-black text-slate-900 mb-4 group-hover:text-indigo-600 transition-colors leading-tight pr-8">
          {{ inst.client }}
        </h3>
        
        <div class="space-y-3 mb-5 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
              <MapPin class="w-4 h-4 text-indigo-400" />
            </div>
            <p class="text-sm font-semibold text-slate-600 leading-snug pt-1.5">{{ inst.address }}</p>
          </div>
        </div>

        <div class="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center">
              <FileText class="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <span class="text-[11px] font-bold text-slate-500">Rapport & Notes</span>
          </div>
          <div class="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center group-hover:bg-indigo-600 transition-colors shadow-md">
            <ChevronRight class="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </main>

    <!-- Floating Action Button (FAB) -->
    <div class="fixed bottom-28 right-6 z-40">
      <button 
        @click="showCreateModal = true"
        class="group w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-[0_8px_30px_rgba(79,70,229,0.3)] hover:shadow-[0_12px_40px_rgba(79,70,229,0.4)] hover:-translate-y-1 active:scale-95 transition-all duration-300 border border-white/20"
      >
        <Plus class="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
      </button>
    </div>

    <!-- Bottom Navigation (Floating) -->
    <nav class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-2xl px-2 py-2 rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.08)] flex gap-2 z-30 border border-white max-w-[280px] w-full">
      <div class="flex-1 py-3 px-2 bg-indigo-50 rounded-[1.5rem] flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors">
        <Truck class="w-5 h-5 text-indigo-600" />
        <span class="text-[9px] font-black uppercase tracking-widest text-indigo-600">Chantiers</span>
      </div>
      <div class="flex-1 py-3 px-2 rounded-[1.5rem] flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors">
        <CheckCircle2 class="w-5 h-5" />
        <span class="text-[9px] font-bold uppercase tracking-widest">Terminés</span>
      </div>
    </nav>

    <!-- Backdrop for Modal -->
    <transition name="fade">
      <div v-if="showCreateModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90]" @click="showCreateModal = false"></div>
    </transition>

    <!-- Modal: Nouveau Chantier (Bottom Sheet Style) -->
    <transition name="slide-up">
      <div v-if="showCreateModal" class="fixed inset-x-0 bottom-0 bg-white rounded-t-[40px] shadow-2xl z-[100] max-h-[90vh] flex flex-col overflow-hidden max-w-2xl mx-auto">
        
        <!-- Drag Handle / Header -->
        <div class="px-6 pt-4 pb-2 border-b border-slate-100 shrink-0 relative bg-white">
          <div class="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4"></div>
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-2xl font-black text-slate-900 tracking-tight">Nouveau Chantier</h3>
              <p class="text-xs text-indigo-500 font-semibold mt-1">Saisie rapide d'intervention</p>
            </div>
            <button @click="showCreateModal = false" class="w-10 h-10 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center hover:bg-slate-100 transition-colors">
              <X class="h-5 w-5" />
            </button>
          </div>
        </div>

        <!-- Scrollable Form Content -->
        <div class="p-6 overflow-y-auto flex-1 space-y-6">
          
          <div class="space-y-4">
            <!-- Nom du Client -->
            <div class="space-y-2">
              <label class="text-[11px] font-black text-slate-700 uppercase tracking-widest pl-1">Nom du Client <span class="text-rose-500">*</span></label>
              <input 
                v-model="newIntervention.client"
                placeholder="Ex: Boulangerie Paul"
                class="w-full px-5 py-4 text-[15px] rounded-2xl border-none bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 shadow-sm outline-none transition-all font-semibold placeholder:text-slate-400"
              />
            </div>

            <!-- Adresse -->
            <div class="space-y-2">
              <label class="text-[11px] font-black text-slate-700 uppercase tracking-widest pl-1">Adresse</label>
              <input 
                v-model="newIntervention.address"
                placeholder="Lieu de l'intervention"
                class="w-full px-5 py-4 text-[15px] rounded-2xl border-none bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 shadow-sm outline-none transition-all font-semibold placeholder:text-slate-400"
              />
            </div>
            
            <!-- Type -->
            <div class="space-y-2">
              <label class="text-[11px] font-black text-slate-700 uppercase tracking-widest pl-1">Type d'enseigne</label>
              <input 
                v-model="newIntervention.signType"
                placeholder="Ex: Caisson Lumineux"
                class="w-full px-5 py-4 text-[15px] rounded-2xl border-none bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 shadow-sm outline-none transition-all font-semibold placeholder:text-slate-400"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <!-- Statut -->
            <div class="space-y-2">
              <label class="text-[11px] font-black text-slate-700 uppercase tracking-widest pl-1">Statut</label>
              <div class="relative">
                <select 
                  v-model="newIntervention.status"
                  class="w-full px-5 py-4 text-[15px] rounded-2xl border-none bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 shadow-sm outline-none transition-all font-bold appearance-none"
                >
                  <option value="Terminé">Terminé</option>
                  <option value="En cours">En cours</option>
                  <option value="À planifier">À planifier</option>
                </select>
                <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronRight class="w-4 h-4 text-slate-400 rotate-90" />
                </div>
              </div>
            </div>
            
            <!-- Date -->
            <div class="space-y-2">
              <label class="text-[11px] font-black text-slate-700 uppercase tracking-widest pl-1">Date</label>
              <input 
                disabled
                placeholder="Aujourd'hui"
                class="w-full px-5 py-4 text-[15px] rounded-2xl border-none bg-slate-100 text-slate-400 font-bold outline-none cursor-not-allowed shadow-inner"
              />
            </div>
          </div>

          <!-- Horaires -->
          <div class="p-5 bg-indigo-50/50 rounded-[28px] border border-indigo-100/50">
            <label class="text-[11px] font-black text-indigo-900 uppercase tracking-widest mb-3 block">Horaires d'intervention</label>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <span class="text-[10px] font-bold text-indigo-400 uppercase">Début</span>
                <div class="relative flex items-center bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden">
                  <Clock class="absolute left-3 w-4 h-4 text-indigo-400 pointer-events-none" />
                  <select 
                    v-model="newIntervention.startTime"
                    class="w-full pl-10 pr-6 py-3.5 bg-transparent border-none text-sm font-bold text-slate-800 outline-none appearance-none"
                  >
                    <option v-for="h in startHoursOptions" :key="h" :value="h">{{ h }}</option>
                  </select>
                </div>
              </div>

              <div class="space-y-1.5">
                <span class="text-[10px] font-bold text-indigo-400 uppercase">Fin</span>
                <div class="relative flex items-center bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden">
                  <Clock class="absolute left-3 w-4 h-4 text-indigo-400 pointer-events-none" />
                  <select 
                    v-model="newIntervention.endTime"
                    class="w-full pl-10 pr-6 py-3.5 bg-transparent border-none text-sm font-bold text-slate-800 outline-none appearance-none"
                  >
                    <option v-for="h in endHoursOptions" :key="h" :value="h">{{ h }}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Photos -->
          <div class="space-y-3">
            <div class="flex items-center justify-between pl-1">
              <label class="text-[11px] font-black text-slate-700 uppercase tracking-widest">Photos du terrain</label>
              <span class="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">{{ newIntervention.photos.length }} photo(s)</span>
            </div>
            
            <div class="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
              <!-- Upload trigger -->
              <label class="w-28 h-28 shrink-0 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 transition-colors snap-start">
                <input type="file" multiple accept="image/*" class="hidden" @change="handleCreatePhotoUpload" />
                <Camera v-if="!createUploading" class="w-6 h-6 text-slate-400" />
                <Loader2 v-else class="w-6 h-6 text-indigo-500 animate-spin" />
                <span class="text-[10px] font-bold text-slate-500">Ajouter</span>
              </label>

              <!-- Previews -->
              <div v-for="(photo, index) in newIntervention.photos" :key="index" class="relative w-28 h-28 shrink-0 rounded-2xl overflow-hidden shadow-sm border border-slate-100 snap-start group">
                <img :src="photo" class="w-full h-full object-cover" />
                <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <button 
                  type="button"
                  @click="removeCreatePhoto(index)"
                  class="absolute top-2 right-2 w-7 h-7 rounded-full bg-rose-500/90 backdrop-blur-sm flex items-center justify-center text-white transform scale-90 group-hover:scale-100 transition-all shadow-lg"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div class="space-y-2 pb-6">
            <label class="text-[11px] font-black text-slate-700 uppercase tracking-widest pl-1">Notes & Compte-rendu</label>
            <textarea 
              v-model="newIntervention.notes"
              rows="4"
              placeholder="Décrivez ce qui a été réalisé, les problèmes rencontrés..."
              class="w-full p-5 text-[15px] rounded-2xl border-none bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 shadow-sm outline-none transition-all font-medium resize-none placeholder:text-slate-400"
            ></textarea>
          </div>
        </div>

        <!-- Sticky Footer Action -->
        <div class="p-6 bg-white border-t border-slate-100 shrink-0 pb-safe">
          <button 
            @click="submitNewIntervention" 
            :disabled="savingNew" 
            class="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
          >
            <Loader2 v-if="savingNew" class="w-5 h-5 animate-spin" />
            <span v-else>Enregistrer le chantier</span>
          </button>
        </div>

      </div>
    </transition>

  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 24px);
}

/* Transitions for Toast and Modal */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translate(-50%, -150%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
