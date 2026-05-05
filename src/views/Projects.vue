<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Calendar, Plus, FileText, X, Send, Trash2, Search, Pencil } from 'lucide-vue-next'

interface Project {
  id: number
  name: string
  client: string
  status: string
  progress: number
  deadline: string
  priority: string
  team: string[]
}

interface Note {
  id: number
  text: string
  date: string
}



const projects = ref<Project[]>([])
const projectNotes = ref<Record<number, Note[]>>({})
const activeFilter = ref('Tous')
const selectedProject = ref<Project | null>(null)
const newNoteText = ref('')
const searchQuery = ref('')

const newProject = ref({
  name: '',
  client: '',
  deadline: '',
  priority: 'Moyenne'
})

const showAddModal = ref(false)

const isEditing = ref(false)
const editingProjectData = ref<any>(null)

const fetchProjects = async () => {
  const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
  if (data && !error) {
    projects.value = data
  }
}

const fetchNotes = async () => {
  const { data, error } = await supabase.from('project_notes').select('*').order('created_at', { ascending: false })
  if (data && !error) {
    const mapped: Record<number, Note[]> = {}
    data.forEach(note => {
      if (!mapped[note.project_id]) mapped[note.project_id] = []
      mapped[note.project_id].push({ id: note.id, text: note.text, date: note.date })
    })
    projectNotes.value = mapped
  }
}

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
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 underline hover:text-indigo-800 break-all">${url}</a>`
  })
}

onMounted(() => {
  fetchProjects()
  fetchNotes()
})

// Filtered Projects
const filteredProjects = computed(() => {
  let base = projects.value
  
  if (activeFilter.value === 'En cours') base = base.filter(p => p.status === 'En cours')
  if (activeFilter.value === 'Terminés') base = base.filter(p => p.status === 'Terminé')
  if (activeFilter.value === 'Traité') base = base.filter(p => p.status === 'Traité')
  if (activeFilter.value === 'Nouveaux') base = base.filter(p => p.status === 'Planifié')
  
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    base = base.filter(p => 
      (p.name && p.name.toLowerCase().includes(query)) || 
      (p.client && p.client.toLowerCase().includes(query))
    )
  }
  
  return base
})

const updateStatus = async (projectId: number, newStatus: string) => {
  let progress = 0
  if (newStatus === 'Terminé' || newStatus === 'Traité') progress = 100
  if (newStatus === 'En cours') progress = 50
  
  const { error } = await supabase.from('projects').update({ status: newStatus, progress }).eq('id', projectId)
  if (!error) {
    const project = projects.value.find(p => p.id === projectId)
    if (project) {
      project.status = newStatus
      project.progress = progress
    }
  }
}

const addNote = async () => {
  if (!selectedProject.value || !newNoteText.value.trim()) return
  const projectId = selectedProject.value.id
  const now = new Date()
  const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')} ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`
  
  const { data, error } = await supabase.from('project_notes').insert({
    project_id: projectId,
    text: newNoteText.value.trim(),
    date: formattedDate
  }).select().single()
  
  if (data && !error) {
    if (!projectNotes.value[projectId]) projectNotes.value[projectId] = []
    projectNotes.value[projectId].unshift({ id: data.id, text: data.text, date: data.date })
    newNoteText.value = ''
  }
}

const deleteNote = async (noteId: number, projectId: number) => {
  if (confirm('Supprimer cette note ?')) {
    const { error } = await supabase.from('project_notes').delete().eq('id', noteId)
    if (!error) {
      projectNotes.value[projectId] = projectNotes.value[projectId].filter(n => n.id !== noteId)
    }
  }
}

const deleteProject = async (id: number) => {
  if (confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
    // Supprimer les notes enfants pour respecter la clé étrangère SQL
    await supabase.from('project_notes').delete().eq('project_id', id)

    // Puis supprimer le projet
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (!error) {
      projects.value = projects.value.filter(p => p.id !== id)
      selectedProject.value = null
    }
  }
}

const addProject = async () => {
  if (!newProject.value.name.trim() || !newProject.value.client.trim()) return
  
  const { data, error } = await supabase.from('projects').insert({
    name: newProject.value.name.trim(),
    client: newProject.value.client.trim(),
    status: 'Planifié',
    progress: 0,
    deadline: newProject.value.deadline || 'Non définie',
    priority: newProject.value.priority
  }).select().single()
  
  if (data && !error) {
    projects.value.unshift(data)
    newProject.value = { name: '', client: '', deadline: '', priority: 'Moyenne' }
    showAddModal.value = false
  }
}

