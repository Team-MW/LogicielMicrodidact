<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { 
  Building2, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Trash2, 
  Pencil, 
  Image as ImageIcon, 
  Camera, 
  Upload, 
  X, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  ExternalLink, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  MessageSquare, 
  Send, 
  Filter, 
  LayoutGrid, 
  List, 
  Sparkles,
  TrendingUp,
  DollarSign,
  FileCheck2,
  RefreshCw,
  Loader2
} from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { commercialService, type CommercialProject, type CommercialNote } from '@/services/commercial'
import { uploadToCloudinary } from '@/lib/cloudinary'

const projects = ref<CommercialProject[]>([])
const notesMap = ref<Record<number, CommercialNote[]>>({})
const isLoading = ref(true)
const isOnline = ref(true)
const searchQuery = ref('')
const activeStatusFilter = ref('Tous')
const activeView = ref<'cards' | 'table'>('cards')

// Notification Toast
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'info'>('success')
const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
  toastMessage.value = msg
  toastType.value = type
  setTimeout(() => { toastMessage.value = '' }, 4000)
}

// Status definitions
const statuses = [
  'Tous',
  'Devis à faire',
  'Rendez-vous pris',
  'Devis envoyé',
  'Négociation',
  'Gagné / Signé',
  'Perdu'
]

const projectTypes = [
  'Enseigne / Signalétique',
  'Site Web / Vitrine',
  'Logiciel de Caisse',
  'Marquage Véhicule',
  'Print & Flyers',
  'Pack Complet',
  'Autre'
]

const priorities = ['Basse', 'Moyenne', 'Haute', 'Urgente']

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Gagné / Signé':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'Devis envoyé':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'Négociation':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'Rendez-vous pris':
      return 'bg-purple-50 text-purple-700 border-purple-200'
    case 'Perdu':
      return 'bg-rose-50 text-rose-700 border-rose-200'
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case 'Urgente':
      return 'bg-rose-100 text-rose-700 border-rose-200 font-bold'
    case 'Haute':
      return 'bg-orange-100 text-orange-700 border-orange-200'
    case 'Moyenne':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200'
  }
}

// Fetch data
const loadData = async () => {
  isLoading.value = true
  const res = await commercialService.getProjects()
  projects.value = res.data
  isOnline.value = res.isOnline
  notesMap.value = await commercialService.getNotes()
  isLoading.value = false
}

onMounted(() => {
  loadData()
})

// Metrics
const stats = computed(() => {
  const total = projects.value.length
  const signed = projects.value.filter(p => p.status === 'Gagné / Signé').length
  const inProgress = projects.value.filter(p => ['Devis à faire', 'Rendez-vous pris', 'Devis envoyé', 'Négociation'].includes(p.status)).length
  
  const totalPipelineRevenue = projects.value.reduce((acc, p) => {
    const raw = (p.estimated_amount || '').replace(/[^0-9.]/g, '')
    const val = parseFloat(raw) || 0
    return acc + val
  }, 0)

  return { total, signed, inProgress, totalPipelineRevenue }
})

// Filtered projects
const filteredProjects = computed(() => {
  return projects.value.filter(p => {
    const matchesFilter = activeStatusFilter.value === 'Tous' || p.status === activeStatusFilter.value
    const q = searchQuery.value.toLowerCase().trim()
    if (!q) return matchesFilter

    const matchesSearch = 
      p.name.toLowerCase().includes(q) ||
      p.client.toLowerCase().includes(q) ||
      (p.contact_name && p.contact_name.toLowerCase().includes(q)) ||
      (p.address && p.address.toLowerCase().includes(q)) ||
      (p.project_type && p.project_type.toLowerCase().includes(q)) ||
      (p.commercial_name && p.commercial_name.toLowerCase().includes(q))

    return matchesFilter && matchesSearch
  })
})

// --- Modal Add / Edit Project ---
const showProjectModal = ref(false)
const isEditing = ref(false)
const editingId = ref<number | null>(null)
const isSubmitting = ref(false)
const isUploadingPhotos = ref(false)
const uploadProgressText = ref('')

const projectForm = ref({
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
  commercial_name: 'Commercial',
  deadline: '',
  description: '',
  photos: [] as string[]
})

const resetForm = () => {
  projectForm.value = {
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
    commercial_name: 'Commercial',
    deadline: '',
    description: '',
    photos: []
  }
  isEditing.value = false
  editingId.value = null
}

const openNewProjectModal = () => {
  resetForm()
  showProjectModal.value = true
}

