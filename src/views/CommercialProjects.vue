<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Building2, 
  Calendar, 
  Plus, 
  FileText, 
  X, 
  Send, 
  Trash2, 
  Search, 
  Pencil, 
  Download, 
  Camera, 
  Upload, 
  Phone, 
  Mail, 
  MapPin, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink
} from 'lucide-vue-next'
import { commercialService, type CommercialProject, type CommercialNote } from '@/services/commercial'
import { uploadToCloudinary } from '@/lib/cloudinary'

const projects = ref<CommercialProject[]>([])
const projectNotes = ref<Record<number, CommercialNote[]>>({})
const activeFilter = ref('Tous')
const selectedProject = ref<CommercialProject | null>(null)
const newNoteText = ref('')
const searchQuery = ref('')
const isLoading = ref(true)

// Add Project Modal State
const showAddModal = ref(false)
const isSubmittingAdd = ref(false)
const isUploadingAddPhotos = ref(false)
const addPhotoUploadProgress = ref('')

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
  deadline: '',
  description: '',
  photos: [] as string[]
})

// Edit Project Modal State
const isEditing = ref(false)
const editingProjectData = ref<any>(null)
const isUploadingEditPhotos = ref(false)
const editPhotoUploadProgress = ref('')

// Card Direct Upload State
const cardUploadInput = ref<HTMLInputElement | null>(null)
const targetProjectIdForUpload = ref<number | null>(null)

// Lightbox State
const activeLightboxPhotos = ref<string[]>([])
const activePhotoIndex = ref(0)
const isLightboxOpen = ref(false)

// Fetch all projects & notes
const fetchProjects = async () => {
  isLoading.value = true
  const res = await commercialService.getProjects()
  projects.value = res.data
  projectNotes.value = await commercialService.getNotes()
  isLoading.value = false
}

onMounted(() => {
  fetchProjects()
})

const parseTextWithLinks = (text: string) => {
  if (!text) return ''
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g
  return escaped.replace(urlRegex, (url) => {
    const href = url.startsWith('www') ? `https://${url}` : url
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 underline hover:text-indigo-800 break-all font-bold">${url}</a>`
  })
}

// Status Colors exactly matching the project design
const getStatusColor = (status: string) => {
  if (status === 'Perdu') return 'bg-rose-50 text-rose-700 border-rose-200'
  if (status === 'Gagné / Signé') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (status === 'Devis envoyé') return 'bg-blue-50 text-blue-700 border-blue-200'
  if (status === 'Négociation') return 'bg-indigo-50 text-indigo-700 border-indigo-200'
  return 'bg-amber-50 text-amber-700 border-amber-200'
}

const getStatusProgress = (status: string) => {
  switch (status) {
    case 'Gagné / Signé': return 100
    case 'Négociation': return 75
    case 'Devis envoyé': return 50
    case 'Devis à faire': return 25
    case 'Perdu': return 0
    default: return 20
  }
}

// Filtering
const filteredProjects = computed(() => {
  let list = projects.value

  if (activeFilter.value !== 'Tous') {
    if (activeFilter.value === 'Gagnés / Signés') {
      list = list.filter(p => p.status === 'Gagné / Signé')
    } else if (activeFilter.value === 'En cours') {
      list = list.filter(p => ['Devis à faire', 'Devis envoyé', 'Négociation', 'Rendez-vous pris'].includes(p.status))
    } else if (activeFilter.value === 'Perdus') {
      list = list.filter(p => p.status === 'Perdu')
    } else {
      list = list.filter(p => p.status === activeFilter.value)
    }
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.client.toLowerCase().includes(q) ||
      (p.contact_name && p.contact_name.toLowerCase().includes(q)) ||
      (p.contact_phone && p.contact_phone.toLowerCase().includes(q)) ||
      (p.address && p.address.toLowerCase().includes(q)) ||
      (p.project_type && p.project_type.toLowerCase().includes(q))
    )
  }

  return list
})

// Quick status update on card
const updateStatus = async (projectId: number, newStatus: string) => {
  const p = projects.value.find(item => item.id === projectId)
  if (p) {
    p.status = newStatus
    await commercialService.updateProject(projectId, { status: newStatus })
  }
}

// Add Note
const addNote = async () => {
  if (!selectedProject.value || !newNoteText.value.trim()) return
  const projectId = selectedProject.value.id
  const note = await commercialService.addNote(projectId, newNoteText.value.trim())
  if (!projectNotes.value[projectId]) projectNotes.value[projectId] = []
  projectNotes.value[projectId].unshift(note)
  newNoteText.value = ''
}

