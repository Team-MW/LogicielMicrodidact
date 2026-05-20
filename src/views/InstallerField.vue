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
  Briefcase,
  LogOut,
  Plus,
  Camera,
  Trash2,
  Loader2,
  X
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
      .select('*, projects(name)')
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
    // 1. Insert installation in installations table
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

    // 2. Insert note in installation_notes table formatted as JSON
    const now = new Date()
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')} ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`
    
    const reportData = {
      isReport: true,
      hours: `${newIntervention.value.startTime} - ${newIntervention.value.endTime}`, // Clean hour string
      text: newIntervention.value.notes.trim() || 'Nouvelle intervention créée directement sur le terrain.',
      photos: newIntervention.value.photos
    }

    await supabase.from('installation_notes').insert({
      installation_id: instData.id,
      text: JSON.stringify(reportData),
      date: formattedDate
    })

    showCreateModal.value = false
    
    // Reset form
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
    
    // Refresh list then show toast
    await fetchInstallations()
    showToast('✅ Chantier ajouté ! Il apparaît maintenant dans la liste.')
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

// Stats - show all fetched installations
const amarInstallations = computed(() => installations.value)
const stats = computed(() => ({
  total: amarInstallations.value.length,
  done: amarInstallations.value.filter(i => i.status === 'Terminé').length,
  inProgress: amarInstallations.value.filter(i => i.status === 'En cours').length,
  todo: amarInstallations.value.filter(i => i.status === 'À planifier').length,
}))