const openEditProjectModal = (project: CommercialProject) => {
  isEditing.value = true
  editingId.value = project.id
  projectForm.value = {
    name: project.name,
    client: project.client,
    contact_name: project.contact_name || '',
    contact_phone: project.contact_phone || '',
    contact_email: project.contact_email || '',
    address: project.address || '',
    project_type: project.project_type || 'Enseigne / Signalétique',
    status: project.status || 'Devis à faire',
    priority: project.priority || 'Moyenne',
    estimated_amount: project.estimated_amount || '',
    commercial_name: project.commercial_name || 'Commercial',
    deadline: project.deadline || '',
    description: project.description || '',
    photos: [...(project.photos || [])]
  }
  showProjectModal.value = true
}

// Upload photos directly
const handlePhotoUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return

  const files = Array.from(input.files)
  isUploadingPhotos.value = true
  uploadProgressText.value = `Téléchargement de ${files.length} photo(s)...`

  try {
    const urls: string[] = []
    for (let i = 0; i < files.length; i++) {
      uploadProgressText.value = `Upload photo ${i + 1}/${files.length}...`
      const url = await uploadToCloudinary(files[i], 'microdidact/commercial')
      urls.push(url)
    }
    projectForm.value.photos.push(...urls)
    showToast(`✅ ${urls.length} photo(s) ajoutée(s) avec succès !`)
  } catch (error: any) {
    console.error('Erreur Cloudinary:', error)
    showToast('❌ Erreur lors de l\'upload des photos. Vérifiez votre connexion.', 'error')
  } finally {
    isUploadingPhotos.value = false
    uploadProgressText.value = ''
    input.value = ''
  }
}

const removeFormPhoto = (index: number) => {
  projectForm.value.photos.splice(index, 1)
}

// Save Project
const saveProject = async () => {
  if (!projectForm.value.name.trim() || !projectForm.value.client.trim()) {
    showToast('⚠️ Veuillez renseigner au moins le nom du projet et le client.', 'error')
    return
  }

  isSubmitting.value = true
  try {
    if (isEditing.value && editingId.value) {
      await commercialService.updateProject(editingId.value, { ...projectForm.value })
      showToast('✅ Projet commercial mis à jour !')
    } else {
      await commercialService.createProject({ ...projectForm.value })
      showToast('🎉 Nouveau projet commercial créé avec succès !')
    }
    await loadData()
    showProjectModal.value = false
    resetForm()
  } catch (err: any) {
    console.error('Erreur saveProject:', err)
    showToast('❌ Une erreur est survenue lors de l\'enregistrement.', 'error')
  } finally {
    isSubmitting.value = false
  }
}

// Delete Project
const confirmDeleteProject = async (id: number) => {
  if (confirm('Êtes-vous sûr de vouloir supprimer définitivement ce projet commercial ?')) {
    await commercialService.deleteProject(id)
    await loadData()
    showToast('🗑️ Projet commercial supprimé.')
  }
}

// Update status quickly from card
const updateProjectStatus = async (project: CommercialProject, newStatus: string) => {
  project.status = newStatus
  await commercialService.updateProject(project.id, { status: newStatus })
  showToast(`Statut mis à jour : "${newStatus}"`)
}

// --- Direct Card Photo Upload ---
const cardUploadInput = ref<HTMLInputElement | null>(null)
const targetProjectIdForUpload = ref<number | null>(null)

const triggerCardPhotoUpload = (projectId: number) => {
  targetProjectIdForUpload.value = projectId
  cardUploadInput.value?.click()
}

const handleCardPhotoUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0 || !targetProjectIdForUpload.value) return

  const p = projects.value.find(item => item.id === targetProjectIdForUpload.value)
  if (!p) return

  const files = Array.from(input.files)
  isLoading.value = true
  try {
    for (const file of files) {
      const url = await uploadToCloudinary(file, 'microdidact/commercial')
      p.photos.push(url)
    }
    await commercialService.updateProject(p.id, { photos: p.photos })
    showToast(`📸 ${files.length} photo(s) ajoutée(s) au projet !`)
  } catch (err) {
    showToast('❌ Erreur lors de l\'ajout des photos.', 'error')
  } finally {
    isLoading.value = false
    targetProjectIdForUpload.value = null
    input.value = ''
  }
}

// --- Lightbox Modal (Full-size Photo Viewer) ---
const activeLightboxPhotos = ref<string[]>([])
const activePhotoIndex = ref(0)
const isLightboxOpen = ref(false)
const lightboxProjectId = ref<number | null>(null)

const openLightbox = (photos: string[], index = 0, projectId?: number) => {
  if (!photos || photos.length === 0) return
  activeLightboxPhotos.value = photos
  activePhotoIndex.value = index
  lightboxProjectId.value = projectId || null
  isLightboxOpen.value = true
}

const nextLightboxPhoto = () => {
  if (activePhotoIndex.value < activeLightboxPhotos.value.length - 1) {
    activePhotoIndex.value++
  } else {
    activePhotoIndex.value = 0
  }
}