// Delete Note
const deleteNote = async (noteId: number, projectId: number) => {
  if (confirm('Supprimer cette note ?')) {
    await commercialService.deleteNote(noteId, projectId)
    if (projectNotes.value[projectId]) {
      projectNotes.value[projectId] = projectNotes.value[projectId].filter(n => n.id !== noteId)
    }
  }
}

// Delete Project
const deleteProject = async (id: number) => {
  if (confirm('Êtes-vous sûr de vouloir supprimer définitivement ce projet commercial ?')) {
    await commercialService.deleteProject(id)
    projects.value = projects.value.filter(p => p.id !== id)
    selectedProject.value = null
  }
}

// Photo Upload in New Project Modal
const handleAddPhotoUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return

  const files = Array.from(input.files)
  isUploadingAddPhotos.value = true
  addPhotoUploadProgress.value = `Envoi de ${files.length} photo(s)...`

  try {
    for (let i = 0; i < files.length; i++) {
      addPhotoUploadProgress.value = `Photo ${i + 1}/${files.length}...`
      const url = await uploadToCloudinary(files[i], 'microdidact/commercial')
      newProject.value.photos.push(url)
    }
  } catch (e) {
    alert("Erreur lors de l'upload des photos.")
  } finally {
    isUploadingAddPhotos.value = false
    addPhotoUploadProgress.value = ''
    input.value = ''
  }
}

const removeAddPhoto = (idx: number) => {
  newProject.value.photos.splice(idx, 1)
}

// Add Project Submit
const addProject = async () => {
  if (!newProject.value.name.trim() || !newProject.value.client.trim()) {
    alert('Veuillez préciser le nom du projet et le client.')
    return
  }

  isSubmittingAdd.value = true
  try {
    const created = await commercialService.createProject({
      ...newProject.value,
      commercial_name: 'Commercial'
    })
    projects.value.unshift(created)
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
      deadline: '',
      description: '',
      photos: []
    }
    showAddModal.value = false
  } catch (e: any) {
    alert("Erreur lors de la création : " + e.message)
  } finally {
    isSubmittingAdd.value = false
  }
}

// Edit Project
const startEditing = () => {
  if (!selectedProject.value) return
  editingProjectData.value = {
    ...selectedProject.value,
    photos: [...(selectedProject.value.photos || [])]
  }
  isEditing.value = true
}

const cancelEditing = () => {
  isEditing.value = false
  editingProjectData.value = null
}

const handleEditPhotoUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0 || !editingProjectData.value) return

  const files = Array.from(input.files)
  isUploadingEditPhotos.value = true
  editPhotoUploadProgress.value = `Envoi de ${files.length} photo(s)...`

  try {
    for (let i = 0; i < files.length; i++) {
      editPhotoUploadProgress.value = `Photo ${i + 1}/${files.length}...`
      const url = await uploadToCloudinary(files[i], 'microdidact/commercial')
      editingProjectData.value.photos.push(url)
    }
  } catch (e) {
    alert("Erreur lors de l'upload des photos.")
  } finally {
    isUploadingEditPhotos.value = false
    editPhotoUploadProgress.value = ''
    input.value = ''
  }
}

const removeEditPhoto = (idx: number) => {
  if (editingProjectData.value?.photos) {
    editingProjectData.value.photos.splice(idx, 1)
  }
}

const saveProjectUpdate = async () => {
  if (!editingProjectData.value) return

  const updates = { ...editingProjectData.value }
  await commercialService.updateProject(editingProjectData.value.id, updates)

  const idx = projects.value.findIndex(p => p.id === editingProjectData.value.id)
  if (idx !== -1) {
    projects.value[idx] = { ...updates }
  }
  selectedProject.value = { ...updates }
  isEditing.value = false
  editingProjectData.value = null
}

// Card Direct Photo Upload
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
    for (const f of files) {
      const url = await uploadToCloudinary(f, 'microdidact/commercial')
      p.photos.push(url)
    }
    await commercialService.updateProject(p.id, { photos: p.photos })
  } catch (e) {
    alert("Erreur lors de l'ajout des photos.")
  } finally {
    isLoading.value = false
    targetProjectIdForUpload.value = null
    input.value = ''
  }
}

// Lightbox
const openLightbox = (photos: string[], index = 0) => {
  if (!photos || photos.length === 0) return
  activeLightboxPhotos.value = photos
  activePhotoIndex.value = index
  isLightboxOpen.value = true
}

