<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Building2, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Camera, 
  Upload, 
  X, 
  CheckCircle2, 
  Clock, 
  LogOut, 
  Loader2, 
  RefreshCw, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  ArrowLeft,
  DollarSign
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { commercialService, type CommercialProject } from '@/services/commercial'
import { uploadToCloudinary } from '@/lib/cloudinary'

const router = useRouter()
const projects = ref<CommercialProject[]>([])
const loading = ref(true)
const searchQuery = ref('')
const activeTab = ref<'en_cours' | 'signes'>('en_cours')
const successToast = ref('')

const showToast = (msg: string) => {
  successToast.value = msg
  setTimeout(() => { successToast.value = '' }, 3500)
}

const logout = () => {
  sessionStorage.removeItem('md_auth')
  sessionStorage.removeItem('md_role')
  router.push('/login')
}

// Fetch
const fetchProjects = async () => {
  loading.value = true
  const res = await commercialService.getProjects()
  projects.value = res.data
  loading.value = false
}

onMounted(() => {
  fetchProjects()
})

const filteredProjects = computed(() => {
  return projects.value.filter(p => {
    const isSigned = p.status === 'Gagné / Signé'
    const matchesTab = activeTab.value === 'en_cours' ? !isSigned : isSigned
    if (!matchesTab) return false

    const q = searchQuery.value.toLowerCase().trim()
    if (!q) return true

    return (
      p.name.toLowerCase().includes(q) ||
      p.client.toLowerCase().includes(q) ||
      (p.contact_name && p.contact_name.toLowerCase().includes(q)) ||
      (p.address && p.address.toLowerCase().includes(q))
    )
  })
})

// --- Add Project State ---
const showCreateModal = ref(false)
const savingNew = ref(false)
const uploadingPhotos = ref(false)
const uploadProgressText = ref('')

const newProject = ref({
  name: '',
  client: '',
  contact_name: '',
  contact_phone: '',
  contact_email: '',
  address: '',
  project_type: 'Enseigne / Signalétique',
  status: 'Devis à faire',
  priority: 'Moyenne',
  estimated_amount: '',
  description: '',
  photos: [] as string[]
})

const handleNewPhotoUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return

  const files = Array.from(target.files)
  uploadingPhotos.value = true
  uploadProgressText.value = `Envoi de ${files.length} photo(s)...`

  try {
    for (let i = 0; i < files.length; i++) {
      uploadProgressText.value = `Photo ${i + 1}/${files.length}...`
      const url = await uploadToCloudinary(files[i], 'microdidact/commercial')
      newProject.value.photos.push(url)
    }
    showToast(`📸 ${files.length} photo(s) ajoutée(s) !`)
  } catch (err) {
    showToast('❌ Erreur lors de l\'upload de la photo.')
  } finally {
    uploadingPhotos.value = false
    uploadProgressText.value = ''
    target.value = ''
  }
}

const removeNewPhoto = (idx: number) => {
  newProject.value.photos.splice(idx, 1)
}

const submitNewProject = async () => {
  if (!newProject.value.name.trim() || !newProject.value.client.trim()) {
    showToast('⚠️ Précisez le nom du projet et le client.')
    return
  }

  savingNew.value = true
  try {
    await commercialService.createProject({
      ...newProject.value,
      commercial_name: 'Commercial Terrain'
    })
    showCreateModal.value = false
    newProject.value = {
      name: '',
      client: '',
      contact_name: '',
      contact_phone: '',
      contact_email: '',
      address: '',
      project_type: 'Enseigne / Signalétique',
      status: 'Devis à faire',
      priority: 'Moyenne',
      estimated_amount: '',
      description: '',
      photos: []
    }
    await fetchProjects()
    showToast('🎉 Nouveau projet enregistré avec ses photos !')
  } catch (e) {
    showToast('❌ Erreur de sauvegarde.')
  } finally {
    savingNew.value = false
  }
}

// --- Quick Card Photo Upload ---
const targetCardId = ref<number | null>(null)
const cardFileInput = ref<HTMLInputElement | null>(null)

const triggerCardPhoto = (id: number) => {
  targetCardId.value = id
  cardFileInput.value?.click()
}

