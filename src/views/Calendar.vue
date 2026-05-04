<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  User,
  X,
  Link as LinkIcon,
  LayoutGrid,
  Flag,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-vue-next'

interface CalendarTask {
  id: number
  intern_name: string
  task_description: string
  task_date: string
  project_link?: string
  status: string
  priority: string
  is_completed: boolean
}

const calendarTasks = ref<CalendarTask[]>([])
const boardMissions = ref<CalendarTask[]>([])
const isLoading = ref(true)
const currentWeekStart = ref(new Date())
const activeView = ref<'calendar' | 'board'>('calendar')

const statuses = ['A faire', 'En cours', 'Bloqué', 'Terminé']

const statusColors: Record<string, string> = {
  'A faire': 'bg-slate-100 text-slate-500 border-slate-200',
  'En cours': 'bg-blue-50 text-blue-600 border-blue-100',
  'Bloqué': 'bg-rose-50 text-rose-600 border-rose-100',
  'Terminé': 'bg-emerald-50 text-emerald-600 border-emerald-100'
}

const priorityColors: Record<string, string> = {
  'Basse': 'text-slate-400',
  'Normale': 'text-blue-500',
  'Haute': 'text-orange-500',
  'Urgente': 'text-rose-600'
}

// Helpers
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

const setWeekToMonday = (date: Date) => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

const nextWeek = () => {
  const d = new Date(currentWeekStart.value)
  d.setDate(d.getDate() + 7)
  currentWeekStart.value = d
}

const prevWeek = () => {
  const d = new Date(currentWeekStart.value)
  d.setDate(d.getDate() - 7)
  currentWeekStart.value = d
}

// Fetching Logic
const fetchData = async () => {
  isLoading.value = true
  const { data: cData } = await supabase.from('calendar_tasks').select('*').order('created_at', { ascending: true })
  if (cData) calendarTasks.value = cData
  const { data: mData } = await supabase.from('missions').select('*').order('created_at', { ascending: true })
  if (mData) boardMissions.value = mData
  isLoading.value = false
}

onMounted(() => {
  currentWeekStart.value = setWeekToMonday(new Date())
  fetchData()
})

const weekDays = computed(() => {
  const days = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(currentWeekStart.value)
    day.setDate(day.getDate() + i)
    days.push(day)
  }
  return days
})

const getTasksForDay = (date: Date) => {
  const dateStr = date.toISOString().split('T')[0]
  return calendarTasks.value.filter(t => t.task_date === dateStr)
}

// Drag and Drop (Missions ONLY)
const draggedTask = ref<CalendarTask | null>(null)
const onDragStart = (task: CalendarTask) => { draggedTask.value = task }

const onDrop = async (newStatus: string) => {
  if (!draggedTask.value || draggedTask.value.status === newStatus) return
  const taskToUpdate = draggedTask.value
  const oldStatus = taskToUpdate.status
  taskToUpdate.status = newStatus
  taskToUpdate.is_completed = newStatus === 'Terminé'
  const { error } = await supabase.from('missions').update({ status: newStatus, is_completed: newStatus === 'Terminé' }).eq('id', taskToUpdate.id)
  if (error) {
    taskToUpdate.status = oldStatus
    taskToUpdate.is_completed = oldStatus === 'Terminé'
  }
  draggedTask.value = null
}

const onDragOver = (event: DragEvent) => { event.preventDefault() }

// Modals State
const showAddModal = ref(false)
const selectedDate = ref('')
const newTask = ref({
  intern_name: '',
  task_description: '',
  project_link: '',
  status: 'A faire',
  priority: 'Normale'
})

const openAddModal = (date: Date, initialStatus?: string) => {
  selectedDate.value = date.toISOString().split('T')[0]
  newTask.value.status = initialStatus || 'A faire'
  showAddModal.value = true
}

const addTask = async () => {
  if (!newTask.value.intern_name || !newTask.value.task_description) return
  const table = activeView.value === 'calendar' ? 'calendar_tasks' : 'missions'
  const { data, error } = await supabase.from(table).insert({
    intern_name: newTask.value.intern_name,
    task_description: newTask.value.task_description,
    project_link: newTask.value.project_link,
    status: newTask.value.status,
    priority: newTask.value.priority,
    task_date: selectedDate.value,
    is_completed: newTask.value.status === 'Terminé'
  }).select().single()

  if (data && !error) {
    if (table === 'calendar_tasks') calendarTasks.value.push(data)
    else boardMissions.value.push(data)
    newTask.value = { intern_name: '', task_description: '', project_link: '', status: 'A faire', priority: 'Normale' }
    showAddModal.value = false
  }
}