// Export CSV (identique à Suivi Vitrine)
const exportCSV = () => {
  if (filteredProjects.value.length === 0) {
    alert("Aucun projet à exporter.")
    return
  }

  const headers = [
    "Nom du Projet", "Client / Entreprise", "Contact", "Téléphone", 
    "Email", "Adresse", "Type de Projet", "Statut", "Montant Estimé", 
    "Date Limite", "Priorité", "Photos (URLs)"
  ]

  const escapeCSV = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`

  const rows = filteredProjects.value.map(p => {
    return [
      escapeCSV(p.name),
      escapeCSV(p.client),
      escapeCSV(p.contact_name),
      escapeCSV(p.contact_phone),
      escapeCSV(p.contact_email),
      escapeCSV(p.address),
      escapeCSV(p.project_type),
      escapeCSV(p.status),
      escapeCSV(p.estimated_amount ? p.estimated_amount + '€' : ''),
      escapeCSV(p.deadline),
      escapeCSV(p.priority),
      escapeCSV((p.photos || []).join(' | '))
    ].join(';')
  })

  const csvContent = "\uFEFF" + headers.join(';') + "\n" + rows.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `suivi_commercial_${new Date().toISOString().split('T')[0]}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<template>
  <div class="flex-1 space-y-6 p-6 bg-slate-50/30 min-h-screen relative">
    
    <!-- Hidden input for card direct photo upload -->
    <input 
      type="file" 
      ref="cardUploadInput" 
      class="hidden" 
      accept="image/*" 
      multiple 
      @change="handleCardPhotoUpload" 
    />

    <!-- Header Section (Identique à Suivi Vitrine) -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900">Suivi Commercial</h2>
        <p class="text-muted-foreground text-xs">Gérez et mettez à jour vos projets commerciaux et opportunités en temps réel.</p>
      </div>
      <div class="flex items-center gap-2">
        <Button size="sm" variant="outline" @click="exportCSV" class="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm">
          <Download class="mr-1.5 h-3.5 w-3.5" /> Exporter (CSV)
        </Button>
        <Button size="sm" @click="showAddModal = true" class="bg-indigo-600 hover:bg-indigo-500 shadow-sm">
          <Plus class="mr-1.5 h-3.5 w-3.5" /> Nouveau
        </Button>
      </div>
    </div>

    <!-- Search and Filters (Identique à Suivi Vitrine) -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex overflow-x-auto no-scrollbar gap-1 p-1 bg-slate-100 rounded-xl w-full md:w-fit shrink-0">
        <button 
          v-for="filter in ['Tous', 'En cours', 'Devis à faire', 'Devis envoyé', 'Négociation', 'Gagnés / Signés', 'Perdus']" 
          :key="filter"
          @click="activeFilter = filter"
          class="px-4 py-2 text-[10px] font-bold rounded-lg transition-all whitespace-nowrap"
          :class="[
            activeFilter === filter 
              ? (filter === 'Perdus' ? 'bg-rose-100 text-rose-700 shadow-sm' : 'bg-white text-slate-900 shadow-sm') 
              : 'text-slate-500 hover:text-slate-700'
          ]"
        >
          {{ filter }}
        </button>
      </div>

      <div class="relative w-full md:max-w-xs flex-1">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input 
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher un projet, client, ville..."
          class="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium placeholder:text-slate-400 shadow-xs"
        />
      </div>
    </div>

    <!-- Compact Project Grid (Identique à Suivi Vitrine) -->
    <div class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <Card 
        v-for="project in filteredProjects" 
        :key="project.id" 
        class="flex flex-col bg-white border-slate-100/80 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl overflow-hidden cursor-pointer"
        @click="selectedProject = project"
      >
        <CardHeader class="p-4 pb-2 space-y-1">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1">
              <Badge variant="outline" :class="[getStatusColor(project.status), 'text-[10px] px-2 py-0.5 font-bold border']">
                {{ project.status }}
              </Badge>
              <Badge variant="outline" class="text-[10px] px-2 py-0.5 font-bold border bg-slate-50 text-slate-700">
                {{ project.estimated_amount ? project.estimated_amount + ' €' : 'À chiffrer' }}
              </Badge>
              <Badge variant="outline" class="text-[10px] px-1.5 py-0.5 font-bold border bg-indigo-50 text-indigo-700" title="Photos attachées">
                📷 {{ (project.photos || []).length }}
              </Badge>
            </div>
            <span class="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
              <Calendar class="h-3 w-3 text-slate-400" /> {{ project.deadline || 'Sans date' }}
            </span>
          </div>

          <CardTitle class="text-base text-slate-900 font-bold tracking-tight truncate pt-1">{{ project.name }}</CardTitle>
          <CardDescription class="text-slate-400 text-xs truncate">
            Client: <span class="font-bold text-slate-700">{{ project.client }}</span>
            <span v-if="project.contact_phone" class="ml-1 text-indigo-600 font-semibold">• {{ project.contact_phone }}</span>
          </CardDescription>
        </CardHeader>

        <CardContent class="p-4 pt-2 flex-1 flex flex-col justify-between gap-3" @click.stop>
          
          <!-- Direct Photos Thumbnails Preview -->
          <div class="space-y-1">
            <div class="flex items-center justify-between text-[10px]">
              <span class="text-slate-400 font-medium">Photos du projet</span>
              <button 
                @click="triggerCardPhotoUpload(project.id)"
                class="text-indigo-600 font-bold hover:underline flex items-center gap-1"
              >
                <Plus class="h-3 w-3" /> Photo
              </button>
            </div>

            <div v-if="project.photos && project.photos.length > 0" class="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <div 
                v-for="(photo, idx) in project.photos" 
                :key="photo"
                @click="openLightbox(project.photos, idx)"
                class="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <img :src="photo" class="w-full h-full object-cover" />
              </div>
            </div>
            <div 
              v-else 
              @click="triggerCardPhotoUpload(project.id)"
              class="border border-dashed border-slate-200 rounded-lg p-2 text-center cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <span class="text-[10px] text-slate-400 font-medium flex items-center justify-center gap-1">
                <Camera class="h-3 w-3 text-slate-400" /> Ajouter des photos
              </span>
            </div>
          </div>

          <!-- Progression Pipeline -->
          <div class="space-y-1">
            <div class="flex justify-between text-[10px]">
              <span class="text-slate-400 font-medium">Progression</span>
              <span class="font-bold text-indigo-600">{{ getStatusProgress(project.status) }}%</span>
            </div>
            <Progress :model-value="getStatusProgress(project.status)" class="h-1 bg-slate-100" />
          </div>

          <!-- Notes Preview -->
          <div class="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 font-medium truncate flex items-center gap-1">
            <FileText class="h-3 w-3 text-slate-400 shrink-0" />
            <span v-if="projectNotes[project.id]?.length">
              {{ projectNotes[project.id][0].text }}
            </span>
            <span v-else class="text-slate-300 italic">Aucune note de suivi</span>
          </div>

          <!-- Quick Status Change Buttons -->
          <div class="pt-2 border-t border-slate-50 flex flex-col gap-1.5">
            <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Changer le statut</span>
            <div class="flex gap-1">
              <button 
                @click="updateStatus(project.id, 'Devis à faire')"
                class="flex-1 py-1 text-[9px] font-bold rounded border transition-all"
                :class="[project.status === 'Devis à faire' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50']"
              >
                Devis
              </button>
              <button 
                @click="updateStatus(project.id, 'Négociation')"
                class="flex-1 py-1 text-[9px] font-bold rounded border transition-all"
                :class="[project.status === 'Négociation' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50']"
              >
                Négo
              </button>
              <button 
                @click="updateStatus(project.id, 'Gagné / Signé')"
                class="flex-1 py-1 text-[9px] font-bold rounded border transition-all"
                :class="[project.status === 'Gagné / Signé' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50']"
              >
                Signé
              </button>
              <button 
                @click="updateStatus(project.id, 'Perdu')"
                class="flex-1 py-1 text-[9px] font-bold rounded border transition-all"
                :class="[project.status === 'Perdu' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50']"
              >
                Perdu
              </button>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>

    <!-- Empty State -->
    <div v-if="!isLoading && filteredProjects.length === 0" class="text-center py-16 bg-white rounded-2xl border border-slate-100 p-8 shadow-xs">
      <Building2 class="h-10 w-10 text-slate-300 mx-auto mb-2" />
      <h3 class="text-base font-bold text-slate-800">Aucun projet commercial</h3>
      <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
        {{ searchQuery ? 'Aucun projet ne correspond à votre recherche.' : 'Cliquez sur "+ Nouveau" pour enregistrer un nouveau projet et ses photos.' }}
      </p>
      <Button size="sm" @click="showAddModal = true" class="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs">
        <Plus class="h-3.5 w-3.5 mr-1" /> Créer un projet
      </Button>
    </div>

    <!-- MODAL: PROJECT DETAILS & MULTIPLE NOTES & PHOTOS (Identique à Suivi Vitrine) -->
    <div 
      v-if="selectedProject" 
      class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
      @click="selectedProject = null; isEditing = false"
    >
      <div 
        class="bg-white rounded-2xl max-w-4xl w-full max-h-[88vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200" 
        @click.stop
      >
        
        <!-- Modal Header -->
        <div class="p-6 border-b border-slate-100 flex items-start justify-between">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <Badge variant="outline" :class="[getStatusColor(selectedProject?.status || ''), 'text-xs px-2 py-0.5 font-bold border']">
                {{ selectedProject?.status }}
              </Badge>
              <Badge variant="outline" class="text-xs px-2 py-0.5 font-bold border bg-slate-50 text-slate-700">
                {{ selectedProject?.estimated_amount ? selectedProject.estimated_amount + ' €' : 'Montant à chiffrer' }}
              </Badge>
              <Badge variant="outline" class="text-xs px-2 py-0.5 font-bold border bg-indigo-50 text-indigo-700">
                {{ selectedProject?.project_type }}
              </Badge>
            </div>
            <h3 class="text-xl font-bold text-slate-900 tracking-tight">{{ selectedProject?.name }}</h3>
            <p class="text-slate-500 text-sm font-medium">
              Client: <span class="font-bold text-slate-700">{{ selectedProject?.client }}</span>
              <span v-if="selectedProject?.contact_phone" class="ml-2 text-indigo-600">• {{ selectedProject?.contact_phone }}</span>
            </p>
          </div>
          <div class="flex items-center gap-1">
            <button 
              v-if="!isEditing" 
              @click="startEditing" 
              class="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-50 transition-colors" 
              title="Modifier le projet"
            >
              <Pencil class="h-4 w-4" />
            </button>
            <button 
              @click="deleteProject(selectedProject?.id || 0)" 
              class="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors" 
              title="Supprimer le projet"
            >
              <Trash2 class="h-5 w-5" />
            </button>
            <button 
              @click="selectedProject = null; isEditing = false" 
              class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X class="h-5 w-5" />
            </button>
          </div>
        </div>

        <!-- Modal Content -->
        <div class="p-6 overflow-y-auto flex-1 space-y-6">
          
          <!-- EDIT FORM -->
          <div v-if="isEditing" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-xs font-bold text-slate-700">Nom du Projet</label>
                <input v-model="editingProjectData.name" class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all font-medium" />
              </div>
              <div class="space-y-1">
                <label class="text-xs font-bold text-slate-700">Client / Entreprise</label>
                <input v-model="editingProjectData.client" class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all font-medium" />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="space-y-1">
                <label class="text-xs font-bold text-slate-700">Interlocuteur</label>
                <input v-model="editingProjectData.contact_name" class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all" />
              </div>
              <div class="space-y-1">
                <label class="text-xs font-bold text-slate-700">Téléphone</label>
                <input v-model="editingProjectData.contact_phone" class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all" />
              </div>
              <div class="space-y-1">
                <label class="text-xs font-bold text-slate-700">Email</label>
                <input v-model="editingProjectData.contact_email" class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all" />
              </div>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Adresse / Localisation</label>
              <input v-model="editingProjectData.address" class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all" />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="space-y-1">
                <label class="text-xs font-bold text-slate-700">Type de Projet</label>
                <select v-model="editingProjectData.project_type" class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all font-medium">
                  <option value="Enseigne / Signalétique">Enseigne / Signalétique</option>
                  <option value="Site Web / Vitrine">Site Web / Vitrine</option>
                  <option value="Logiciel de Caisse">Logiciel de Caisse</option>
                  <option value="Marquage Véhicule">Marquage Véhicule</option>
                  <option value="Print & Flyers">Print & Flyers</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div class="space-y-1">
                <label class="text-xs font-bold text-slate-700">Statut</label>
                <select v-model="editingProjectData.status" class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all font-medium">
                  <option value="Devis à faire">Devis à faire</option>
                  <option value="Rendez-vous pris">Rendez-vous pris</option>
                  <option value="Devis envoyé">Devis envoyé</option>
                  <option value="Négociation">Négociation</option>
                  <option value="Gagné / Signé">Gagné / Signé</option>
                  <option value="Perdu">Perdu</option>
                </select>
              </div>

              <div class="space-y-1">
                <label class="text-xs font-bold text-slate-700">Montant Estimé (€)</label>
                <input v-model="editingProjectData.estimated_amount" class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all font-medium" />
              </div>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Description / Besoins client</label>
              <textarea v-model="editingProjectData.description" rows="3" class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all font-medium"></textarea>
            </div>

            <!-- Photos Section in Edit Mode -->
            <div class="space-y-2 pt-2 border-t border-slate-100">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Camera class="h-4 w-4 text-indigo-600" /> Photos attachées au projet
                </label>
                <div class="flex items-center gap-2">
                  <label class="cursor-pointer text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
                    <Plus class="h-3.5 w-3.5" /> Ajouter des photos
                    <input type="file" accept="image/*" multiple class="hidden" @change="handleEditPhotoUpload" />
                  </label>
                  <span v-if="isUploadingEditPhotos" class="text-xs text-indigo-600 animate-pulse font-medium">
                    {{ editPhotoUploadProgress }}
                  </span>
                </div>
              </div>

              <div v-if="editingProjectData.photos && editingProjectData.photos.length > 0" class="flex flex-wrap gap-2 pt-1">
                <div 
                  v-for="(photo, idx) in editingProjectData.photos" 
                  :key="photo"
                  class="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200"
                >
                  <img :src="photo" class="w-full h-full object-cover" />
                  <button 
                    type="button" 
                    @click="removeEditPhoto(idx)" 
                    class="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px]"
                  >
                    <X class="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>

            <div class="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button variant="outline" size="sm" @click="cancelEditing">Annuler</Button>
              <Button size="sm" @click="saveProjectUpdate" class="bg-indigo-600 hover:bg-indigo-500 text-white">Enregistrer</Button>
            </div>
          </div>

          <!-- VIEW MODE (IDENTIQUE A SUIVI VITRINE) -->
          <div v-else class="space-y-6">
            
            <!-- Information Cards Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact & Coordonnées</h4>
                <div class="text-sm space-y-1">
                  <div v-if="selectedProject.contact_name" class="font-bold text-slate-800">👤 {{ selectedProject.contact_name }}</div>
                  <div v-if="selectedProject.contact_phone" class="flex items-center gap-2">
                    <Phone class="h-3.5 w-3.5 text-slate-400" />
                    <a :href="'tel:' + selectedProject.contact_phone" class="text-indigo-600 font-bold hover:underline">
                      {{ selectedProject.contact_phone }}
                    </a>
                  </div>
                  <div v-if="selectedProject.contact_email" class="flex items-center gap-2">
                    <Mail class="h-3.5 w-3.5 text-slate-400" />
                    <a :href="'mailto:' + selectedProject.contact_email" class="text-slate-600 hover:underline">
                      {{ selectedProject.contact_email }}
                    </a>
                  </div>
                  <div v-if="selectedProject.address" class="flex items-center gap-2">
                    <MapPin class="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <a :href="'https://maps.google.com/?q=' + encodeURIComponent(selectedProject.address)" target="_blank" class="text-slate-600 hover:text-indigo-600">
                      {{ selectedProject.address }}
                    </a>
                  </div>
                </div>
              </div>

              <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Détails de l'Opportunité</h4>
                <div class="text-sm space-y-1">
                  <div>Type: <span class="font-bold text-slate-800">{{ selectedProject.project_type }}</span></div>
                  <div>Montant estimé: <span class="font-bold text-slate-800">{{ selectedProject.estimated_amount ? selectedProject.estimated_amount + ' €' : 'À chiffrer' }}</span></div>
                  <div>Priorité: <span class="font-bold text-slate-800">{{ selectedProject.priority }}</span></div>
                  <div>Échéance: <span class="font-bold text-slate-800">{{ selectedProject.deadline || 'Non spécifiée' }}</span></div>
                </div>
              </div>
            </div>

            <!-- Description -->
            <div v-if="selectedProject.description" class="bg-amber-50/60 p-4 rounded-xl border border-amber-200/60 space-y-1">
              <h4 class="text-xs font-bold text-amber-900 uppercase tracking-wider">Besoins du client & Notes</h4>
              <p class="text-xs text-amber-800 whitespace-pre-wrap">{{ selectedProject.description }}</p>
            </div>

            <!-- PHOTO GALLERY SECTION -->
            <div class="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Camera class="h-4 w-4 text-indigo-600" /> Photos du projet ({{ (selectedProject.photos || []).length }})
                </h4>

                <div class="flex items-center gap-2">
                  <label class="cursor-pointer text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-lg">
                    <Plus class="h-3.5 w-3.5" /> Ajouter des photos
                    <input type="file" accept="image/*" multiple class="hidden" @change="handleCardPhotoUpload" />
                  </label>
                </div>
              </div>

              <!-- Photos Grid -->
              <div v-if="selectedProject.photos && selectedProject.photos.length > 0" class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-1">
                <div 
                  v-for="(photo, idx) in selectedProject.photos" 
                  :key="photo"
                  @click="openLightbox(selectedProject.photos, idx)"
                  class="relative aspect-square rounded-xl overflow-hidden border border-slate-200 cursor-pointer group shadow-2xs hover:opacity-90 transition-all"
                >
                  <img :src="photo" class="w-full h-full object-cover" />
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold">
                    Agrandir
                  </div>
                </div>
              </div>

              <div v-else class="text-center py-6 text-slate-400 text-xs italic">
                Aucune photo pour ce projet. Vous pouvez en ajouter dès maintenant.
              </div>
            </div>

            <!-- Notes & Suivi Section (Identique à Suivi Vitrine) -->
            <div class="space-y-3">
              <h4 class="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <FileText class="h-4 w-4 text-slate-500" /> Notes & Suivi ({{ selectedProject?.id ? (projectNotes[selectedProject.id]?.length || 0) : 0 }})
              </h4>

              <!-- Add Note Input -->
              <div class="flex gap-2">
                <input 
                  v-model="newNoteText"
                  placeholder="Ajouter une note de contact, relance client..."
                  @keyup.enter="addNote"
                  class="flex-1 px-4 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium placeholder:text-slate-400"
                />
                <Button @click="addNote" size="icon" class="bg-indigo-600 hover:bg-indigo-500 shrink-0 rounded-xl">
                  <Send class="h-4 w-4 text-white" />
                </Button>
              </div>

              <!-- Notes List -->
              <div class="space-y-2 max-h-[250px] overflow-y-auto pr-1" v-if="selectedProject?.id">
                <div 
                  v-for="(note, index) in projectNotes[selectedProject.id]" 
                  :key="note.id || index" 
                  class="bg-slate-50/80 p-3 rounded-xl border border-slate-100/60 space-y-1 relative group"
                >
                  <div class="flex justify-between items-center text-[10px]">
                    <span class="font-bold text-slate-400">Note #{{ projectNotes[selectedProject.id].length - index }}</span>
                    <div class="flex items-center gap-2">
                      <span class="font-medium text-slate-400 bg-slate-200/50 px-1.5 py-0.5 rounded">{{ note.date }}</span>
                      <button 
                        @click="deleteNote(note.id, selectedProject?.id || 0)" 
                        class="text-rose-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded"
                        title="Supprimer la note"
                      >
                        <Trash2 class="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p class="text-sm text-slate-700 font-medium whitespace-pre-wrap" v-html="parseTextWithLinks(note.text)"></p>
                </div>
                
                <div v-if="!projectNotes[selectedProject?.id || 0]?.length" class="text-center py-6 text-slate-400 text-sm italic">
                  Aucune note pour le moment.
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>

    <!-- MODAL: NOUVEAU PROJET COMMERCIAL (AVEC PHOTOS DIRECTES) -->
    <div 
      v-if="showAddModal" 
      class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
      @click="showAddModal = false"
    >
      <div 
        class="bg-white rounded-2xl max-w-lg w-full overflow-hidden flex flex-col shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]" 
        @click.stop
      >
        
        <!-- Modal Header -->
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 class="text-lg font-bold text-slate-900">Nouveau Projet Commercial</h3>
            <p class="text-xs text-slate-500">Ajoutez une opportunité et joignez directement les photos</p>
          </div>
          <button @click="showAddModal = false" class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X class="h-5 w-5" />
          </button>
        </div>

        <!-- Modal Content -->
        <div class="p-6 space-y-4 overflow-y-auto flex-1">
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700">Nom du Projet *</label>
            <input 
              v-model="newProject.name"
              placeholder="Ex: Enseigne lumineuse & Vitrine"
              class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700">Client / Entreprise *</label>
            <input 
              v-model="newProject.client"
              placeholder="Ex: SAS Restaurant Le Palais"
              class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Contact</label>
              <input 
                v-model="newProject.contact_name"
                placeholder="Nom du contact"
                class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Téléphone</label>
              <input 
                v-model="newProject.contact_phone"
                placeholder="06 12 34 56 78"
                class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:border-indigo-500 outline-none transition-all font-medium"
              />
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700">Adresse / Ville</label>
            <input 
              v-model="newProject.address"
              placeholder="Ex: 15 rue de Paris, 75001 Paris"
              class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Type de Projet</label>
              <select 
                v-model="newProject.project_type"
                class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:border-indigo-500 outline-none transition-all font-medium"
              >
                <option value="Enseigne / Signalétique">Enseigne / Signalétique</option>
                <option value="Site Web / Vitrine">Site Web / Vitrine</option>
                <option value="Logiciel de Caisse">Logiciel de Caisse</option>
                <option value="Marquage Véhicule">Marquage Véhicule</option>
                <option value="Print & Flyers">Print & Flyers</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Montant Estimé (€)</label>
              <input 
                v-model="newProject.estimated_amount"
                placeholder="Ex: 3500"
                class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:border-indigo-500 outline-none transition-all font-medium"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Statut</label>
              <select 
                v-model="newProject.status"
                class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:border-indigo-500 outline-none transition-all font-medium"
              >
                <option value="Devis à faire">Devis à faire</option>
                <option value="Rendez-vous pris">Rendez-vous pris</option>
                <option value="Devis envoyé">Devis envoyé</option>
                <option value="Négociation">Négociation</option>
                <option value="Gagné / Signé">Gagné / Signé</option>
                <option value="Perdu">Perdu</option>
              </select>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Date limite</label>
              <input 
                v-model="newProject.deadline"
                placeholder="Ex: 25 Octobre"
                class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:border-indigo-500 outline-none transition-all font-medium"
              />
            </div>
          </div>

          <!-- DIRECT PHOTO UPLOAD IN CREATION MODAL -->
          <div class="space-y-2 pt-2 border-t border-slate-100">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Camera class="h-4 w-4 text-indigo-600" />
                <span>Photos du projet (Direct)</span>
              </label>
              <span class="text-xs font-bold text-indigo-600">{{ newProject.photos.length }} photo(s)</span>
            </div>

            <div class="flex items-center gap-2">
              <label class="flex-1 py-2.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                <Camera class="h-4 w-4" />
                <span>Prendre photo</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  class="hidden" 
                  @change="handleAddPhotoUpload" 
                />
              </label>

              <label class="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                <Upload class="h-4 w-4" />
                <span>Galerie</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  class="hidden" 
                  @change="handleAddPhotoUpload" 
                />
              </label>
            </div>

            <p v-if="isUploadingAddPhotos" class="text-xs text-indigo-600 font-bold flex items-center gap-1.5 animate-pulse">
              <Loader2 class="h-3.5 w-3.5 animate-spin" />
              <span>{{ addPhotoUploadProgress }}</span>
            </p>

            <!-- Thumbnails grid -->
            <div v-if="newProject.photos.length > 0" class="grid grid-cols-4 gap-2 pt-1">
              <div 
                v-for="(photo, idx) in newProject.photos" 
                :key="photo"
                class="relative aspect-square rounded-xl overflow-hidden border border-slate-200"
              >
                <img :src="photo" class="w-full h-full object-cover" />
                <button 
                  type="button" 
                  @click="removeAddPhoto(idx)"
                  class="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center"
                >
                  <X class="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

        </div>

        <!-- Modal Footer -->
        <div class="p-6 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50">
          <Button variant="outline" size="sm" @click="showAddModal = false">Annuler</Button>
          <Button 
            size="sm" 
            @click="addProject" 
            :disabled="isSubmittingAdd || isUploadingAddPhotos"
            class="bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            <Loader2 v-if="isSubmittingAdd" class="h-3.5 w-3.5 animate-spin mr-1.5" />
            <span>Créer le Projet</span>
          </Button>
        </div>

      </div>
    </div>

    <!-- LIGHTBOX (FULL-SCREEN PHOTO ZOOM) -->
    <div 
      v-if="isLightboxOpen && activeLightboxPhotos.length > 0" 
      class="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
      @click.self="isLightboxOpen = false"
    >
      <div class="absolute top-4 inset-x-4 flex items-center justify-between text-white z-10">
        <span class="text-xs font-bold tracking-widest bg-white/10 px-3 py-1 rounded-xl">
          {{ activePhotoIndex + 1 }} / {{ activeLightboxPhotos.length }}
        </span>
        <button @click="isLightboxOpen = false" class="p-2 text-white hover:text-slate-300">
          <X class="h-6 w-6" />
        </button>
      </div>

      <img 
        :src="activeLightboxPhotos[activePhotoIndex]" 
        class="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" 
      />

      <button 
        v-if="activeLightboxPhotos.length > 1"
        @click="activePhotoIndex = (activePhotoIndex > 0 ? activePhotoIndex - 1 : activeLightboxPhotos.length - 1)" 
        class="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white text-3xl hover:bg-white/10 rounded-full"
      >
        ‹
      </button>

      <button 
        v-if="activeLightboxPhotos.length > 1"
        @click="activePhotoIndex = (activePhotoIndex < activeLightboxPhotos.length - 1 ? activePhotoIndex + 1 : 0)" 
        class="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white text-3xl hover:bg-white/10 rounded-full"
      >
        ›
      </button>
    </div>

  </div>
</template>