const startEditing = () => {
  if (!selectedProject.value) return
  editingProjectData.value = { ...selectedProject.value }
  isEditing.value = true
}

const cancelEditing = () => {
  isEditing.value = false
  editingProjectData.value = null
}

const saveProjectUpdate = async () => {
  if (!editingProjectData.value) return
  
  const { error } = await supabase.from('projects').update({
    name: editingProjectData.value.name,
    client: editingProjectData.value.client,
    deadline: editingProjectData.value.deadline,
    priority: editingProjectData.value.priority,
    progress: editingProjectData.value.progress,
    status: editingProjectData.value.status
  }).eq('id', editingProjectData.value.id)
  
  if (!error) {
    const index = projects.value.findIndex(p => p.id === editingProjectData.value.id)
    if (index !== -1) {
      projects.value[index] = { ...editingProjectData.value }
      selectedProject.value = { ...editingProjectData.value }
    }
    isEditing.value = false
    editingProjectData.value = null
  }
}


const getStatusColor = (status: string) => {
  if (status === 'Traité') return 'bg-blue-50 text-blue-700 border-blue-200'
  if (status === 'Terminé') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (status === 'En cours') return 'bg-indigo-50 text-indigo-700 border-indigo-200'
  return 'bg-amber-50 text-amber-700 border-amber-200'
}
</script>

