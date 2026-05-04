<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  ChevronLeft, 
  ChevronRight,
  User,
  X
} from 'lucide-vue-next'

interface CalendarTask {
  id: number
  intern_name: string
  task_description: string
  task_date: string
  is_completed: boolean
}

const tasks = ref<CalendarTask[]>([])
const isLoading = ref(true)
const currentWeekStart = ref(new Date())

// Set to Monday of the current week
const setWeekToMonday = (date: Date) => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

onMounted(() => {
  currentWeekStart.value = setWeekToMonday(new Date())
  fetchTasks()
})

const fetchTasks = async () => {
  isLoading.value = true
  const { data, error } = await supabase
    .from('calendar_tasks')
    .select('*')
    .order('created_at', { ascending: true })
  
  if (data && !error) {
    tasks.value = data
  }
  isLoading.value = false
}

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
  return tasks.value.filter(t => t.task_date === dateStr)
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

// Add Task State
const showAddModal = ref(false)
const selectedDate = ref('')
const newTask = ref({
  intern_name: '',
  task_description: ''
})

const openAddModal = (date: Date) => {
  selectedDate.value = date.toISOString().split('T')[0]
  showAddModal.value = true
}

const addTask = async () => {
  if (!newTask.value.intern_name || !newTask.value.task_description) return

  const { data, error } = await supabase
    .from('calendar_tasks')
    .insert({
      intern_name: newTask.value.intern_name,
      task_description: newTask.value.task_description,
      task_date: selectedDate.value,
      is_completed: false
    })
    .select()
    .single()

  if (data && !error) {
    tasks.value.push(data)
    newTask.value = { intern_name: '', task_description: '' }
    showAddModal.value = false
  }
}

const toggleComplete = async (task: CalendarTask) => {
  const { error } = await supabase
    .from('calendar_tasks')
    .update({ is_completed: !task.is_completed })
    .eq('id', task.id)

  if (!error) {
    task.is_completed = !task.is_completed
  }
}

const deleteTask = async (id: number) => {
  if (!confirm('Supprimer cette tâche ?')) return
  
  const { error } = await supabase
    .from('calendar_tasks')
    .delete()
    .eq('id', id)

  if (!error) {
    tasks.value = tasks.value.filter(t => t.id !== id)
  }
}
</script>

<template>
  <div class="flex-1 space-y-6 p-6 bg-slate-50/30 min-h-screen relative">
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900">Planning Stagiaires</h2>
        <p class="text-muted-foreground text-xs">Organisation hebdomadaire des tâches.</p>
      </div>
      
      <div class="flex items-center gap-2 bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
        <Button variant="ghost" size="icon" @click="prevWeek" class="h-8 w-8 rounded-lg text-slate-500">
          <ChevronLeft class="h-4 w-4" />
        </Button>
        <span class="text-xs font-bold px-4 min-w-[180px] text-center text-slate-700">
          Semaine du {{ currentWeekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) }}
        </span>
        <Button variant="ghost" size="icon" @click="nextWeek" class="h-8 w-8 rounded-lg text-slate-500">
          <ChevronRight class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <!-- Calendar Grid -->
    <div class="grid grid-cols-1 md:grid-cols-7 gap-4">
      <div v-for="day in weekDays" :key="day.getTime()" class="flex flex-col gap-3">
        <div class="flex flex-col p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">{{ day.toLocaleDateString('fr-FR', { weekday: 'long' }) }}</span>
          <span class="text-xl font-black text-slate-900">{{ day.getDate() }}</span>
        </div>

        <div class="flex-1 space-y-2 min-h-[200px]">
          <div v-for="task in getTasksForDay(day)" :key="task.id" 
            class="group p-4 bg-white border border-slate-100 rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden"
            :class="[task.is_completed ? 'opacity-60 bg-slate-50/50' : '']"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="space-y-2">
                <div class="flex items-center gap-1.5">
                  <div class="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center">
                    <User class="h-3 w-3 text-indigo-500" />
                  </div>
                  <span class="text-[10px] font-black text-indigo-600 uppercase tracking-tight">{{ task.intern_name }}</span>
                </div>
                <p class="text-xs font-bold text-slate-700 leading-relaxed" :class="[task.is_completed ? 'line-through text-slate-400' : '']">
                  {{ task.task_description }}
                </p>
              </div>
              <button @click="toggleComplete(task)" class="shrink-0 transition-all active:scale-90">
                <CheckCircle2 v-if="task.is_completed" class="h-5 w-5 text-emerald-500" />
                <Circle v-else class="h-5 w-5 text-slate-200 hover:text-indigo-500" />
              </button>
            </div>
            
            <button 
              @click="deleteTask(task.id)" 
              class="absolute top-2 right-2 p-1.5 bg-rose-50 text-rose-500 rounded-xl border border-rose-100 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-100"
            >
              <Trash2 class="h-3.5 w-3.5" />
            </button>

            <!-- Progress line -->
            <div v-if="task.is_completed" class="absolute bottom-0 left-0 h-1 bg-emerald-500 w-full"></div>
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

    <!-- Modal: Nouvelle Tâche -->
    <div v-if="showAddModal" class="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4" @click="showAddModal = false">
      <div class="bg-white rounded-3xl max-w-md w-full overflow-hidden flex flex-col shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-300" @click.stop>
        <div class="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 class="text-xl font-black text-slate-900">Nouvelle Mission</h3>
            <p class="text-[10px] text-indigo-600 font-black uppercase tracking-widest">{{ formatDate(new Date(selectedDate)) }}</p>
          </div>
          <button @click="showAddModal = false" class="p-2 rounded-xl text-slate-400 hover:bg-white hover:text-slate-600 transition-all shadow-sm border border-transparent hover:border-slate-100">
            <X class="h-5 w-5" />
          </button>
        </div>

        <div class="p-8 space-y-6">
          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom du Stagiaire</label>
            <div class="relative">
              <User class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input v-model="newTask.intern_name" placeholder="Ex: Jean Dupont" class="pl-11 h-12 rounded-2xl border-slate-200 focus-visible:ring-indigo-100 font-bold" />
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mission à accomplir</label>
            <textarea 
              v-model="newTask.task_description" 
              class="w-full min-h-[120px] p-4 rounded-2xl border border-slate-200 text-sm font-bold focus:border-indigo-500 focus:ring-8 focus:ring-indigo-50 transition-all outline-none placeholder:text-slate-300"
              placeholder="Décrivez précisément la tâche..."
            ></textarea>
          </div>
        </div>

        <div class="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
          <Button variant="ghost" class="flex-1 h-12 rounded-2xl font-black text-xs uppercase tracking-widest" @click="showAddModal = false">Annuler</Button>
          <Button class="flex-1 h-12 bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-200 rounded-2xl font-black text-xs uppercase tracking-widest" @click="addTask">Enregistrer</Button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.min-h-screen {
  min-height: calc(100vh - 4rem);
}
</style>
