<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Calendar, Plus, FileText, CheckCircle2, Clock, ClipboardList, X, Send, Trash2 } from 'lucide-vue-next'

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
  text: string
  date: string
}

// Initial data
const initialProjects: Project[] = [
  { 
    id: 1, 
    name: 'Développement Logiciel Microdidact', 
    client: 'Interne (MWCREA)', 
    status: 'En cours', 
    progress: 75, 
    deadline: '30 Juin', 
    priority: 'Haute',
    team: ['AM', 'EL']
  },
  { 
    id: 2, 
    name: 'Création Site Web StayZen', 
    client: 'StayZen Conciergerie', 
    status: 'En cours', 
    progress: 90, 
    deadline: '15 Mai', 
    priority: 'Critique',
    team: ['EL', 'JD']
  },
  { 
    id: 4, 
    name: 'Application Mobile Client X', 
    client: 'Client Privé', 
    status: 'Planifié', 
    progress: 15, 
    deadline: '15 Septembre', 
    priority: 'Moyenne',
    team: ['MC']
  },
]

const projects = ref<Project[]>(initialProjects)
const projectNotes = ref<Record<number, Note[]>>({})
const activeFilter = ref('Tous')
const selectedProject = ref<Project | null>(null)
const newNoteText = ref('')

// Add Project State
const showAddModal = ref(false)
const newProject = ref({
  name: '',
  client: '',
  deadline: '',
  priority: 'Moyenne'
})

// Load data from localStorage
onMounted(() => {
  const savedProjects = localStorage.getItem('md_projects')
  if (savedProjects) {
    projects.value = JSON.parse(savedProjects)
  }
  
  const savedNotes = localStorage.getItem('md_project_multi_notes')
  if (savedNotes) {
    projectNotes.value = JSON.parse(savedNotes)
  } else {
    // Migration from old single note structure if exists
    const oldNotes = localStorage.getItem('md_project_notes')
    if (oldNotes) {
      const parsedOld = JSON.parse(oldNotes)
      const migrated: Record<number, Note[]> = {}
      for (const [id, text] of Object.entries(parsedOld)) {
        if (text) {
          migrated[Number(id)] = [{ text: String(text), date: 'Initial' }]
        }
      }
      projectNotes.value = migrated
      localStorage.setItem('md_project_multi_notes', JSON.stringify(migrated))
    }
  }
})

// Save data to localStorage
watch(projects, (newProjects) => {
  localStorage.setItem('md_projects', JSON.stringify(newProjects))
}, { deep: true })

watch(projectNotes, (newNotes) => {
  localStorage.setItem('md_project_multi_notes', JSON.stringify(newNotes))
}, { deep: true })

// Filtered Projects
const filteredProjects = computed(() => {
  if (activeFilter.value === 'Tous') return projects.value
  if (activeFilter.value === 'En cours') return projects.value.filter(p => p.status === 'En cours')
  if (activeFilter.value === 'Terminés') return projects.value.filter(p => p.status === 'Terminé')
  if (activeFilter.value === 'Nouveaux') return projects.value.filter(p => p.status === 'Planifié')
  return projects.value
})

const updateStatus = (projectId: number, newStatus: string) => {
  const project = projects.value.find(p => p.id === projectId)
  if (project) {
    project.status = newStatus
    if (newStatus === 'Terminé') project.progress = 100
    if (newStatus === 'Planifié' && project.progress === 100) project.progress = 0
  }
}

const addNote = () => {
  if (!selectedProject.value || !newNoteText.value.trim()) return
  
  const projectId = selectedProject.value.id
  if (!projectNotes.value[projectId]) {
    projectNotes.value[projectId] = []
  }
  
  const now = new Date()
  const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')} ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`
  
  projectNotes.value[projectId].unshift({
    text: newNoteText.value.trim(),
    date: formattedDate
  })
  
  newNoteText.value = ''
}

const deleteProject = (id: number) => {
  if (confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
    projects.value = projects.value.filter(p => p.id !== id)
    selectedProject.value = null
  }
}

const addProject = () => {
  if (!newProject.value.name.trim() || !newProject.value.client.trim()) return
  
  const newId = projects.value.length > 0 ? Math.max(...projects.value.map(p => p.id)) + 1 : 1
  
  projects.value.push({
    id: newId,
    name: newProject.value.name.trim(),
    client: newProject.value.client.trim(),
    status: 'Planifié',
    progress: 0,
    deadline: newProject.value.deadline || 'Non définie',
    priority: newProject.value.priority,
    team: ['AM']
  })
  
  // Reset form
  newProject.value = {
    name: '',
    client: '',
    deadline: '',
    priority: 'Moyenne'
  }
  
  showAddModal.value = false
}

const getStatusColor = (status: string) => {
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

    <!-- Filters -->
    <div class="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-xl w-fit">
      <button 
        v-for="filter in ['Tous', 'En cours', 'Terminés', 'Nouveaux']" 
        :key="filter"
        @click="activeFilter = filter"
        class="px-4 py-1.5 text-xs font-bold rounded-lg transition-all"
        :class="[
          activeFilter === filter 
            ? 'bg-white text-slate-900 shadow-sm' 
            : 'text-slate-500 hover:text-slate-900'
        ]"
      >
        {{ filter }}
      </button>
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
          <CardDescription class="text-slate-400 text-xs truncate">Client: {{ project.client }}</CardDescription>
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
            <p class="text-slate-500 text-sm font-medium">Client: {{ selectedProject.client }}</p>
          </div>
          <div class="flex items-center gap-1">
            <button @click="deleteProject(selectedProject.id)" class="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors" title="Supprimer le projet">
              <Trash2 class="h-5 w-5" />
            </button>
            <button @click="selectedProject = null" class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
              <X class="h-5 w-5" />
            </button>
          </div>
        </div>

        <!-- Modal Content -->
        <div class="p-6 overflow-y-auto flex-1 space-y-6">
          
          <!-- Info Grid -->
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
              <div v-for="(note, index) in projectNotes[selectedProject.id]" :key="index" 
                class="bg-slate-50/80 p-3 rounded-xl border border-slate-100/60 space-y-1"
              >
                <div class="flex justify-between items-center text-[10px]">
                  <span class="font-bold text-slate-400">Note #{{ projectNotes[selectedProject.id].length - index }}</span>
                  <span class="font-medium text-slate-400 bg-slate-200/50 px-1.5 py-0.5 rounded">{{ note.date }}</span>
                </div>
                <p class="text-sm text-slate-700 font-medium whitespace-pre-wrap">{{ note.text }}</p>
              </div>
              
              <div v-if="!projectNotes[selectedProject.id]?.length" class="text-center py-6 text-slate-400 text-sm italic">
                Aucune note pour le moment.
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