const prevLightboxPhoto = () => {
  if (activePhotoIndex.value > 0) {
    activePhotoIndex.value--
  } else {
    activePhotoIndex.value = activeLightboxPhotos.value.length - 1
  }
}

const deleteLightboxPhoto = async () => {
  if (!lightboxProjectId.value) return
  if (!confirm('Voulez-vous supprimer cette photo du projet ?')) return

  const p = projects.value.find(item => item.id === lightboxProjectId.value)
  if (!p) return

  p.photos.splice(activePhotoIndex.value, 1)
  await commercialService.updateProject(p.id, { photos: p.photos })
  activeLightboxPhotos.value = [...p.photos]

  if (activeLightboxPhotos.value.length === 0) {
    isLightboxOpen.value = false
  } else if (activePhotoIndex.value >= activeLightboxPhotos.value.length) {
    activePhotoIndex.value = activeLightboxPhotos.value.length - 1
  }
  showToast('Photo supprimée du projet.')
}

// --- Notes / Follow-ups Modal ---
const activeProjectForNotes = ref<CommercialProject | null>(null)
const showNotesModal = ref(false)
const newNoteInput = ref('')
const isAddingNote = ref(false)

const openNotesModal = (project: CommercialProject) => {
  activeProjectForNotes.value = project
  showNotesModal.value = true
}

const handleAddNote = async () => {
  if (!activeProjectForNotes.value || !newNoteInput.value.trim()) return
  isAddingNote.value = true
  try {
    await commercialService.addNote(activeProjectForNotes.value.id, newNoteInput.value.trim())
    notesMap.value = await commercialService.getNotes()
    newNoteInput.value = ''
    showToast('Note ajoutée au suivi !')
  } catch (e) {
    showToast('Erreur ajout note', 'error')
  } finally {
    isAddingNote.value = false
  }
}

const handleDeleteNote = async (noteId: number) => {
  if (!activeProjectForNotes.value) return
  await commercialService.deleteNote(noteId, activeProjectForNotes.value.id)
  notesMap.value = await commercialService.getNotes()
  showToast('Note supprimée.')
}
</script>

