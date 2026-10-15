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
  Clock,
  Globe,
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
  website: '',
  project_type: 'Enseigne / Signalétique',
  status: 'Devis à faire',
  priority: 'Moyenne',
  estimated_amount: '',
  deadline: '',
  description: '',
  meeting_date: '',
  meeting_note: '',
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

// Quick Meeting Modal State
const showMeetingModal = ref(false)
const targetProjectForMeeting = ref<CommercialProject | null>(null)
const meetingForm = ref({
  date: '',
  note: ''
})

const meetingShortcuts = [
  { label: "Aujourd'hui 14h", days: 0, hour: 14 },
  { label: "Aujourd'hui 16h", days: 0, hour: 16 },
  { label: 'Demain 10h', days: 1, hour: 10 },
  { label: 'Demain 14h', days: 1, hour: 14 },
  { label: 'Dans 2 jours', days: 2, hour: 10 },
  { label: 'Dans 3 jours', days: 3, hour: 14 },
  { label: 'Lundi prochain', days: 5, hour: 10 }
]

const openMeetingModal = (project: CommercialProject) => {
  targetProjectForMeeting.value = project
  meetingForm.value = {
    date: project.meeting_date || '',
    note: project.meeting_note || ''
  }
  showMeetingModal.value = true
}

const applyMeetingShortcut = (daysFromNow: number, hour: number) => {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  d.setHours(hour, 0, 0, 0)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  meetingForm.value.date = `${y}-${m}-${day}T${h}:00`
}

const applyNewProjectMeetingShortcut = (daysFromNow: number, hour: number) => {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  d.setHours(hour, 0, 0, 0)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  newProject.value.meeting_date = `${y}-${m}-${day}T${h}:00`
}

const saveMeeting = async () => {
  if (!targetProjectForMeeting.value) return
  const id = targetProjectForMeeting.value.id
  const meeting_date = meetingForm.value.date
  const meeting_note = meetingForm.value.note

  await commercialService.updateProject(id, { meeting_date, meeting_note })
  const p = projects.value.find(item => item.id === id)
  if (p) {
    p.meeting_date = meeting_date
    p.meeting_note = meeting_note
  }
  if (selectedProject.value && selectedProject.value.id === id) {
    selectedProject.value.meeting_date = meeting_date
    selectedProject.value.meeting_note = meeting_note
  }
  showMeetingModal.value = false
}

const clearMeeting = async () => {
  if (!targetProjectForMeeting.value) return
  const id = targetProjectForMeeting.value.id
  await commercialService.updateProject(id, { meeting_date: '', meeting_note: '' })
  const p = projects.value.find(item => item.id === id)
  if (p) {
    p.meeting_date = ''
    p.meeting_note = ''
  }
  if (selectedProject.value && selectedProject.value.id === id) {
    selectedProject.value.meeting_date = ''
    selectedProject.value.meeting_note = ''
  }
  showMeetingModal.value = false
}

// Format Meeting Date (Ex: Mer. 18 oct. à 14:30)
const formatMeetingDate = (dateStr?: string) => {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const str = d.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
    return str.charAt(0).toUpperCase() + str.slice(1)
  } catch (e) {
    return dateStr
  }
}

// Relative day badge (Aujourd'hui, Demain, Dans 3 j)
const getMeetingRelative = (dateStr?: string) => {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    const target = new Date(d)
    target.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return "Aujourd'hui"
    if (diffDays === 1) return 'Demain'
    if (diffDays === -1) return 'Hier'
    if (diffDays > 1 && diffDays <= 7) return `Dans ${diffDays} j`
    if (diffDays < -1) return 'Passé'
    return ''
  } catch (e) {
    return ''
  }
}

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

const formatUrl = (url?: string) => {
  if (!url) return ''
  const trimmed = url.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

const parseTextWithLinks = (text: string) => {
  if (!text) return ''
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(?:fr|com|org|net|io|co|be|ch|eu|dev|app|online|shop|pro)(?:\/[^\s]*)?)/gi
  return escaped.replace(urlRegex, (url) => {
    const href = formatUrl(url)
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 underline hover:text-indigo-800 break-all font-bold inline-flex items-center gap-0.5" onclick="event.stopPropagation()">${url} ↗</a>`
  })
}