<template>
  <div class="flex-1 space-y-6 p-6 bg-slate-50/30 min-h-screen relative">
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900">Suivi des Projets</h2>
        <p class="text-muted-foreground text-xs">Gérez et mettez à jour vos projets en temps réel.</p>
      </div>
      <Button size="sm" @click="showAddModal = true" class="bg-indigo-600 hover:bg-indigo-500 shadow-sm">
        <Plus class="mr-1.5 h-3.5 w-3.5" /> Nouveau
      </Button>
    </div>

    <!-- Search and Filters -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex overflow-x-auto no-scrollbar gap-1 p-1 bg-slate-100 rounded-xl w-full md:w-fit shrink-0">
        <button 
          v-for="filter in ['Tous', 'En cours', 'Terminés', 'Traité', 'Nouveaux']" 
          :key="filter"
          @click="activeFilter = filter"
          class="px-4 py-2 text-[10px] font-bold rounded-lg transition-all whitespace-nowrap"
          :class="[activeFilter === filter ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700']"
        >
          {{ filter }}
        </button>
      </div>

      <div class="relative w-full md:max-w-xs flex-1">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input 
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher un projet, client..."
          class="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium placeholder:text-slate-400 shadow-xs"
        />
      </div>
    </div>

    <!-- Compact Project Grid -->
    <div class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <Card v-for="project in filteredProjects" :key="project.id" 
        class="flex flex-col bg-white border-slate-100/80 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl overflow-hidden cursor-pointer"
        @click="selectedProject = project"
      >
        <CardHeader class="p-4 pb-2 space-y-1">
          <div class="flex items-center justify-between">
            <Badge variant="outline" :class="[getStatusColor(project.status), 'text-[10px] px-2 py-0.5 font-bold border']">
              {{ project.status === 'Planifié' ? 'Nouveau' : project.status }}
            </Badge>
            <span class="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
              <Calendar class="h-3 w-3 text-slate-400" /> {{ project.deadline }}
            </span>
          </div>
          <CardTitle class="text-base text-slate-900 font-bold tracking-tight truncate">{{ project.name }}</CardTitle>
          <CardDescription class="text-slate-400 text-xs truncate">Client: <span v-html="parseTextWithLinks(project.client)"></span></CardDescription>
        </CardHeader>
        
        <CardContent class="p-4 pt-2 flex-1 flex flex-col justify-between gap-4" @click.stop>
          <!-- Progress -->
          <div class="space-y-1">
            <div class="flex justify-between text-[10px]">
              <span class="text-slate-400 font-medium">Progression</span>
              <span class="font-bold text-indigo-600">{{ project.progress }}%</span>
            </div>
            <Progress :model-value="project.progress" class="h-1 bg-slate-100" />
          </div>

          <!-- Notes Preview -->
          <div class="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 font-medium truncate flex items-center gap-1">
            <FileText class="h-3 w-3 text-slate-400 shrink-0" />
            <span v-if="projectNotes[project.id]?.length">
              {{ projectNotes[project.id][0].text }}
            </span>
            <span v-else class="text-slate-300 italic">Aucune note</span>
          </div>

          <!-- Actions / Status Change -->
          <div class="pt-2 border-t border-slate-50 flex flex-col gap-2">
            <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Changer le statut</span>
            <div class="flex gap-1">
              <button 
                @click="updateStatus(project.id, 'Planifié')"
                class="flex-1 py-1 text-[9px] font-bold rounded border transition-all"
                :class="[project.status === 'Planifié' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50']"
              >
                Nouveau
              </button>
              <button 
                @click="updateStatus(project.id, 'En cours')"
                class="flex-1 py-1 text-[9px] font-bold rounded border transition-all"
                :class="[project.status === 'En cours' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50']"
              >
                En cours
              </button>
              <button 
                @click="updateStatus(project.id, 'Terminé')"
                class="flex-1 py-1 text-[9px] font-bold rounded border transition-all"
                :class="[project.status === 'Terminé' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50']"
              >
                Fini
              </button>
              <button 
                @click="updateStatus(project.id, 'Traité')"
                class="flex-1 py-1 text-[9px] font-bold rounded border transition-all"
                :class="[project.status === 'Traité' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50']"
              >
                Traité
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Modal: Project Details & Multiple Notes -->
    <div v-if="selectedProject" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click="selectedProject = null">
      <div class="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200" @click.stop>
        
        <!-- Modal Header -->
        <div class="p-6 border-b border-slate-100 flex items-start justify-between">
          <div class="space-y-1">
            <Badge variant="outline" :class="[getStatusColor(selectedProject.status), 'text-xs px-2 py-0.5 font-bold border']">
              {{ selectedProject.status === 'Planifié' ? 'Nouveau' : selectedProject.status }}
            </Badge>
            <h3 class="text-xl font-bold text-slate-900 tracking-tight">{{ selectedProject.name }}</h3>
            <p class="text-slate-500 text-sm font-medium">Client: <span v-html="parseTextWithLinks(selectedProject.client)"></span></p>
          </div>
          <div class="flex items-center gap-1">
            <button v-if="!isEditing" @click="startEditing" class="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-50 transition-colors" title="Modifier le projet">
              <Pencil class="h-4 w-4" />
            </button>
            <button @click="deleteProject(selectedProject.id)" class="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors" title="Supprimer le projet">
              <Trash2 class="h-5 w-5" />
            </button>
            <button @click="selectedProject = null; isEditing = false" class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
              <X class="h-5 w-5" />
            </button>
          </div>
        </div>

        <!-- Modal Content -->
        <div class="p-6 overflow-y-auto flex-1 space-y-6">
          
          <!-- Edit Form -->
          <div v-if="isEditing" class="space-y-4">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Nom du Projet</label>
              <input v-model="editingProjectData.name" class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all" />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Client</label>
              <input v-model="editingProjectData.client" class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-xs font-bold text-slate-700">Date limite</label>
                <input v-model="editingProjectData.deadline" class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all" />
              </div>
              <div class="space-y-1">
                <label class="text-xs font-bold text-slate-700">Priorité</label>
                <select v-model="editingProjectData.priority" class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all">
                  <option value="Basse">Basse</option>
                  <option value="Moyenne">Moyenne</option>
                  <option value="Haute">Haute</option>
                  <option value="Critique">Critique</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-xs font-bold text-slate-700">Statut</label>
                <select v-model="editingProjectData.status" class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all">
                  <option value="Planifié">Nouveau</option>
                  <option value="En cours">En cours</option>
                  <option value="Terminé">Terminé</option>
                  <option value="Traité">Traité</option>
                </select>
              </div>
              <div class="space-y-1">
                <label class="text-xs font-bold text-slate-700">Progression (%)</label>
                <input type="number" v-model="editingProjectData.progress" class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all" />
              </div>
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" @click="cancelEditing">Annuler</Button>
              <Button size="sm" @click="saveProjectUpdate" class="bg-indigo-600 hover:bg-indigo-500 text-white">Enregistrer</Button>
            </div>
          </div>

          <!-- Info Grid (View Mode) -->
          <div v-else class="space-y-6">
            <div class="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div class="space-y-1">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date limite</span>
              <div class="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <Calendar class="h-4 w-4 text-slate-500" /> {{ selectedProject.deadline }}
              </div>
            </div>
            <div class="space-y-1">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Priorité</span>
              <div>
                <Badge :variant="selectedProject.priority === 'Critique' ? 'destructive' : 'secondary'" class="text-xs font-bold">
                  {{ selectedProject.priority }}
                </Badge>
              </div>
            </div>
          </div>

          <!-- Progression -->
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-slate-600 font-bold">Progression du projet</span>
              <span class="font-black text-indigo-600">{{ selectedProject.progress }}%</span>
            </div>
            <Progress :model-value="selectedProject.progress" class="h-2 bg-slate-100" />
          </div>

          <!-- Notes Section -->
          <div class="space-y-3">
            <h4 class="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <FileText class="h-4 w-4 text-slate-500" /> Notes & Suivi ({{ projectNotes[selectedProject.id]?.length || 0 }})
            </h4>

            <!-- Add Note Input -->
            <div class="flex gap-2">
              <input 
                v-model="newNoteText"
                placeholder="Ajouter une mise à jour, une note..."
                @keyup.enter="addNote"
                class="flex-1 px-4 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium placeholder:text-slate-400"
              />
              <Button @click="addNote" size="icon" class="bg-indigo-600 hover:bg-indigo-500 shrink-0 rounded-xl">
                <Send class="h-4 w-4 text-white" />
              </Button>
            </div>

            <!-- Notes List -->
            <div class="space-y-2 max-h-[250px] overflow-y-auto pr-1">
              <div v-for="(note, index) in projectNotes[selectedProject.id]" :key="note.id || index" 
                class="bg-slate-50/80 p-3 rounded-xl border border-slate-100/60 space-y-1 relative group"
              >
                <div class="flex justify-between items-center text-[10px]">
                  <span class="font-bold text-slate-400">Note #{{ projectNotes[selectedProject.id].length - index }}</span>
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-slate-400 bg-slate-200/50 px-1.5 py-0.5 rounded">{{ note.date }}</span>
                    <button 
                      @click="deleteNote(note.id, selectedProject.id)" 
                      class="text-rose-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded"
                      title="Supprimer la note"
                    >
                      <Trash2 class="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p class="text-sm text-slate-700 font-medium whitespace-pre-wrap" v-html="parseTextWithLinks(note.text)"></p>
              </div>
              
              <div v-if="!projectNotes[selectedProject.id]?.length" class="text-center py-6 text-slate-400 text-sm italic">
                Aucune note pour le moment.
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  </div>

    <!-- Modal: Nouveau Projet -->
    <div v-if="showAddModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click="showAddModal = false">
      <div class="bg-white rounded-2xl max-w-md w-full overflow-hidden flex flex-col shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200" @click.stop>
        
        <!-- Modal Header -->
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 class="text-lg font-bold text-slate-900">Créer un Nouveau Projet</h3>
          <button @click="showAddModal = false" class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X class="h-5 w-5" />
          </button>
        </div>

        <!-- Modal Content -->
        <div class="p-6 space-y-4">
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700">Nom du Projet</label>
            <input 
              v-model="newProject.name"
              placeholder="Ex: Refonte Site MWCREA"
              class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700">Client</label>
            <input 
              v-model="newProject.client"
              placeholder="Ex: Interne ou Nom du client"
              class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Date limite</label>
              <input 
                v-model="newProject.deadline"
                placeholder="Ex: 15 Octobre"
                class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium"
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Priorité</label>
              <select 
                v-model="newProject.priority"
                class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium"
              >
                <option value="Basse">Basse</option>
                <option value="Moyenne">Moyenne</option>
                <option value="Haute">Haute</option>
                <option value="Critique">Critique</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <Button variant="ghost" size="sm" @click="showAddModal = false">Annuler</Button>
          <Button size="sm" @click="addProject" class="bg-indigo-600 hover:bg-indigo-500 text-white">Créer le Projet</Button>
        </div>

      </div>
    </div>

  </div>
</template>