const handleCardPhoto = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0 || !targetCardId.value) return

  const p = projects.value.find(item => item.id === targetCardId.value)
  if (!p) return

  loading.value = true
  try {
    for (const f of Array.from(input.files)) {
      const url = await uploadToCloudinary(f, 'microdidact/commercial')
      p.photos.push(url)
    }
    await commercialService.updateProject(p.id, { photos: p.photos })
    showToast('📸 Photo(s) ajoutée(s) au projet !')
  } catch (e) {
    showToast('❌ Erreur ajout photo.')
  } finally {
    loading.value = false
    targetCardId.value = null
    input.value = ''
  }
}

// Lightbox
const lightboxPhotos = ref<string[]>([])
const activeIndex = ref(0)
const isLightboxOpen = ref(false)

const openLightbox = (photos: string[], idx = 0) => {
  lightboxPhotos.value = photos
  activeIndex.value = idx
  isLightboxOpen.value = true
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex flex-col max-w-lg mx-auto shadow-2xl relative pb-24">
    
    <!-- Hidden input for card photo adding -->
    <input 
      type="file" 
      ref="cardFileInput" 
      class="hidden" 
      accept="image/*" 
      capture="environment" 
      @change="handleCardPhoto" 
    />

    <!-- Toast Notification -->
    <div 
      v-if="successToast" 
      class="fixed top-4 inset-x-4 z-50 p-4 rounded-2xl bg-slate-900 text-white text-center font-bold text-xs shadow-2xl animate-in slide-in-from-top-4"
    >
      {{ successToast }}
    </div>

    <!-- Header Mobile Top Bar -->
    <header class="bg-white border-b border-slate-100 p-4 sticky top-0 z-40 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <router-link to="/commercial-projects" class="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <Building2 class="h-5 w-5" />
        </router-link>
        <div>
          <h1 class="text-sm font-black uppercase text-slate-900 tracking-tight">Espace Commercial</h1>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saisie terrain & Photos</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button 
          @click="fetchProjects" 
          class="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
        </button>
        <button 
          @click="logout" 
          class="p-2 rounded-xl text-rose-500 hover:bg-rose-50"
          title="Déconnexion"
        >
          <LogOut class="h-4 w-4" />
        </button>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="p-4 space-y-4 flex-1">
      
      <!-- Big Action: New Commercial Project with Direct Photos -->
      <button 
        @click="showCreateModal = true" 
        class="w-full py-4 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-200 transition-all"
      >
        <Camera class="h-5 w-5" />
        <span>Nouveau Projet & Photos</span>
        <Plus class="h-4 w-4 ml-auto" />
      </button>

      <!-- Tabs (En cours / Signés) -->
      <div class="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-xs">
        <button 
          @click="activeTab = 'en_cours'"
          class="flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
          :class="activeTab === 'en_cours' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'"
        >
          En cours / Devis
        </button>
        <button 
          @click="activeTab = 'signes'"
          class="flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
          :class="activeTab === 'signes' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'"
        >
          Gagnés / Signés
        </button>
      </div>

      <!-- Search Bar -->
      <div class="relative">
        <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
          v-model="searchQuery" 
          placeholder="Rechercher client, projet, ville..." 
          class="pl-10 pr-4 py-2 bg-white border-slate-100 rounded-xl text-xs font-medium shadow-2xs"
        />
      </div>

      <!-- Loading -->
      <div v-if="loading" class="py-12 text-center text-slate-400">
        <Loader2 class="h-6 w-6 animate-spin mx-auto text-indigo-600 mb-2" />
        <p class="text-[10px] font-bold uppercase tracking-wider">Chargement des projets...</p>
      </div>

      <!-- Empty -->
      <div v-else-if="filteredProjects.length === 0" class="py-12 text-center bg-white rounded-3xl border border-slate-100 p-6">
        <Building2 class="h-10 w-10 text-slate-300 mx-auto mb-2" />
        <p class="text-xs font-black text-slate-700 uppercase">Aucun projet trouvé</p>
        <p class="text-[10px] text-slate-400 mt-1">Appuyez sur "Nouveau Projet" pour ajouter votre première opportunité.</p>
      </div>

      <!-- Projects Cards List -->
      <div v-else class="space-y-3">
        <div 
          v-for="p in filteredProjects" 
          :key="p.id"
          class="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs space-y-3"
        >
          <div class="flex items-start justify-between gap-2">
            <div>
              <span class="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                {{ p.status }}
              </span>
              <h3 class="text-sm font-black text-slate-900 mt-1">{{ p.name }}</h3>
              <p class="text-xs font-bold text-slate-500">{{ p.client }}</p>
            </div>
            
            <div class="text-right">
              <span class="text-xs font-black text-slate-900 block">
                {{ p.estimated_amount ? p.estimated_amount + ' €' : '-' }}
              </span>
              <span class="text-[9px] font-bold text-slate-400">{{ p.project_type }}</span>
            </div>
          </div>

          <!-- Quick Action Buttons: Call & Maps -->
          <div class="flex items-center gap-2 pt-1">
            <a 
              v-if="p.contact_phone" 
              :href="'tel:' + p.contact_phone"
              class="flex-1 py-2 px-3 rounded-xl bg-emerald-50 text-emerald-700 text-[11px] font-black flex items-center justify-center gap-1.5 hover:bg-emerald-100 transition-colors"
            >
              <Phone class="h-3.5 w-3.5" />
              <span>Appeler</span>
            </a>

            <a 
              v-if="p.address" 
              :href="'https://maps.google.com/?q=' + encodeURIComponent(p.address)"
              target="_blank"
              class="flex-1 py-2 px-3 rounded-xl bg-slate-50 text-slate-700 text-[11px] font-black flex items-center justify-center gap-1.5 hover:bg-slate-100 transition-colors"
            >
              <MapPin class="h-3.5 w-3.5" />
              <span>Itinéraire</span>
            </a>

            <button 
              @click="triggerCardPhoto(p.id)"
              class="py-2 px-3 rounded-xl bg-indigo-50 text-indigo-700 text-[11px] font-black flex items-center justify-center gap-1.5 hover:bg-indigo-100 transition-colors"
              title="Ajouter une photo"
            >
              <Camera class="h-3.5 w-3.5" />
              <span>+ Photo</span>
            </button>
          </div>

          <!-- Photos Preview -->
          <div v-if="p.photos && p.photos.length > 0" class="flex items-center gap-2 overflow-x-auto pt-1 no-scrollbar">
            <div 
              v-for="(photo, idx) in p.photos" 
              :key="photo"
              @click="openLightbox(p.photos, idx)"
              class="w-14 h-14 rounded-xl overflow-hidden border border-slate-100 shrink-0 cursor-pointer shadow-2xs"
            >
              <img :src="photo" class="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </div>

    </main>

    <!-- NEW PROJECT MODAL (MOBILE FRIENDLY) -->
    <div 
      v-if="showCreateModal" 
      class="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex flex-col justify-end sm:justify-center p-0 sm:p-4"
    >
      <div class="bg-white rounded-t-[32px] sm:rounded-[32px] w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 animate-in slide-in-from-bottom duration-300">
        
        <div class="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h2 class="text-base font-black text-slate-900 uppercase">Nouveau Projet Commercial</h2>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client & Prises de Photos</p>
          </div>
          <button @click="showCreateModal = false" class="p-2 text-slate-400 hover:text-slate-600">
            <X class="h-5 w-5" />
          </button>
        </div>

        <div class="space-y-3">
          <div>
            <label class="text-[10px] font-black uppercase text-slate-400">Nom du Projet *</label>
            <Input v-model="newProject.name" placeholder="Ex: Enseigne Bar Brasserie" class="rounded-xl bg-slate-50 font-bold" />
          </div>

          <div>
            <label class="text-[10px] font-black uppercase text-slate-400">Client / Entreprise *</label>
            <Input v-model="newProject.client" placeholder="Ex: SAS Brasserie du Port" class="rounded-xl bg-slate-50 font-bold" />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-[10px] font-black uppercase text-slate-400">Contact</label>
              <Input v-model="newProject.contact_name" placeholder="Nom" class="rounded-xl bg-slate-50 text-xs" />
            </div>
            <div>
              <label class="text-[10px] font-black uppercase text-slate-400">Téléphone</label>
              <Input v-model="newProject.contact_phone" placeholder="06..." class="rounded-xl bg-slate-50 text-xs" />
            </div>
          </div>

          <div>
            <label class="text-[10px] font-black uppercase text-slate-400">Adresse</label>
            <Input v-model="newProject.address" placeholder="Rue, Ville..." class="rounded-xl bg-slate-50 text-xs" />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-[10px] font-black uppercase text-slate-400">Type de projet</label>
              <select v-model="newProject.project_type" class="w-full rounded-xl bg-slate-50 border p-2 text-xs font-bold">
                <option value="Enseigne / Signalétique">Enseigne / Signalétique</option>
                <option value="Site Web / Vitrine">Site Web / Vitrine</option>
                <option value="Logiciel de Caisse">Logiciel de Caisse</option>
                <option value="Marquage Véhicule">Marquage Véhicule</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
            <div>
              <label class="text-[10px] font-black uppercase text-slate-400">Montant (€)</label>
              <Input v-model="newProject.estimated_amount" placeholder="Ex: 2500" class="rounded-xl bg-slate-50 font-bold text-xs" />
            </div>
          </div>

          <!-- PHOTO SECTION DIRECT -->
          <div class="pt-2 border-t border-slate-100 space-y-2">
            <label class="text-[10px] font-black uppercase text-slate-700 flex items-center justify-between">
              <span>Photos du Chantier / Magasin</span>
              <span class="text-indigo-600 font-bold">{{ newProject.photos.length }} photo(s)</span>
            </label>

            <div class="flex items-center gap-2">
              <label class="flex-1 py-3 px-4 rounded-xl bg-indigo-600 text-white font-black text-xs uppercase flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-100">
                <Camera class="h-4 w-4" />
                <span>Prendre Photo</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  class="hidden" 
                  @change="handleNewPhotoUpload" 
                />
              </label>

              <label class="py-3 px-4 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer">
                <Upload class="h-4 w-4" />
                <span>Galerie</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  class="hidden" 
                  @change="handleNewPhotoUpload" 
                />
              </label>
            </div>

            <p v-if="uploadingPhotos" class="text-xs text-indigo-600 font-bold flex items-center gap-2 animate-pulse">
              <Loader2 class="h-4 w-4 animate-spin" />
              <span>{{ uploadProgressText }}</span>
            </p>

            <!-- Miniatures des photos -->
            <div v-if="newProject.photos.length > 0" class="grid grid-cols-4 gap-2 pt-2">
              <div 
                v-for="(photo, idx) in newProject.photos" 
                :key="photo"
                class="relative aspect-square rounded-xl overflow-hidden border border-slate-200"
              >
                <img :src="photo" class="w-full h-full object-cover" />
                <button 
                  type="button" 
                  @click="removeNewPhoto(idx)"
                  class="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center"
                >
                  <X class="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100 flex items-center gap-2">
          <Button variant="ghost" @click="showCreateModal = false" class="flex-1 rounded-xl text-xs font-bold">
            Annuler
          </Button>
          <Button 
            @click="submitNewProject" 
            :disabled="savingNew || uploadingPhotos"
            class="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-5 uppercase tracking-wider"
          >
            <Loader2 v-if="savingNew" class="h-4 w-4 animate-spin mr-2" />
            <span>Enregistrer</span>
          </Button>
        </div>

      </div>
    </div>

    <!-- LIGHTBOX -->
    <div 
      v-if="isLightboxOpen && lightboxPhotos.length > 0"
      class="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4"
      @click.self="isLightboxOpen = false"
    >
      <div class="absolute top-4 inset-x-4 flex items-center justify-between text-white">
        <span class="text-xs font-black">{{ activeIndex + 1 }} / {{ lightboxPhotos.length }}</span>
        <button @click="isLightboxOpen = false" class="p-2 text-white">
          <X class="h-6 w-6" />
        </button>
      </div>

      <img :src="lightboxPhotos[activeIndex]" class="max-w-full max-h-[85vh] object-contain rounded-xl" />

      <button 
        v-if="lightboxPhotos.length > 1" 
        @click="activeIndex = (activeIndex > 0 ? activeIndex - 1 : lightboxPhotos.length - 1)" 
        class="absolute left-3 p-3 text-white text-2xl"
      >
        ‹
      </button>

      <button 
        v-if="lightboxPhotos.length > 1" 
        @click="activeIndex = (activeIndex < lightboxPhotos.length - 1 ? activeIndex + 1 : 0)" 
        class="absolute right-3 p-3 text-white text-2xl"
      >
        ›
      </button>
    </div>

  </div>
</template>