// Status Colors
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
    } else if (activeFilter.value === 'Avec RDV') {
      list = list.filter(p => !!p.meeting_date)
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
      (p.website && p.website.toLowerCase().includes(q)) ||
      (p.project_type && p.project_type.toLowerCase().includes(q)) ||
      (p.meeting_note && p.meeting_note.toLowerCase().includes(q))
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
      website: '',
      project_type: 'Enseigne / Signalétique',
      status: 'Devis à faire',
      priority: 'Moyenne',
      estimated_amount: '',
      deadline: '',
      description: '',
      meeting_date: '',
      meeting_note: '',
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
    website: selectedProject.value.website || '',
    meeting_date: selectedProject.value.meeting_date || '',
    meeting_note: selectedProject.value.meeting_note || '',
    photos: [...(selectedProject.value.photos || [])]
  }
  isEditing.value = true
}

const updateWebsite = async (projectId: number, newWebsite: string) => {
  await commercialService.updateProject(projectId, { website: newWebsite })
  const p = projects.value.find(item => item.id === projectId)
  if (p) p.website = newWebsite
  if (selectedProject.value && selectedProject.value.id === projectId) {
    selectedProject.value.website = newWebsite
  }
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

// Export CSV
const exportCSV = () => {
  if (filteredProjects.value.length === 0) {
    alert("Aucun projet à exporter.")
    return
  }

  const headers = [
    "Nom du Projet", "Client / Entreprise", "Contact", "Téléphone", 
    "Email", "Adresse", "Type de Projet", "Statut", "Montant Estimé", 
    "Date Limite", "Priorité", "Prochain RDV", "Note RDV", "Photos (URLs)"
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
      escapeCSV(formatMeetingDate(p.meeting_date)),
      escapeCSV(p.meeting_note || ''),
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
          v-for="filter in ['Tous', 'Avec RDV', 'En cours', 'Devis à faire', 'Devis envoyé', 'Négociation', 'Gagnés / Signés', 'Perdus']" 
          :key="filter"
          @click="activeFilter = filter"
          class="px-4 py-2 text-[10px] font-bold rounded-lg transition-all whitespace-nowrap"
          :class="[
            activeFilter === filter 
              ? (filter === 'Perdus' ? 'bg-rose-100 text-rose-700 shadow-sm' : filter === 'Avec RDV' ? 'bg-amber-500 text-white shadow-sm font-bold' : 'bg-white text-slate-900 shadow-sm') 
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
          placeholder="Rechercher projet, client, RDV, ville..."
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
          <CardTitle class="text-base text-slate-900 font-bold tracking-tight truncate">{{ project.name }}</CardTitle>
          <CardDescription class="text-slate-400 text-xs truncate">
            Client: <span class="font-bold text-slate-700">{{ project.client }}</span>
            <span v-if="project.contact_phone" class="ml-1 text-indigo-600 font-semibold">• {{ project.contact_phone }}</span>
          </CardDescription>

          <!-- Clickable Website Link on Card -->
          <div v-if="project.website" class="pt-1.5 flex items-center">
            <a 
              :href="formatUrl(project.website)" 
              target="_blank" 
              rel="noopener noreferrer" 
              @click.stop 
              class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold border border-indigo-200 transition-colors group/link max-w-full shadow-2xs"
              title="Cliquer pour visiter le site web"
            >
              <Globe class="h-3 w-3 text-indigo-600 shrink-0" />
              <span class="truncate">{{ project.website.replace(/^https?:\/\//i, '').replace(/^www\./i, '') }}</span>
              <ExternalLink class="h-2.5 w-2.5 text-indigo-400 group-hover/link:text-indigo-600 shrink-0 ml-0.5" />
            </a>
          </div>
        </CardHeader>

        <CardContent class="p-4 pt-2 flex-1 flex flex-col justify-between gap-3" @click.stop>
          
          <!-- PROCHAIN RENDEZ-VOUS AFFICHE EN GROS (PROMINENT DISPLAY) -->
          <div 
            @click.stop="openMeetingModal(project)"
            class="rounded-xl p-3 transition-all cursor-pointer border group"
            :class="[
              project.meeting_date 
                ? 'bg-gradient-to-br from-amber-50 to-orange-50/70 border-amber-300 text-amber-950 shadow-2xs hover:border-amber-400 hover:shadow-md' 
                : 'bg-slate-50/80 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40'
            ]"
          >
            <div v-if="project.meeting_date" class="space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                  <Clock class="h-3.5 w-3.5 text-amber-600" /> PROCHAIN RENDEZ-VOUS
                </span>
                <span 
                  v-if="getMeetingRelative(project.meeting_date)" 
                  class="text-[10px] font-black px-2 py-0.5 rounded-full"
                  :class="[
                    getMeetingRelative(project.meeting_date) === 'Aujourd\'hui' ? 'bg-rose-500 text-white animate-pulse' :
                    getMeetingRelative(project.meeting_date) === 'Demain' ? 'bg-amber-500 text-white' :
                    getMeetingRelative(project.meeting_date) === 'Passé' ? 'bg-slate-200 text-slate-700' :
                    'bg-amber-200 text-amber-900'
                  ]"
                >
                  {{ getMeetingRelative(project.meeting_date) }}
                </span>
              </div>
              <div class="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug flex items-center justify-between">
                <span>{{ formatMeetingDate(project.meeting_date) }}</span>
                <Pencil class="h-3.5 w-3.5 text-amber-600 opacity-60 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
              </div>
              <div v-if="project.meeting_note" class="text-xs text-amber-900/90 font-medium truncate flex items-center gap-1 bg-white/70 px-2 py-0.5 rounded-md border border-amber-200/50">
                <span class="shrink-0">📍</span>
                <span class="truncate">{{ project.meeting_note }}</span>
              </div>
            </div>

            <div v-else class="flex items-center justify-between py-1 px-1 text-xs font-bold text-slate-400 group-hover:text-indigo-600">
              <span class="flex items-center gap-2">
                <Clock class="h-4 w-4 text-slate-400 group-hover:text-indigo-500" />
                <span class="font-extrabold">+ Noter date prochain RDV</span>
              </span>
              <span class="text-[10px] font-black bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs group-hover:border-indigo-300 group-hover:text-indigo-600">
                Planifier
              </span>
            </div>
          </div>

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

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-xs font-bold text-slate-700">Adresse / Localisation</label>
                <input v-model="editingProjectData.address" placeholder="Ex: 12 rue de la Paix, 75000 Paris" class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all font-medium" />
              </div>
              <div class="space-y-1">
                <label class="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Globe class="h-3.5 w-3.5 text-indigo-600" /> Site Web / Lien URL
                </label>
                <input v-model="editingProjectData.website" placeholder="Ex: www.mon-site.fr ou https://..." class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all font-medium" />
              </div>
            </div>

            <!-- Rendez-vous Fields in Edit Form -->
            <div class="bg-amber-50/70 p-4 rounded-xl border border-amber-200/80 space-y-3">
              <span class="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <Clock class="h-3.5 w-3.5 text-amber-700" /> Rendez-vous Commercial
              </span>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div class="space-y-1">
                  <label class="text-xs font-bold text-slate-700">Date et Heure du RDV</label>
                  <input 
                    type="datetime-local" 
                    v-model="editingProjectData.meeting_date" 
                    class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white font-bold text-slate-800" 
                  />
                </div>
                <div class="space-y-1">
                  <label class="text-xs font-bold text-slate-700">Précisions ou Lieu du RDV</label>
                  <input 
                    v-model="editingProjectData.meeting_note" 
                    placeholder="Ex: Sur place à la boutique, Démo devis..." 
                    class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white font-medium" 
                  />
                </div>
              </div>
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

          <!-- VIEW MODE -->
          <div v-else class="space-y-6">
            
            <!-- PROCHAIN RENDEZ-VOUS EN GROS (BANNER) -->
            <div class="bg-gradient-to-r from-amber-50 via-orange-50/70 to-amber-50 p-4 sm:p-5 rounded-2xl border border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
              <div class="flex items-center gap-3.5">
                <div class="w-13 h-13 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-200 shrink-0">
                  <Clock class="h-6 w-6" />
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] font-black uppercase tracking-widest text-amber-800 block">
                      PROCHAIN RENDEZ-VOUS
                    </span>
                    <span 
                      v-if="selectedProject.meeting_date && getMeetingRelative(selectedProject.meeting_date)"
                      class="text-[9px] font-black px-2 py-0.5 rounded-full"
                      :class="[
                        getMeetingRelative(selectedProject.meeting_date) === 'Aujourd\'hui' ? 'bg-rose-500 text-white animate-pulse' :
                        getMeetingRelative(selectedProject.meeting_date) === 'Demain' ? 'bg-amber-500 text-white' :
                        getMeetingRelative(selectedProject.meeting_date) === 'Passé' ? 'bg-slate-200 text-slate-700' :
                        'bg-amber-200 text-amber-900'
                      ]"
                    >
                      {{ getMeetingRelative(selectedProject.meeting_date) }}
                    </span>
                  </div>
                  <h3 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                    {{ selectedProject.meeting_date ? formatMeetingDate(selectedProject.meeting_date) : 'Aucun rendez-vous fixé' }}
                  </h3>
                  <p v-if="selectedProject.meeting_note" class="text-xs font-bold text-amber-900 mt-1 flex items-center gap-1.5">
                    <span>📍</span>
                    <span>{{ selectedProject.meeting_note }}</span>
                  </p>
                </div>
              </div>

              <Button 
                size="sm" 
                @click="openMeetingModal(selectedProject)" 
                class="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-xs rounded-xl self-start sm:self-center"
              >
                <Clock class="h-3.5 w-3.5 mr-1.5" />
                <span>{{ selectedProject.meeting_date ? 'Modifier le RDV' : '+ Fixer un RDV' }}</span>
              </Button>
            </div>

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
                  <div v-if="selectedProject.website" class="flex items-center gap-2 pt-0.5">
                    <Globe class="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    <a 
                      :href="formatUrl(selectedProject.website)" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      class="text-indigo-600 font-bold hover:underline flex items-center gap-1 text-xs break-all"
                    >
                      <span>{{ selectedProject.website }}</span>
                      <ExternalLink class="h-3 w-3 shrink-0" />
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

            <!-- Site Web / Lien Direct & Modifiable -->
            <div class="bg-white p-4 rounded-xl border border-slate-200 flex flex-col gap-2 relative shadow-xs">
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg" :class="selectedProject.website ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'">
                  <Globe class="h-4 w-4" />
                </div>
                <div class="flex-1">
                  <h4 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Site Web / Lien du Client</h4>
                  <p class="text-[10px] text-slate-400 font-medium">Lien direct vers le site web ou réseau social du prospect</p>
                </div>
                <a 
                  v-if="selectedProject.website" 
                  :href="formatUrl(selectedProject.website)" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors shadow-2xs"
                  title="Visiter le site web"
                >
                  <Globe class="h-3.5 w-3.5" />
                  <span>Ouvrir</span>
                  <ExternalLink class="h-3.5 w-3.5 ml-0.5" />
                </a>
              </div>
              <input 
                :value="selectedProject.website || ''"
                @change="(e) => {
                  const val = (e.target as HTMLInputElement).value;
                  if (selectedProject) {
                    selectedProject.website = val;
                    updateWebsite(selectedProject.id, val);
                  }
                }"
                type="text" 
                placeholder="Ex: www.mon-client.fr ou https://..." 
                class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium text-slate-700"
              />
            </div>

            <!-- Description -->
            <div v-if="selectedProject.description" class="bg-amber-50/60 p-4 rounded-xl border border-amber-200/60 space-y-1">
              <h4 class="text-xs font-bold text-amber-900 uppercase tracking-wider">Besoins du client & Notes</h4>
              <p class="text-xs text-amber-800 whitespace-pre-wrap leading-relaxed" v-html="parseTextWithLinks(selectedProject.description)"></p>
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

    <!-- MODAL: NOUVEAU PROJET COMMERCIAL (AVEC DATE RDV ET PHOTOS DIRECTES) -->
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
            <p class="text-xs text-slate-500">Ajoutez une opportunité, fixez un RDV et joignez les photos</p>
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

          <!-- Section Date de Rendez-vous -->
          <div class="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/80 space-y-2.5">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <Clock class="h-3.5 w-3.5 text-amber-700" /> Date du Prochain Rendez-vous
              </label>
              <div class="flex items-center gap-1">
                <button 
                  type="button" 
                  @click="applyNewProjectMeetingShortcut(0, 14)" 
                  class="text-[9px] font-bold bg-white px-2 py-0.5 rounded border border-amber-200 text-amber-800 hover:bg-amber-100"
                >
                  Aujourd'hui 14h
                </button>
                <button 
                  type="button" 
                  @click="applyNewProjectMeetingShortcut(1, 10)" 
                  class="text-[9px] font-bold bg-white px-2 py-0.5 rounded border border-amber-200 text-amber-800 hover:bg-amber-100"
                >
                  Demain 10h
                </button>
                <button 
                  type="button" 
                  @click="applyNewProjectMeetingShortcut(1, 14)" 
                  class="text-[9px] font-bold bg-white px-2 py-0.5 rounded border border-amber-200 text-amber-800 hover:bg-amber-100"
                >
                  Demain 14h
                </button>
                <button 
                  type="button" 
                  @click="applyNewProjectMeetingShortcut(2, 14)" 
                  class="text-[9px] font-bold bg-white px-2 py-0.5 rounded border border-amber-200 text-amber-800 hover:bg-amber-100"
                >
                  +2 jours
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input 
                type="datetime-local" 
                v-model="newProject.meeting_date" 
                class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white font-bold text-slate-800" 
              />
              <input 
                v-model="newProject.meeting_note" 
                placeholder="Lieu / note du RDV (ex: Sur place)" 
                class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white font-medium" 
              />
            </div>
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

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Adresse / Ville</label>
              <input 
                v-model="newProject.address"
                placeholder="Ex: 15 rue de Paris, 75001 Paris"
                class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Globe class="h-3.5 w-3.5 text-indigo-600" /> Site Web / Lien URL (Optionnel)
              </label>
              <input 
                v-model="newProject.website"
                placeholder="Ex: www.client.fr ou https://..."
                class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:border-indigo-500 outline-none transition-all font-medium"
              />
            </div>
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
            class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
          >
            <Loader2 v-if="isSubmittingAdd" class="h-3.5 w-3.5 animate-spin mr-1.5" />
            <span>Créer le Projet</span>
          </Button>
        </div>

      </div>
    </div>

    <!-- QUICK MEETING SETTER MODAL -->
    <div 
      v-if="showMeetingModal && targetProjectForMeeting" 
      class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
      @click="showMeetingModal = false"
    >
      <div 
        class="bg-white rounded-2xl max-w-md w-full overflow-hidden flex flex-col shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200" 
        @click.stop
      >
        <!-- Header -->
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Clock class="h-5 w-5 text-amber-600" /> Date du Prochain Rendez-vous
            </h3>
            <p class="text-xs text-slate-500">{{ targetProjectForMeeting.client }} — {{ targetProjectForMeeting.name }}</p>
          </div>
          <button @click="showMeetingModal = false" class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X class="h-5 w-5" />
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-4">
          <!-- Shortcuts -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-500">Raccourcis rapides</label>
            <div class="flex flex-wrap gap-1.5">
              <button 
                type="button"
                v-for="sc in meetingShortcuts" 
                :key="sc.label" 
                @click="applyMeetingShortcut(sc.days, sc.hour)" 
                class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-amber-50 hover:text-amber-800 transition-colors"
              >
                {{ sc.label }}
              </button>
            </div>
          </div>

          <!-- Date & Time Input -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700">Date et Heure du Rendez-vous</label>
            <input 
              v-model="meetingForm.date" 
              type="datetime-local" 
              class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none transition-all font-bold text-slate-800"
            />
          </div>

          <!-- Location / Note Input -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700">Lieu ou Précisions (Optionnel)</label>
            <input 
              v-model="meetingForm.note" 
              placeholder="Ex: À la boutique du client, Démo logiciel..." 
              class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none transition-all font-medium"
            />
          </div>
        </div>

        <!-- Footer -->
        <div class="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <button 
            v-if="targetProjectForMeeting.meeting_date" 
            @click="clearMeeting" 
            class="text-xs font-bold text-rose-500 hover:underline"
          >
            Supprimer le RDV
          </button>
          <div v-else></div>

          <div class="flex items-center gap-2">
            <Button variant="outline" size="sm" @click="showMeetingModal = false">Annuler</Button>
            <Button size="sm" @click="saveMeeting" class="bg-amber-600 hover:bg-amber-500 text-white font-bold">
              Enregistrer le RDV
            </Button>
          </div>
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