const filteredInstallations = () => {
  if (!searchQuery.value) return installations.value
  return installations.value.filter(inst =>
    inst.client.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
    inst.address.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
}

const getStatusIcon = (status: string) => {
  if (status === 'Terminé') return CheckCircle2
  if (status === 'En cours') return Clock
  return AlertCircle
}

const getStatusColor = (status: string) => {
  if (status === 'Terminé') return 'text-emerald-500'
  if (status === 'En cours') return 'text-indigo-500'
  return 'text-amber-500'
}

const goToReport = (id: number) => {
  router.push(`/installer/report/${id}`)
}

onMounted(() => {
  fetchInstallations()
  // Always auto-refresh every 10s so new assignments from admin appear too
  refreshInterval.value = setInterval(() => {
    fetchInstallations()
  }, 10000)
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex flex-col pb-20 relative">
    <!-- Toast Banner -->
    <transition name="slide-down">
      <div 
        v-if="successToast"
        class="fixed top-4 left-4 right-4 z-[100] px-5 py-4 bg-slate-900 text-white text-sm font-bold rounded-2xl shadow-xl flex items-center gap-3"
      >
        <span class="flex-1">{{ successToast }}</span>
      </div>
    </transition>

    <!-- Header -->
    <header class="bg-white border-b px-6 py-6 sticky top-0 z-10">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-black text-slate-900 tracking-tight uppercase">Mes Installations</h1>
          <p class="text-indigo-600 text-sm font-bold uppercase tracking-widest text-[10px]">Espace Poseur • Amar</p>
        </div>
        <div class="flex items-center gap-3">
          <button @click="logout" class="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100 hover:bg-rose-100 transition-colors shadow-sm" title="Déconnexion">
            <LogOut class="w-5 h-5" />
          </button>
          <div class="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <Truck class="text-white w-6 h-6" />
          </div>
        </div>
      </div>

      <!-- Actions & Search -->
      <div class="space-y-4">
        <!-- "+ Nouveau Chantier" Button -->
        <button 
          @click="showCreateModal = true"
          class="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 active:scale-[0.98] transition-all animate-bounce-subtle"
        >
          <Plus class="w-4 h-4" />
          Nouveau Chantier
        </button>

        <div class="relative">
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Rechercher mes chantiers..."
            class="w-full pl-11 pr-4 py-3 bg-slate-100 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
          />
        </div>
      </div>
    </header>

    <!-- Amar's Personal Stats Dashboard -->
    <div v-if="!loading" class="px-6 pt-4 pb-2 max-w-xl mx-auto w-full">
      <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Mon Suivi</p>
      <div class="grid grid-cols-4 gap-2">
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 text-center">
          <span class="text-2xl font-black text-slate-900">{{ stats.total }}</span>
          <p class="text-[8px] font-black text-slate-400 uppercase tracking-wider mt-0.5">Total</p>
        </div>
        <div class="bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm p-3 text-center">
          <span class="text-2xl font-black text-emerald-600">{{ stats.done }}</span>
          <p class="text-[8px] font-black text-emerald-500 uppercase tracking-wider mt-0.5">Terminés</p>
        </div>
        <div class="bg-indigo-50 rounded-2xl border border-indigo-100 shadow-sm p-3 text-center">
          <span class="text-2xl font-black text-indigo-600">{{ stats.inProgress }}</span>
          <p class="text-[8px] font-black text-indigo-500 uppercase tracking-wider mt-0.5">En cours</p>
        </div>
        <div class="bg-amber-50 rounded-2xl border border-amber-100 shadow-sm p-3 text-center">
          <span class="text-2xl font-black text-amber-600">{{ stats.todo }}</span>
          <p class="text-[8px] font-black text-amber-500 uppercase tracking-wider mt-0.5">À faire</p>
        </div>
      </div>
      <!-- Progress bar -->
      <div class="mt-3 bg-slate-100 rounded-full h-2 overflow-hidden">
        <div 
          class="h-full bg-emerald-500 rounded-full transition-all duration-700"
          :style="{ width: stats.total > 0 ? (stats.done / stats.total * 100) + '%' : '0%' }"
        ></div>
      </div>
      <p class="text-[9px] font-bold text-slate-400 mt-1 text-right">
        {{ stats.total > 0 ? Math.round(stats.done / stats.total * 100) : 0 }}% terminés
      </p>
    </div>

    <!-- Content -->
    <main class="flex-1 px-6 py-4 space-y-4 max-w-xl mx-auto w-full">

      <div v-if="loading" class="flex flex-col items-center justify-center py-20 space-y-4">
        <div class="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
        <p class="text-slate-400 font-medium animate-pulse">Chargement de mes chantiers...</p>
      </div>

      <div v-else-if="filteredInstallations().length === 0" class="flex flex-col items-center justify-center py-16 text-center space-y-5 px-4">
        <div class="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center">
          <Truck class="w-10 h-10 text-indigo-300" />
        </div>
        <div class="space-y-2">
          <p class="text-slate-700 font-black text-base">Aucun chantier assigné</p>
          <!-- Error message if Supabase failed -->
          <div v-if="fetchError" class="mt-2 px-4 py-3 bg-rose-50 border border-rose-100 rounded-2xl max-w-xs mx-auto">
            <p class="text-rose-600 text-xs font-bold">⚠️ Erreur base de données</p>
            <p class="text-rose-500 text-[10px] font-medium mt-0.5 break-all">{{ fetchError }}</p>
          </div>
          <p v-else class="text-slate-400 text-xs font-medium leading-relaxed max-w-xs">
            Tes chantiers s'afficheront ici.<br/>
            Tu peux aussi en créer un directement avec le bouton <strong class="text-indigo-600">+ Nouveau Chantier</strong> ci-dessus.
          </p>
        </div>
        <button 
          @click="fetchInstallations"
          class="px-6 py-2.5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black text-slate-900 shadow-sm active:scale-95 transition-all flex items-center gap-2 uppercase tracking-widest"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="loading && 'animate-spin'" />
          Actualiser
        </button>
      </div>

      <div 
        v-else
        v-for="inst in filteredInstallations()" 
        :key="inst.id"
        @click="goToReport(inst.id)"
        class="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm active:scale-[0.98] transition-all cursor-pointer group relative overflow-hidden"
      >
        <div class="flex justify-between items-start mb-4">
          <div class="flex items-center gap-2">
            <div :class="[getStatusColor(inst.status), 'p-1.5 rounded-xl bg-slate-50 border border-current/10']">
              <component :is="getStatusIcon(inst.status)" class="w-4 h-4" />
            </div>
            <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">{{ inst.status }}</span>
          </div>
          <div class="flex items-center gap-1 text-slate-400">
            <Calendar class="w-3.5 h-3.5" />
            <span class="text-[10px] font-black uppercase">{{ inst.deadline }}</span>
          </div>
        </div>

        <h3 class="text-xl font-black text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors leading-tight">{{ inst.client }}</h3>
        
        <!-- Project Link Badge -->
        <div v-if="(inst as any).projects?.name" class="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-indigo-50 border border-indigo-100 mb-4">
          <Briefcase class="w-3.5 h-3.5 text-indigo-500" />
          <span class="text-[9px] font-black uppercase text-indigo-600">{{ (inst as any).projects?.name }}</span>
        </div>
        
        <div class="space-y-3 mb-6">
          <div class="flex items-start gap-2 text-slate-500">
            <MapPin class="w-4 h-4 mt-0.5 shrink-0 opacity-40" />
            <p class="text-sm font-bold leading-snug">{{ inst.address }}</p>
          </div>
          <div class="flex items-center gap-2 text-slate-500">
            <div class="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
              <User class="w-3.5 h-3.5 shrink-0 text-slate-400" />
            </div>
            <p class="text-[11px] font-black uppercase tracking-tight">{{ inst.poseur }}</p>
          </div>
        </div>

        <div class="pt-4 border-t border-slate-50 flex items-center justify-between">
          <span class="text-[10px] font-black uppercase tracking-widest text-indigo-500">Remplir le rapport / Notes</span>
          <div class="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
            <ChevronRight class="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
          </div>
        </div>
        
        <!-- Decoration -->
        <div class="absolute -right-4 -top-4 w-16 h-16 bg-slate-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
      </div>
    </main>

    <!-- Modal: Nouveau Chantier / Intervention (Amar View) -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click="showCreateModal = false">
      <div class="bg-white rounded-[32px] max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200" @click.stop>
        
        <!-- Modal Header -->
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 class="text-xl font-black text-slate-900 tracking-tight">Nouveau Chantier</h3>
            <p class="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">Création & Rapport instantané</p>
          </div>
          <button @click="showCreateModal = false" class="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X class="h-5 w-5" />
          </button>
        </div>

        <!-- Modal Content (Scrollable Form) -->
        <div class="p-6 overflow-y-auto max-h-[60vh] space-y-5">
          <!-- Nom du Client -->
          <div class="space-y-1.5">
            <label class="text-xs font-black text-slate-600 uppercase tracking-wide">Nom du Client *</label>
            <input 
              v-model="newIntervention.client"
              placeholder="Ex: Boulangerie Paul"
              class="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-500 outline-none transition-all font-semibold"
            />
          </div>

          <!-- Adresse -->
          <div class="space-y-1.5">
            <label class="text-xs font-black text-slate-600 uppercase tracking-wide">Adresse du Chantier</label>
            <input 
              v-model="newIntervention.address"
              placeholder="Ex: 12 Rue de la Gare, Toulouse"
              class="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-500 outline-none transition-all font-semibold"
            />
          </div>

          <!-- Type d'Enseigne -->
          <div class="space-y-1.5">
            <label class="text-xs font-black text-slate-600 uppercase tracking-wide">Type d'Enseigne</label>
            <input 
              v-model="newIntervention.signType"
              placeholder="Ex: Double-face LED"
              class="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-500 outline-none transition-all font-semibold"
            />
          </div>

          <div class="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
            <!-- Statut -->
            <div class="space-y-1.5">
              <label class="text-xs font-black text-slate-600 uppercase tracking-wide">Statut</label>
              <select 
                v-model="newIntervention.status"
                class="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold"
              >
                <option value="Terminé">Terminé</option>
                <option value="En cours">En cours</option>
                <option value="À planifier">À planifier</option>
              </select>
            </div>
            <!-- Date de réalisation -->
            <div class="space-y-1.5">
              <label class="text-xs font-black text-slate-600 uppercase tracking-wide">Date</label>
              <input 
                disabled
                placeholder="Aujourd'hui"
                class="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-slate-100 text-slate-400 font-bold outline-none cursor-not-allowed"
              />
            </div>
          </div>

          <!-- Horaires de travail - DEUX DROPDOWNS DÉROULANTS -->
          <div class="space-y-1.5 border-t border-slate-50 pt-4">
            <label class="text-xs font-black text-slate-600 uppercase tracking-wide block">Horaires de travail</label>
            <div class="grid grid-cols-2 gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/60 shadow-3xs">
              <div class="space-y-1">
                <span class="text-[9px] font-bold text-slate-400 uppercase">Commencé à :</span>
                <div class="relative flex items-center bg-white rounded-xl border border-slate-200/60">
                  <Clock class="absolute left-3 w-3.5 h-3.5 text-indigo-500 pointer-events-none" />
                  <select 
                    v-model="newIntervention.startTime"
                    class="w-full pl-9 pr-6 py-3 bg-transparent border-none text-xs font-bold text-slate-800 outline-none appearance-none"
                  >
                    <option v-for="h in startHoursOptions" :key="h" :value="h">{{ h }}</option>
                  </select>
                  <div class="absolute right-2 pointer-events-none text-slate-400 text-[10px]">▼</div>
                </div>
              </div>

              <div class="space-y-1">
                <span class="text-[9px] font-bold text-slate-400 uppercase">Fini à :</span>
                <div class="relative flex items-center bg-white rounded-xl border border-slate-200/60">
                  <Clock class="absolute left-3 w-3.5 h-3.5 text-indigo-500 pointer-events-none" />
                  <select 
                    v-model="newIntervention.endTime"
                    class="w-full pl-9 pr-6 py-3 bg-transparent border-none text-xs font-bold text-slate-800 outline-none appearance-none"
                  >
                    <option v-for="h in endHoursOptions" :key="h" :value="h">{{ h }}</option>
                  </select>
                  <div class="absolute right-2 pointer-events-none text-slate-400 text-[10px]">▼</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Upload Photos -->
          <div class="space-y-3 border-t border-slate-50 pt-4">
            <div class="flex items-center justify-between">
              <label class="text-xs font-black text-slate-600 uppercase tracking-wide">Photos du Chantier</label>
              <span class="text-[10px] font-bold text-slate-400">{{ newIntervention.photos.length }} photo(s)</span>
            </div>
            
            <div class="grid grid-cols-3 gap-2.5">
              <!-- Photo Previews -->
              <div v-for="(photo, index) in newIntervention.photos" :key="index" class="relative aspect-square rounded-2xl overflow-hidden shadow-xs border border-slate-100 shrink-0">
                <img :src="photo" class="w-full h-full object-cover" />
                <button 
                  type="button"
                  @click="removeCreatePhoto(index)"
                  class="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>

              <!-- Upload trigger -->
              <label class="aspect-square rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-slate-100/50 active:scale-95 transition-all">
                <input type="file" multiple accept="image/*" class="hidden" @change="handleCreatePhotoUpload" />
                <Camera v-if="!createUploading" class="w-5 h-5 text-indigo-500" />
                <Loader2 v-else class="w-5 h-5 text-indigo-500 animate-spin" />
                <span class="text-[8px] font-black text-slate-400 uppercase tracking-tight">Ajouter</span>
              </label>
            </div>
          </div>

          <!-- Notes / Compte-rendu -->
          <div class="space-y-1.5 border-t border-slate-50 pt-4">
            <label class="text-xs font-black text-slate-600 uppercase tracking-wide">Remarques / Compte-rendu</label>
            <textarea 
              v-model="newIntervention.notes"
              rows="3"
              placeholder="Expliquez ce qui a été fait ou remarques..."
              class="w-full p-4 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-500 outline-none transition-all font-semibold resize-none"
            ></textarea>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 shrink-0">
          <Button variant="ghost" size="sm" @click="showCreateModal = false" :disabled="savingNew" class="rounded-xl">Annuler</Button>
          <Button 
            @click="submitNewIntervention" 
            :disabled="savingNew" 
            class="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-2 px-5"
          >
            <Loader2 v-if="savingNew" class="w-4 h-4 animate-spin" />
            Enregistrer Chantier
          </Button>
        </div>

      </div>
    </div>

    <!-- Bottom Nav -->
    <nav class="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t px-8 py-4 flex justify-between items-center z-10 shadow-2xl">
      <div class="flex flex-col items-center gap-1 text-indigo-600">
        <Truck class="w-6 h-6" />
        <span class="text-[9px] font-black uppercase tracking-widest">Missions</span>
      </div>
      <div class="flex flex-col items-center gap-1 text-slate-300">
        <CheckCircle2 class="w-6 h-6 opacity-40" />
        <span class="text-[9px] font-black uppercase tracking-widest opacity-40">Terminées</span>
      </div>
      <div class="flex flex-col items-center gap-1 text-slate-300">
        <User class="w-6 h-6 opacity-40" />
        <span class="text-[9px] font-black uppercase tracking-widest opacity-40">Profil</span>
      </div>
    </nav>

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

@keyframes bounce-subtle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
.animate-bounce-subtle {
  animation: bounce-subtle 2s infinite ease-in-out;
}

/* Toast slide-down transition */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