<template>
  <div class="flex-1 space-y-6 p-4 md:p-8 bg-slate-50/50 min-h-screen relative">
    
    <!-- Hidden input for card direct photo upload -->
    <input 
      type="file" 
      ref="cardUploadInput" 
      class="hidden" 
      accept="image/*" 
      multiple 
      @change="handleCardPhotoUpload" 
    />

    <!-- Toast Notification -->
    <div 
      v-if="toastMessage" 
      class="fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl border flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300 font-bold text-sm"
      :class="[
        toastType === 'success' ? 'bg-emerald-950 text-white border-emerald-800' : 
        toastType === 'error' ? 'bg-rose-950 text-white border-rose-800' : 
        'bg-slate-900 text-white border-slate-700'
      ]"
    >
      <span>{{ toastMessage }}</span>
    </div>

    <!-- Header Section -->
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div class="space-y-1">
        <div class="flex items-center gap-2.5">
          <div class="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
            <TrendingUp class="h-5 w-5" />
          </div>
          <div>
            <h1 class="text-2xl md:text-3xl font-black tracking-tight text-slate-900 uppercase">
              Section Commerciale & Projets
            </h1>
            <p class="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Gestion des nouveaux projets, prospections et prises de photos directes
            </p>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3 w-full md:w-auto">
        <Button 
          variant="outline" 
          @click="loadData" 
          class="rounded-xl border-slate-200 hover:bg-white text-slate-600 font-bold text-xs gap-2 py-5 shadow-xs"
        >
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': isLoading }" />
          <span>Actualiser</span>
        </Button>

        <Button 
          @click="openNewProjectModal" 
          class="flex-1 md:flex-none rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs gap-2 py-5 shadow-lg shadow-indigo-100 active:scale-98 transition-all uppercase tracking-wider"
        >
          <Plus class="h-4 w-4" />
          <span>Nouveau Projet Commercial</span>
        </Button>
      </div>
    </div>

    <!-- Stats Bar -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card class="bg-white border-slate-100 rounded-2xl shadow-xs p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Projets</p>
            <h3 class="text-2xl font-black text-slate-900 mt-1">{{ stats.total }}</h3>
          </div>
          <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Building2 class="h-5 w-5" />
          </div>
        </div>
      </Card>

      <Card class="bg-white border-slate-100 rounded-2xl shadow-xs p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">En Négociation / Devis</p>
            <h3 class="text-2xl font-black text-amber-600 mt-1">{{ stats.inProgress }}</h3>
          </div>
          <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock class="h-5 w-5" />
          </div>
        </div>
      </Card>

      <Card class="bg-white border-slate-100 rounded-2xl shadow-xs p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">Gagnés / Signés</p>
            <h3 class="text-2xl font-black text-emerald-600 mt-1">{{ stats.signed }}</h3>
          </div>
          <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 class="h-5 w-5" />
          </div>
        </div>
      </Card>

      <Card class="bg-white border-slate-100 rounded-2xl shadow-xs p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">Pipeline Estimé</p>
            <h3 class="text-2xl font-black text-slate-900 mt-1">{{ stats.totalPipelineRevenue.toLocaleString('fr-FR') }} €</h3>
          </div>
          <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign class="h-5 w-5" />
          </div>
        </div>
      </Card>
    </div>

    <!-- Filters & Search Toolbar -->
    <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white p-3 md:p-4 rounded-2xl border border-slate-100 shadow-xs">
      
      <!-- Search Input -->
      <div class="relative flex-1">
        <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
          v-model="searchQuery" 
          placeholder="Rechercher par client, projet, ville, téléphone..." 
          class="pl-10 pr-4 py-2 bg-slate-50 border-slate-100 rounded-xl font-medium text-xs focus-visible:ring-indigo-100 focus-visible:ring-2"
        />
        <button 
          v-if="searchQuery" 
          @click="searchQuery = ''" 
          class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          <X class="h-3.5 w-3.5" />
        </button>
      </div>

      <!-- Status Pills -->
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 no-scrollbar">
        <button 
          v-for="st in statuses" 
          :key="st" 
          @click="activeStatusFilter = st"
          class="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap"
          :class="[
            activeStatusFilter === st 
              ? 'bg-slate-900 text-white shadow-xs' 
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
          ]"
        >
          {{ st }}
        </button>
      </div>

      <!-- View Switcher -->
      <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-end lg:self-auto">
        <button 
          @click="activeView = 'cards'" 
          class="p-1.5 rounded-lg text-slate-600 transition-all"
          :class="{ 'bg-white shadow-xs text-indigo-600': activeView === 'cards' }"
          title="Vue Cartes"
        >
          <LayoutGrid class="h-4 w-4" />
        </button>
        <button 
          @click="activeView = 'table'" 
          class="p-1.5 rounded-lg text-slate-600 transition-all"
          :class="{ 'bg-white shadow-xs text-indigo-600': activeView === 'table' }"
          title="Vue Tableau"
        >
          <List class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="py-16 flex flex-col items-center justify-center">
      <Loader2 class="h-8 w-8 text-indigo-600 animate-spin" />
      <p class="mt-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Chargement des projets commerciaux...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredProjects.length === 0" class="py-16 text-center bg-white rounded-3xl border border-slate-100 p-8">
      <div class="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
        <Building2 class="h-7 w-7" />
      </div>
      <h3 class="text-base font-black text-slate-900 uppercase">Aucun projet commercial trouvé</h3>
      <p class="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
        {{ searchQuery ? 'Aucun résultat ne correspond à votre recherche.' : 'Commencez par ajouter le premier projet avec ses photos en cliquant ci-dessous.' }}
      </p>
      <Button 
        @click="openNewProjectModal" 
        class="mt-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs gap-2 py-5 shadow-lg shadow-indigo-100 uppercase tracking-wider"
      >
        <Plus class="h-4 w-4" />
        <span>Nouveau Projet Commercial</span>
      </Button>
    </div>

    <!-- CARDS VIEW -->
    <div v-else-if="activeView === 'cards'" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      <div 
        v-for="project in filteredProjects" 
        :key="project.id" 
        class="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group relative overflow-hidden"
      >
        <!-- Card Top Bar: Badges & Menu -->
        <div>
          <div class="flex items-center justify-between gap-2 mb-3">
            <span class="px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider border" :class="getStatusBadge(project.status)">
              {{ project.status }}
            </span>
            <span class="px-2 py-0.5 rounded-lg text-[9px] font-bold border" :class="getPriorityBadge(project.priority)">
              {{ project.priority }}
            </span>
          </div>

          <!-- Project & Client Title -->
          <h3 class="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
            {{ project.name }}
          </h3>
          <p class="text-xs font-bold text-slate-500 flex items-center gap-1.5 mt-0.5">
            <Building2 class="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span class="truncate">{{ project.client }}</span>
            <span class="text-slate-300">•</span>
            <span class="text-[10px] font-semibold text-indigo-600">{{ project.project_type }}</span>
          </p>

          <!-- Contact details & Address -->
          <div class="mt-3.5 space-y-1.5 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-2xl border border-slate-100/80">
            <div v-if="project.contact_name" class="font-bold text-slate-800 text-[11px] truncate">
              👤 {{ project.contact_name }}
            </div>
            <div v-if="project.contact_phone" class="flex items-center gap-2">
              <Phone class="h-3.5 w-3.5 text-slate-400" />
              <a :href="'tel:' + project.contact_phone" class="text-indigo-600 font-bold hover:underline">
                {{ project.contact_phone }}
              </a>
            </div>
            <div v-if="project.contact_email" class="flex items-center gap-2">
              <Mail class="h-3.5 w-3.5 text-slate-400" />
              <a :href="'mailto:' + project.contact_email" class="text-slate-600 truncate hover:text-slate-900">
                {{ project.contact_email }}
              </a>
            </div>
            <div v-if="project.address" class="flex items-center gap-2">
              <MapPin class="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <a 
                :href="'https://maps.google.com/?q=' + encodeURIComponent(project.address)" 
                target="_blank" 
                class="truncate text-slate-600 hover:text-indigo-600"
              >
                {{ project.address }}
              </a>
            </div>
          </div>

          <!-- Description if any -->
          <p v-if="project.description" class="text-xs text-slate-600 mt-3 line-clamp-2 italic bg-amber-50/40 p-2 rounded-xl border border-amber-100/50">
            "{{ project.description }}"
          </p>

          <!-- PHOTOS GALLERY SECTION -->
          <div class="mt-4 pt-3 border-t border-slate-100">
            <div class="flex items-center justify-between mb-2">
              <span class="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Camera class="h-3.5 w-3.5 text-slate-400" />
                <span>Photos du projet ({{ (project.photos || []).length }})</span>
              </span>
              
              <!-- Quick direct photo add button on card -->
              <button 
                @click="triggerCardPhotoUpload(project.id)" 
                class="text-[10px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-lg transition-colors"
                title="Ajouter des photos directement"
              >
                <Plus class="h-3 w-3" />
                <span>Ajouter photo</span>
              </button>
            </div>

            <!-- Photos Thumbnails Grid -->
            <div v-if="project.photos && project.photos.length > 0" class="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <div 
                v-for="(photo, idx) in project.photos" 
                :key="photo" 
                @click="openLightbox(project.photos, idx, project.id)"
                class="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-slate-200 cursor-pointer hover:opacity-90 group/thumb shadow-2xs transition-all"
              >
                <img :src="photo" class="w-full h-full object-cover" alt="Photo projet" loading="lazy" />
                <div class="absolute inset-0 bg-slate-900/30 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity text-white text-[9px] font-bold">
                  🔍
                </div>
              </div>
            </div>

            <div 
              v-else 
              @click="triggerCardPhotoUpload(project.id)"
              class="border-2 border-dashed border-slate-200 rounded-xl p-2.5 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all"
            >
              <p class="text-[10px] font-bold text-slate-400 flex items-center justify-center gap-1.5">
                <Camera class="h-3.5 w-3.5 text-slate-400" />
                <span>Cliquez pour ajouter les photos du chantier / magasin</span>
              </p>
            </div>
          </div>
        </div>

        <!-- Card Footer -->
        <div class="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span class="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Montant Estimé</span>
            <span class="text-base font-black text-slate-900">
              {{ project.estimated_amount ? project.estimated_amount + ' €' : 'À chiffrer' }}
            </span>
          </div>

          <div class="flex items-center gap-1.5">
            <!-- Notes button -->
            <button 
              @click="openNotesModal(project)"
              class="relative p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              title="Notes et suivi"
            >
              <MessageSquare class="h-4 w-4" />
              <span 
                v-if="(notesMap[project.id] || []).length > 0" 
                class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-black flex items-center justify-center"
              >
                {{ (notesMap[project.id] || []).length }}
              </span>
            </button>

            <!-- Edit button -->
            <button 
              @click="openEditProjectModal(project)"
              class="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Modifier"
            >
              <Pencil class="h-4 w-4" />
            </button>

            <!-- Delete button -->
            <button 
              @click="confirmDeleteProject(project.id)"
              class="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Supprimer"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- TABLE VIEW -->
    <div v-else class="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
            <tr>
              <th class="p-4">Projet & Client</th>
              <th class="p-4">Photos</th>
              <th class="p-4">Contact</th>
              <th class="p-4">Type</th>
              <th class="p-4">Montant</th>
              <th class="p-4">Statut</th>
              <th class="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="project in filteredProjects" :key="project.id" class="hover:bg-slate-50/60 transition-colors">
              <td class="p-4">
                <div class="font-black text-slate-900">{{ project.name }}</div>
                <div class="text-[11px] font-bold text-slate-500">{{ project.client }}</div>
              </td>
              <td class="p-4">
                <div v-if="project.photos && project.photos.length > 0" class="flex items-center gap-1.5">
                  <div 
                    v-for="(photo, idx) in project.photos.slice(0, 3)" 
                    :key="photo"
                    @click="openLightbox(project.photos, idx, project.id)"
                    class="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:opacity-80 shrink-0"
                  >
                    <img :src="photo" class="w-full h-full object-cover" />
                  </div>
                  <span v-if="project.photos.length > 3" class="text-[10px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                    +{{ project.photos.length - 3 }}
                  </span>
                </div>
                <button 
                  v-else 
                  @click="triggerCardPhotoUpload(project.id)" 
                  class="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
                >
                  <Plus class="h-3 w-3" /> + Photo
                </button>
              </td>
              <td class="p-4">
                <div v-if="project.contact_phone" class="font-bold text-slate-700">{{ project.contact_phone }}</div>
                <div v-if="project.address" class="text-[10px] text-slate-400 truncate max-w-[150px]">{{ project.address }}</div>
              </td>
              <td class="p-4 font-bold text-slate-600">
                {{ project.project_type }}
              </td>
              <td class="p-4 font-black text-slate-900">
                {{ project.estimated_amount ? project.estimated_amount + ' €' : '-' }}
              </td>
              <td class="p-4">
                <span class="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border" :class="getStatusBadge(project.status)">
                  {{ project.status }}
                </span>
              </td>
              <td class="p-4 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button @click="openNotesModal(project)" class="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50">
                    <MessageSquare class="h-4 w-4" />
                  </button>
                  <button @click="openEditProjectModal(project)" class="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100">
                    <Pencil class="h-4 w-4" />
                  </button>
                  <button @click="confirmDeleteProject(project.id)" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50">
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL: ADD / EDIT COMMERCIAL PROJECT WITH DIRECT PHOTOS -->
    <div 
      v-if="showProjectModal" 
      class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto"
      @click.self="showProjectModal = false"
    >
      <div class="bg-white rounded-[32px] w-full max-w-2xl border border-slate-100 shadow-2xl p-6 md:p-8 space-y-6 my-8 animate-in fade-in zoom-in-95 duration-200">
        
        <!-- Modal Header -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-100">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 class="h-5 w-5" />
            </div>
            <div>
              <h2 class="text-xl font-black text-slate-900 uppercase">
                {{ isEditing ? 'Modifier le Projet Commercial' : 'Nouveau Projet Commercial' }}
              </h2>
              <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Renseignez les détails du client et joignez directement les photos
              </p>
            </div>
          </div>
          <button @click="showProjectModal = false" class="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X class="h-5 w-5" />
          </button>
        </div>

        <!-- Form Content -->
        <div class="space-y-4 max-h-[65vh] overflow-y-auto pr-1 no-scrollbar">
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Project Name -->
            <div class="space-y-1">
              <label class="text-[10px] font-black uppercase tracking-wider text-slate-500">Nom du Projet *</label>
              <Input 
                v-model="projectForm.name" 
                placeholder="Ex: Enseigne lumineuse restaurant" 
                class="rounded-xl bg-slate-50 border-slate-100 font-bold"
              />
            </div>

            <!-- Client / Company -->
            <div class="space-y-1">
              <label class="text-[10px] font-black uppercase tracking-wider text-slate-500">Client / Société *</label>
              <Input 
                v-model="projectForm.client" 
                placeholder="Ex: Le Bistrot Parisien" 
                class="rounded-xl bg-slate-50 border-slate-100 font-bold"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Contact Name -->
            <div class="space-y-1">
              <label class="text-[10px] font-black uppercase tracking-wider text-slate-500">Interlocuteur</label>
              <Input 
                v-model="projectForm.contact_name" 
                placeholder="Nom du responsable" 
                class="rounded-xl bg-slate-50 border-slate-100"
              />
            </div>

            <!-- Contact Phone -->
            <div class="space-y-1">
              <label class="text-[10px] font-black uppercase tracking-wider text-slate-500">Téléphone</label>
              <Input 
                v-model="projectForm.contact_phone" 
                placeholder="06 12 34 56 78" 
                class="rounded-xl bg-slate-50 border-slate-100"
              />
            </div>

            <!-- Contact Email -->
            <div class="space-y-1">
              <label class="text-[10px] font-black uppercase tracking-wider text-slate-500">Email</label>
              <Input 
                v-model="projectForm.contact_email" 
                placeholder="contact@client.fr" 
                class="rounded-xl bg-slate-50 border-slate-100"
              />
            </div>
          </div>

          <!-- Address -->
          <div class="space-y-1">
            <label class="text-[10px] font-black uppercase tracking-wider text-slate-500">Adresse / Localisation du chantier</label>
            <Input 
              v-model="projectForm.address" 
              placeholder="Ex: 14 Avenue des Champs-Élysées, 75008 Paris" 
              class="rounded-xl bg-slate-50 border-slate-100"
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Project Type -->
            <div class="space-y-1">
              <label class="text-[10px] font-black uppercase tracking-wider text-slate-500">Type de projet</label>
              <select 
                v-model="projectForm.project_type" 
                class="w-full rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option v-for="t in projectTypes" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>

            <!-- Status -->
            <div class="space-y-1">
              <label class="text-[10px] font-black uppercase tracking-wider text-slate-500">Statut</label>
              <select 
                v-model="projectForm.status" 
                class="w-full rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option v-for="s in statuses.filter(x => x !== 'Tous')" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>

            <!-- Priority -->
            <div class="space-y-1">
              <label class="text-[10px] font-black uppercase tracking-wider text-slate-500">Priorité</label>
              <select 
                v-model="projectForm.priority" 
                class="w-full rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option v-for="p in priorities" :key="p" :value="p">{{ p }}</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Estimated Amount -->
            <div class="space-y-1">
              <label class="text-[10px] font-black uppercase tracking-wider text-slate-500">Montant Estimé (€)</label>
              <Input 
                v-model="projectForm.estimated_amount" 
                placeholder="Ex: 3500" 
                class="rounded-xl bg-slate-50 border-slate-100 font-bold"
              />
            </div>

            <!-- Deadline -->
            <div class="space-y-1">
              <label class="text-[10px] font-black uppercase tracking-wider text-slate-500">Échéance prévue</label>
              <Input 
                v-model="projectForm.deadline" 
                type="date"
                class="rounded-xl bg-slate-50 border-slate-100 text-xs font-bold"
              />
            </div>
          </div>

          <!-- Description -->
          <div class="space-y-1">
            <label class="text-[10px] font-black uppercase tracking-wider text-slate-500">Description & Besoins client</label>
            <textarea 
              v-model="projectForm.description" 
              rows="3" 
              placeholder="Dimensions, couleurs souhaitées, logo fourni, contraintes techniques..."
              class="w-full rounded-xl bg-slate-50 border border-slate-100 p-3 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            ></textarea>
          </div>

          <!-- DIRECT PHOTO UPLOAD SECTION -->
          <div class="space-y-2 pt-2 border-t border-slate-100">
            <div class="flex items-center justify-between">
              <label class="text-[10px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Camera class="h-4 w-4 text-indigo-600" />
                <span>Photos du projet (Magasin, Enseigne actuelle, Devis, Plan...)</span>
              </label>
              <span class="text-[10px] font-bold text-slate-400">
                {{ projectForm.photos.length }} photo(s)
              </span>
            </div>

            <!-- Direct Upload Actions (Camera + Gallery) -->
            <div class="flex flex-wrap items-center gap-3">
              <!-- Take photo directly (Camera mobile) -->
              <label class="cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-black transition-all">
                <Camera class="h-4 w-4" />
                <span>Prendre une photo (Appareil)</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  class="hidden" 
                  @change="handlePhotoUpload"
                  :disabled="isUploadingPhotos"
                />
              </label>

              <!-- Pick multiple files from device -->
              <label class="cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black transition-all">
                <Upload class="h-4 w-4" />
                <span>Importer depuis la galerie</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  class="hidden" 
                  @change="handlePhotoUpload"
                  :disabled="isUploadingPhotos"
                />
              </label>

              <span v-if="isUploadingPhotos" class="flex items-center gap-2 text-xs font-bold text-indigo-600 animate-pulse">
                <Loader2 class="h-4 w-4 animate-spin" />
                <span>{{ uploadProgressText }}</span>
              </span>
            </div>

            <!-- Uploaded Photos Preview Grid -->
            <div v-if="projectForm.photos.length > 0" class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
              <div 
                v-for="(photo, index) in projectForm.photos" 
                :key="photo"
                class="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 group shadow-2xs"
              >
                <img :src="photo" class="w-full h-full object-cover" />
                <button 
                  type="button" 
                  @click="removeFormPhoto(index)" 
                  class="absolute top-1 right-1 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center hover:bg-rose-700 shadow-md transition-all"
                  title="Supprimer la photo"
                >
                  <X class="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <p v-else class="text-[11px] text-slate-400 italic">
              Aucune photo attachée pour le moment. Vous pouvez en prendre une directement ou importer des fichiers.
            </p>
          </div>

        </div>

        <!-- Modal Footer -->
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button 
            variant="ghost" 
            @click="showProjectModal = false" 
            class="rounded-xl font-bold text-xs"
          >
            Annuler
          </Button>

          <Button 
            @click="saveProject" 
            :disabled="isSubmitting || isUploadingPhotos"
            class="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-6 py-5 shadow-lg shadow-indigo-100 uppercase tracking-wider"
          >
            <Loader2 v-if="isSubmitting" class="h-4 w-4 animate-spin mr-2" />
            <span>{{ isEditing ? 'Mettre à jour le projet' : 'Enregistrer le projet' }}</span>
          </Button>
        </div>

      </div>
    </div>

    <!-- LIGHTBOX MODAL: FULL RESOLUTION PHOTO VIEWER -->
    <div 
      v-if="isLightboxOpen && activeLightboxPhotos.length > 0" 
      class="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
      @click.self="isLightboxOpen = false"
    >
      <!-- Top Bar -->
      <div class="absolute top-4 inset-x-4 flex items-center justify-between text-white z-10">
        <span class="text-xs font-black tracking-widest bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-sm">
          PHOTO {{ activePhotoIndex + 1 }} / {{ activeLightboxPhotos.length }}
        </span>

        <div class="flex items-center gap-2">
          <!-- Download -->
          <a 
            :href="activeLightboxPhotos[activePhotoIndex]" 
            target="_blank" 
            download 
            class="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Télécharger"
          >
            <Download class="h-5 w-5" />
          </a>

          <!-- Delete photo from project if linked -->
          <button 
            v-if="lightboxProjectId" 
            @click="deleteLightboxPhoto" 
            class="p-2.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white transition-colors"
            title="Supprimer la photo"
          >
            <Trash2 class="h-5 w-5" />
          </button>

          <!-- Close -->
          <button 
            @click="isLightboxOpen = false" 
            class="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X class="h-5 w-5" />
          </button>
        </div>
      </div>

      <!-- Main Photo -->
      <div class="relative max-w-4xl max-h-[80vh] flex items-center justify-center">
        <img 
          :src="activeLightboxPhotos[activePhotoIndex]" 
          class="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200" 
          alt="Vue agrandie" 
        />
      </div>

      <!-- Navigation Arrows -->
      <button 
        v-if="activeLightboxPhotos.length > 1"
        @click="prevLightboxPhoto" 
        class="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all backdrop-blur-sm"
      >
        <ChevronLeft class="h-6 w-6" />
      </button>

      <button 
        v-if="activeLightboxPhotos.length > 1"
        @click="nextLightboxPhoto" 
        class="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all backdrop-blur-sm"
      >
        <ChevronRight class="h-6 w-6" />
      </button>
    </div>

    <!-- NOTES / JOURNAL MODAL -->
    <div 
      v-if="showNotesModal && activeProjectForNotes" 
      class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      @click.self="showNotesModal = false"
    >
      <div class="bg-white rounded-[32px] w-full max-w-lg border border-slate-100 shadow-2xl p-6 md:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 class="text-lg font-black text-slate-900 uppercase">Journal de Suivi Commercial</h3>
            <p class="text-xs font-bold text-slate-500">{{ activeProjectForNotes.client }} — {{ activeProjectForNotes.name }}</p>
          </div>
          <button @click="showNotesModal = false" class="p-2 rounded-xl text-slate-400 hover:text-slate-600">
            <X class="h-5 w-5" />
          </button>
        </div>

        <!-- Notes List -->
        <div class="space-y-3 max-h-60 overflow-y-auto pr-1">
          <div 
            v-for="note in (notesMap[activeProjectForNotes.id] || [])" 
            :key="note.id" 
            class="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start justify-between gap-3"
          >
            <div class="space-y-1">
              <span class="text-[9px] font-black uppercase tracking-wider text-indigo-600 block">{{ note.date }}</span>
              <p class="text-xs text-slate-700 font-medium whitespace-pre-wrap">{{ note.text }}</p>
            </div>
            <button 
              @click="handleDeleteNote(note.id)" 
              class="text-slate-300 hover:text-rose-500 p-1"
              title="Supprimer la note"
            >
              <Trash2 class="h-3.5 w-3.5" />
            </button>
          </div>

          <div v-if="!(notesMap[activeProjectForNotes.id] || []).length" class="text-center py-8 text-slate-400 text-xs italic">
            Aucune note pour le moment. Notez vos appels, relances et accords ci-dessous.
          </div>
        </div>

        <!-- Add Note Input -->
        <div class="space-y-2 pt-2 border-t border-slate-100">
          <label class="text-[10px] font-black uppercase tracking-wider text-slate-500">Ajouter une note de suivi</label>
          <div class="flex gap-2">
            <Input 
              v-model="newNoteInput" 
              placeholder="Ex: Devis envoyé ce matin, relance prévue vendredi..." 
              class="rounded-xl bg-slate-50 border-slate-100 font-medium text-xs"
              @keyup.enter="handleAddNote"
            />
            <Button 
              @click="handleAddNote" 
              :disabled="isAddingNote || !newNoteInput.trim()"
              class="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-4"
            >
              <Send class="h-4 w-4" />
            </Button>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>