const updateTaskStatus = async (task: CalendarTask, newStatus: string) => {
  const table = activeView.value === 'calendar' ? 'calendar_tasks' : 'missions'
  const isCompleted = newStatus === 'Terminé'
  const { error } = await supabase.from(table).update({ status: newStatus, is_completed: isCompleted }).eq('id', task.id)
  if (!error) {
    task.status = newStatus
    task.is_completed = isCompleted
  }
}

const deleteTask = async (id: number) => {
  if (!confirm('Supprimer cet élément ?')) return
  const table = activeView.value === 'calendar' ? 'calendar_tasks' : 'missions'
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (!error) {
    if (table === 'calendar_tasks') calendarTasks.value = calendarTasks.value.filter(t => t.id !== id)
    else boardMissions.value = boardMissions.value.filter(t => t.id !== id)
  }
}

const selectedTaskForView = ref<CalendarTask | null>(null)
</script>

<template>
  <div class="flex-1 space-y-6 p-6 bg-slate-50/30 min-h-screen relative">
    <!-- Header with View Switcher -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
      <div>
        <h2 class="text-2xl font-black tracking-tight text-slate-900 uppercase">Organisation & Missions</h2>
        <p class="text-muted-foreground text-[10px] font-black uppercase tracking-widest opacity-60">Gérez vos tâches comme sur ClickUp.</p>
      </div>
      
      <div class="flex items-center gap-4">
        <!-- Date Navigation (Left) -->
        <div v-if="activeView === 'calendar'" class="flex items-center gap-2 bg-white border border-slate-200 p-1 rounded-xl shadow-sm animate-in fade-in slide-in-from-left-4">
          <Button variant="ghost" size="icon" @click="prevWeek" class="h-8 w-8 rounded-lg text-slate-500">
            <ChevronLeft class="h-4 w-4" />
          </Button>
          <span class="text-[10px] font-black px-4 min-w-[150px] text-center text-slate-700 uppercase tracking-widest">
            {{ currentWeekStart.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) }}
          </span>
          <Button variant="ghost" size="icon" @click="nextWeek" class="h-8 w-8 rounded-lg text-slate-500">
            <ChevronRight class="h-4 w-4" />
          </Button>
        </div>

        <!-- View Switcher (Right) -->
        <div class="flex bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm">
          <button 
            @click="activeView = 'calendar'"
            class="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            :class="activeView === 'calendar' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'"
          >
            <LayoutGrid class="h-3.5 w-3.5" />
            <span>Calendrier</span>
          </button>
          <button 
            @click="activeView = 'board'"
            class="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            :class="activeView === 'board' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'"
          >
            <LayoutGrid class="h-3.5 w-3.5 rotate-90" />
            <span>Tableau</span>
          </button>
        </div>
      </div>
    </div>

    <!-- CALENDAR VIEW -->
    <div v-if="activeView === 'calendar'" class="grid grid-cols-1 md:grid-cols-7 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div v-for="day in weekDays" :key="day.getTime()" class="flex flex-col gap-3">
        <div class="flex flex-col p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">{{ day.toLocaleDateString('fr-FR', { weekday: 'long' }) }}</span>
          <span class="text-xl font-black text-slate-900">{{ day.getDate() }}</span>
        </div>

        <div class="flex-1 space-y-2 min-h-[200px]">
          <div v-for="task in getTasksForDay(day)" :key="task.id" 
            class="group p-4 bg-white border border-slate-100 rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden cursor-pointer"
            :class="[task.is_completed ? 'opacity-60 bg-slate-50/50' : '']"
            @click="selectedTaskForView = task"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="space-y-2 w-full">
                <div class="flex items-center justify-between">
                   <div class="flex items-center gap-1.5">
                    <div class="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center">
                      <User class="h-3 w-3 text-indigo-500" />
                    </div>
                    <span class="text-[9px] font-black text-indigo-600 uppercase tracking-tight">{{ task.intern_name }}</span>
                  </div>
                  <Flag class="h-3 w-3" :class="priorityColors[task.priority] || 'text-slate-400'" />
                </div>
                
                <p class="text-xs font-bold text-slate-700 leading-relaxed line-clamp-3" :class="[task.is_completed ? 'line-through text-slate-400' : '']">
                  {{ task.task_description }}
                </p>

                <div class="flex flex-wrap items-center gap-2 pt-1">
                  <span class="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border" :class="statusColors[task.status] || 'bg-slate-100 text-slate-500 border-slate-200'">
                    {{ task.status || 'A faire' }}
                  </span>
                  <div v-if="task.project_link" class="flex items-center gap-1">
                     <LinkIcon class="h-2.5 w-2.5 text-slate-300" />
                  </div>
                </div>
              </div>
            </div>
            
            <button 
              @click.stop="deleteTask(task.id)" 
              class="absolute top-2 right-2 p-1.5 bg-rose-50 text-rose-500 rounded-xl border border-rose-100 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-100"
            >
              <Trash2 class="h-3.5 w-3.5" />
            </button>

            <!-- Progress line -->
            <div v-if="task.is_completed" class="absolute bottom-0 left-0 h-1 bg-emerald-500 w-full"></div>
            <div v-else-if="task.status === 'En cours'" class="absolute bottom-0 left-0 h-1 bg-blue-500 w-full animate-pulse"></div>
          </div>

          <Button 
            variant="ghost" 
            class="w-full border-2 border-dashed border-slate-200 text-slate-400 hover:border-indigo-200 hover:text-indigo-500 hover:bg-indigo-50/30 h-12 rounded-2xl transition-all group"
            @click="openAddModal(day)"
          >
            <Plus class="h-4 w-4 mr-1.5 group-hover:rotate-90 transition-transform" />
            <span class="text-[10px] font-black uppercase tracking-widest">Ajouter</span>
          </Button>
        </div>
      </div>
    </div>

    <!-- BOARD VIEW (KANBAN) -->
    <div v-else-if="activeView === 'board'" class="flex gap-6 overflow-x-auto pb-6 animate-in fade-in slide-in-from-right-4 duration-500 min-h-[70vh]">
      <div v-for="status in statuses" :key="status" 
        class="flex-shrink-0 w-80 flex flex-col gap-4 p-4 rounded-3xl bg-slate-100/50 border border-slate-100/50"
        @dragover="onDragOver"
        @drop="onDrop(status)"
      >
        <div class="flex items-center justify-between px-2">
           <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full shadow-sm" :class="(statusColors[status] || '').split(' ')[0]"></div>
              <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-600">{{ status }}</h3>
              <span class="px-2 py-0.5 rounded-full bg-white text-[9px] font-black text-slate-400 shadow-xs">
                {{ boardMissions.filter(t => t.status === status).length }}
              </span>
           </div>
           <button @click="openAddModal(new Date(), status)" class="text-slate-300 hover:text-slate-500 transition-colors">
              <Plus class="h-4 w-4" />
           </button>
        </div>

        <div class="flex-1 space-y-3">
          <div v-for="task in boardMissions.filter(t => t.status === status)" :key="task.id"
            draggable="true"
            @dragstart="onDragStart(task)"
            class="group p-5 bg-white border border-slate-100 rounded-2xl shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-grab active:cursor-grabbing relative overflow-hidden"
            @click="selectedTaskForView = task"
          >
            <div class="space-y-3">
               <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                       <User class="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <span class="text-[10px] font-black text-slate-500 uppercase tracking-tight">{{ task.intern_name }}</span>
                  </div>
                  <Flag class="h-3.5 w-3.5" :class="priorityColors[task.priority] || 'text-slate-300'" />
               </div>

               <p class="text-sm font-bold text-slate-700 leading-snug">
                 {{ task.task_description }}
               </p>

               <div class="flex items-center justify-between pt-2">
                  <div class="flex items-center gap-2">
                    <Clock class="h-3 w-3 text-slate-300" />
                    <span class="text-[9px] font-black text-slate-400 uppercase">{{ new Date(task.task_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) }}</span>
                  </div>
                  <div v-if="task.project_link" class="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center">
                     <LinkIcon class="h-3 w-3 text-indigo-400" />
                  </div>
               </div>
            </div>

            <!-- Accent line -->
            <div class="absolute top-0 left-0 w-1 h-full" :class="(statusColors[status] || '').split(' ')[0]"></div>
          </div>
          
          <div v-if="boardMissions.filter(t => t.status === status).length === 0" class="h-32 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center opacity-40">
             <p class="text-[9px] font-black uppercase tracking-widest text-slate-400">Aucune mission</p>
          </div>

          <Button 
            variant="ghost" 
            class="w-full border-2 border-dashed border-slate-200 text-slate-400 hover:border-indigo-200 hover:text-indigo-500 hover:bg-indigo-50/30 h-12 rounded-2xl transition-all group mt-2"
            @click="openAddModal(new Date(), status)"
          >
            <Plus class="h-4 w-4 mr-1.5 group-hover:rotate-90 transition-transform" />
            <span class="text-[10px] font-black uppercase tracking-widest">Ajouter</span>
          </Button>
        </div>
      </div>
    </div>

    <!-- Modal: Nouvelle Tâche (Style ClickUp) -->
    <div v-if="showAddModal" class="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4" @click="showAddModal = false">
      <div class="bg-white rounded-[32px] max-w-xl w-full overflow-hidden flex flex-col shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-300" @click.stop>
        <div class="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <div>
            <div class="flex items-center gap-2 mb-1">
               <span class="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[9px] font-black uppercase tracking-widest">ClickUp Mode</span>
               <h3 class="text-xl font-black text-slate-900 uppercase tracking-tight">Nouvelle Mission</h3>
            </div>
            <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest opacity-60">{{ formatDate(new Date(selectedDate)) }}</p>
          </div>
          <button @click="showAddModal = false" class="p-2 rounded-xl text-slate-400 hover:bg-white hover:text-slate-600 transition-all shadow-sm border border-transparent hover:border-slate-100">
            <X class="h-5 w-5" />
          </button>
        </div>

        <div class="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
          <div class="grid grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <User class="h-3 w-3" /> Assigné
              </label>
              <Input v-model="newTask.intern_name" placeholder="Nom du stagiaire" class="h-12 rounded-2xl border-slate-200 focus-visible:ring-indigo-100 font-bold" />
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Flag class="h-3 w-3" /> Priorité
              </label>
              <select v-model="newTask.priority" class="w-full h-12 px-4 rounded-2xl border border-slate-200 text-sm font-bold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all outline-none">
                <option value="Basse">Basse</option>
                <option value="Normale">Normale</option>
                <option value="Haute">Haute</option>
                <option value="Urgente">Urgente</option>
              </select>
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <AlertCircle class="h-3 w-3" /> Statut
              </label>
              <select v-model="newTask.status" class="w-full h-12 px-4 rounded-2xl border border-slate-200 text-sm font-bold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all outline-none">
                <option value="A faire">A faire</option>
                <option value="En cours">En cours</option>
                <option value="Bloqué">Bloqué</option>
                <option value="Terminé">Terminé</option>
              </select>
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <LinkIcon class="h-3 w-3" /> Lien Projet
              </label>
              <Input v-model="newTask.project_link" placeholder="https://..." class="h-12 rounded-2xl border-slate-200 focus-visible:ring-indigo-100 font-bold" />
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <ListIcon class="h-3 w-3" /> Description de la mission
            </label>
            <textarea 
              v-model="newTask.task_description" 
              class="w-full min-h-[150px] p-4 rounded-2xl border border-slate-200 text-sm font-bold focus:border-indigo-500 focus:ring-8 focus:ring-indigo-50 transition-all outline-none placeholder:text-slate-300"
              placeholder="Décrivez précisément les étapes à suivre..."
            ></textarea>
          </div>
        </div>

        <div class="p-8 bg-slate-50/30 border-t border-slate-100 flex gap-4">
          <Button variant="ghost" class="flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-widest" @click="showAddModal = false">Annuler</Button>
          <Button class="flex-1 h-14 bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-100 rounded-2xl font-black text-xs uppercase tracking-widest" @click="addTask">Créer la tâche</Button>
        </div>
      </div>
    </div>

    <!-- Modal: Voir Tâche (ClickUp Style) -->
    <div v-if="selectedTaskForView" class="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4" @click="selectedTaskForView = null">
      <div class="bg-white rounded-[32px] max-w-2xl w-full overflow-hidden flex flex-col shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-300" @click.stop>
        <div class="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <div class="flex items-center gap-4">
             <div class="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                <User class="h-6 w-6 text-indigo-500" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-xl font-black text-slate-900 uppercase tracking-tight">{{ selectedTaskForView.intern_name }}</h3>
                  <Flag class="h-4 w-4" :class="priorityColors[selectedTaskForView.priority] || 'text-slate-400'" />
                </div>
                <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest opacity-60">{{ formatDate(new Date(selectedTaskForView.task_date)) }}</p>
              </div>
          </div>
          <div class="flex items-center gap-2">
             <button @click="updateTaskStatus(selectedTaskForView, 'Terminé')" v-if="selectedTaskForView.status !== 'Terminé'" class="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all">
                <CheckCircle class="h-3.5 w-3.5" /> Terminer
             </button>
             <button @click="selectedTaskForView = null" class="p-2 rounded-xl text-slate-400 hover:bg-white hover:text-slate-600 transition-all shadow-sm border border-transparent hover:border-slate-100">
               <X class="h-5 w-5" />
             </button>
          </div>
        </div>

        <div class="p-10 space-y-8 max-h-[60vh] overflow-y-auto">
          <!-- Details Grid -->
          <div class="grid grid-cols-3 gap-6 pb-6 border-b border-slate-50">
             <div class="space-y-1">
               <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60">Statut</p>
               <div class="flex items-center gap-2">
                 <div class="w-2 h-2 rounded-full" :class="(statusColors[selectedTaskForView.status] || 'bg-slate-100 text-slate-500').split(' ')[0]"></div>
                 <span class="text-xs font-black uppercase tracking-tight" :class="(statusColors[selectedTaskForView.status] || 'bg-slate-100 text-slate-500').split(' ')[1]">{{ selectedTaskForView.status || 'A faire' }}</span>
               </div>
             </div>
             <div class="space-y-1 text-center border-x border-slate-50 px-6">
               <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60">Priorité</p>
               <div class="flex items-center justify-center gap-2">
                 <Flag class="h-3.5 w-3.5" :class="priorityColors[selectedTaskForView.priority] || 'text-slate-400'" />
                 <span class="text-xs font-black uppercase tracking-tight" :class="priorityColors[selectedTaskForView.priority] || 'text-slate-400'">{{ selectedTaskForView.priority || 'Normale' }}</span>
               </div>
             </div>
             <div class="space-y-1 text-right">
               <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60">Création</p>
               <span class="text-xs font-black text-slate-600 uppercase tracking-tight">{{ new Date(selectedTaskForView.task_date).toLocaleDateString('fr-FR') }}</span>
             </div>
          </div>

          <div v-if="selectedTaskForView.project_link" class="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100/50 flex items-center gap-4 group">
             <div class="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm group-hover:rotate-12 transition-transform">
                <LinkIcon class="h-5 w-5 text-indigo-600" />
             </div>
             <div class="flex-1 min-w-0">
               <p class="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1 opacity-60">Lien du Projet</p>
               <p class="truncate text-sm font-bold" v-html="parseTextWithLinks(selectedTaskForView.project_link)"></p>
             </div>
          </div>

          <div class="space-y-4">
            <div class="flex items-center gap-2">
               <div class="w-1 h-6 bg-indigo-600 rounded-full"></div>
               <p class="text-[10px] font-black text-slate-900 uppercase tracking-widest opacity-60">Description de la mission</p>
            </div>
            <p class="text-base font-bold text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50/50 p-6 rounded-3xl" v-html="parseTextWithLinks(selectedTaskForView.task_description)"></p>
          </div>
        </div>

        <div class="p-8 bg-slate-50/30 border-t border-slate-100 flex gap-4 items-center">
           <button @click="deleteTask(selectedTaskForView.id); selectedTaskForView = null" class="text-rose-500 hover:text-rose-700 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 px-4 py-2 hover:bg-rose-50 rounded-xl transition-all">
              <Trash2 class="h-4 w-4" /> Supprimer
           </button>
           <div class="flex-1"></div>
           <Button variant="ghost" class="h-12 px-8 rounded-2xl font-black text-xs uppercase tracking-widest" @click="selectedTaskForView = null">Fermer</Button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.min-h-screen {
  min-height: calc(100vh - 4rem);
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;  
  overflow: hidden;
}

/* Kanban specific styles */
.cursor-grab {
  cursor: grab;
}
.cursor-grabbing {
  cursor: grabbing;
}
</style>
