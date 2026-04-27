<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Truck, FileText, X, Send, User, MapPin, Plus } from 'lucide-vue-next'

interface Installation {
  id: number
  client: string
  address: string
  signType: string // Type d'enseigne
  status: string
  poseur: string
  deadline: string
  priority: string
}

interface Note {
  text: string
  date: string
}



const installations = ref<Installation[]>([])
const installationNotes = ref<Record<number, Note[]>>({})
const activeFilter = ref('Tous')
const selectedInst = ref<Installation | null>(null)
const newNoteText = ref('')

const showAddModal = ref(false)
const newInst = ref({
  client: '',
  address: '',
  signType: '',
  poseur: 'Karim',
  deadline: '',
  priority: 'Moyenne'
})

const poseurs = ['Karim', 'Thomas', 'Sofiane', 'Équipe A', 'Équipe B']

const fetchInstallations = async () => {
  const { data, error } = await supabase.from('installations').select('*').order('created_at', { ascending: false })
  if (data && !error) {
    const mapped = data.map(i => ({
      id: i.id,
      client: i.client,
      address: i.address,
      signType: i.sign_type || i.signType || 'Enseigne',
      status: i.status,
      poseur: i.poseur,
      deadline: i.deadline,
      priority: i.priority
    }))
    installations.value = mapped
  }
}

const fetchInstNotes = async () => {
  const { data, error } = await supabase.from('installation_notes').select('*').order('created_at', { ascending: false })
  if (data && !error) {
    const mapped: Record<number, Note[]> = {}
    data.forEach(note => {
      const instId = note.installation_id
      if (!mapped[instId]) mapped[instId] = []
      mapped[instId].push({ text: note.text, date: note.date })
    })
    installationNotes.value = mapped
  }
}

onMounted(() => {
  fetchInstallations()
  fetchInstNotes()
})

// Filtered Installations
const filteredInstallations = computed(() => {
  if (activeFilter.value === 'Tous') return installations.value
  if (activeFilter.value === 'En cours') return installations.value.filter(i => i.status === 'En cours')
  if (activeFilter.value === 'Terminés') return installations.value.filter(i => i.status === 'Terminé')
  if (activeFilter.value === 'À planifier') return installations.value.filter(i => i.status === 'À planifier')
  return installations.value
})

const updateStatus = async (id: number, newStatus: string) => {
  const { error } = await supabase.from('installations').update({ status: newStatus }).eq('id', id)
  if (!error) {
    const inst = installations.value.find(i => i.id === id)
    if (inst) {
      inst.status = newStatus
    }
  }
}

const addNote = async () => {
  if (!selectedInst.value || !newNoteText.value.trim()) return
  const instId = selectedInst.value.id
  const now = new Date()
  const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')} ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`
  
  const { data, error } = await supabase.from('installation_notes').insert({
    installation_id: instId,
    text: newNoteText.value.trim(),
    date: formattedDate
  }).select().single()
  
  if (data && !error) {
    if (!installationNotes.value[instId]) installationNotes.value[instId] = []
    installationNotes.value[instId].unshift({ text: data.text, date: data.date })
    newNoteText.value = ''
  }
}

const addInstallation = async () => {
  if (!newInst.value.client.trim() || !newInst.value.signType.trim()) return
  
  const { data, error } = await supabase.from('installations').insert({
    client: newInst.value.client.trim(),
    address: newInst.value.address.trim() || 'Non spécifiée',
    sign_type: newInst.value.signType.trim(),
    status: 'À planifier',
    poseur: newInst.value.poseur,
    deadline: newInst.value.deadline || 'Non définie',
    priority: newInst.value.priority
  }).select().single()
  
  if (data && !error) {
    const mapped = {
      id: data.id,
      client: data.client,
      address: data.address,
      signType: data.sign_type || data.signType,
      status: data.status,
      poseur: data.poseur,
      deadline: data.deadline,
      priority: data.priority
    }
    installations.value.unshift(mapped)
    
    newInst.value = {
      client: '',
      address: '',
      signType: '',
      poseur: 'Karim',
      deadline: '',
      priority: 'Moyenne'
    }
    showAddModal.value = false
  }
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
        <h2 class="text-2xl font-bold tracking-tight text-slate-900">Suivi Poseurs & Enseignes</h2>
        <p class="text-muted-foreground text-xs">Gérez les chantiers de pose et vos équipes sur le terrain.</p>
      </div>
      <Button size="sm" @click="showAddModal = true" class="bg-indigo-600 hover:bg-indigo-500 shadow-sm">
        <Plus class="mr-1.5 h-3.5 w-3.5" /> Planifier une Pose
      </Button>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-xl w-fit">
      <button 
        v-for="filter in ['Tous', 'À planifier', 'En cours', 'Terminés']" 
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

    <!-- Compact Installation Grid -->
    <div class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <Card v-for="inst in filteredInstallations" :key="inst.id" 
        class="flex flex-col bg-white border-slate-100/80 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl overflow-hidden cursor-pointer"
        @click="selectedInst = inst"
      >
        <CardHeader class="p-4 pb-2 space-y-1">
          <div class="flex items-center justify-between">
            <Badge variant="outline" :class="[getStatusColor(inst.status), 'text-[10px] px-2 py-0.5 font-bold border']">
              {{ inst.status }}
            </Badge>
            <span class="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
              <Calendar class="h-3 w-3 text-slate-400" /> {{ inst.deadline }}
            </span>
          </div>
          <CardTitle class="text-base text-slate-900 font-bold tracking-tight truncate">{{ inst.client }}</CardTitle>
          <CardDescription class="text-slate-400 text-xs truncate flex items-center gap-1">
            <Truck class="h-3 w-3" /> {{ inst.signType }}
          </CardDescription>
        </CardHeader>
        
        <CardContent class="p-4 pt-2 flex-1 flex flex-col justify-between gap-4" @click.stop>
          <!-- Poseur & Address -->
          <div class="space-y-1.5 text-xs text-slate-600 font-medium">
            <div class="flex items-center gap-1.5">
              <User class="h-3.5 w-3.5 text-slate-400" /> Poseur: <span class="font-bold text-slate-800">{{ inst.poseur }}</span>
            </div>
            <div class="flex items-center gap-1.5 truncate">
              <MapPin class="h-3.5 w-3.5 text-slate-400" /> {{ inst.address }}
            </div>
          </div>

          <!-- Notes Preview -->
          <div class="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 font-medium truncate flex items-center gap-1">
            <FileText class="h-3 w-3 text-slate-400 shrink-0" />
            <span v-if="installationNotes[inst.id]?.length">
              {{ installationNotes[inst.id][0].text }}
            </span>
            <span v-else class="text-slate-300 italic">Aucune note</span>
          </div>

          <!-- Actions / Status Change -->
          <div class="pt-2 border-t border-slate-50 flex flex-col gap-2">
            <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Changer le statut</span>
            <div class="flex gap-1">
              <button 
                @click="updateStatus(inst.id, 'À planifier')"
                class="flex-1 py-1 text-[9px] font-bold rounded border transition-all"
                :class="[inst.status === 'À planifier' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50']"
              >
                À planifier
              </button>
              <button 
                @click="updateStatus(inst.id, 'En cours')"
                class="flex-1 py-1 text-[9px] font-bold rounded border transition-all"
                :class="[inst.status === 'En cours' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50']"
              >
                En cours
              </button>
              <button 
                @click="updateStatus(inst.id, 'Terminé')"
                class="flex-1 py-1 text-[9px] font-bold rounded border transition-all"
                :class="[inst.status === 'Terminé' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50']"
              >
                Fini
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Modal: Installation Details & Multiple Notes -->
    <div v-if="selectedInst" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click="selectedInst = null">
      <div class="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200" @click.stop>
        
        <!-- Modal Header -->
        <div class="p-6 border-b border-slate-100 flex items-start justify-between">
          <div class="space-y-1">
            <Badge variant="outline" :class="[getStatusColor(selectedInst.status), 'text-xs px-2 py-0.5 font-bold border']">
              {{ selectedInst.status }}
            </Badge>
            <h3 class="text-xl font-bold text-slate-900 tracking-tight">{{ selectedInst.client }}</h3>
            <p class="text-slate-500 text-sm font-medium">{{ selectedInst.signType }}</p>
          </div>
          <button @click="selectedInst = null" class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X class="h-5 w-5" />
          </button>
        </div>

        <!-- Modal Content -->
        <div class="p-6 overflow-y-auto flex-1 space-y-6">
          
          <!-- Info Grid -->
          <div class="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div class="space-y-1">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date prévue</span>
              <div class="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <Calendar class="h-4 w-4 text-slate-500" /> {{ selectedInst.deadline }}
              </div>
            </div>
            <div class="space-y-1">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Poseur assigné</span>
              <div class="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <User class="h-4 w-4 text-slate-500" /> {{ selectedInst.poseur }}
              </div>
            </div>
            <div class="col-span-2 space-y-1">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Adresse de pose</span>
              <div class="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <MapPin class="h-4 w-4 text-slate-500" /> {{ selectedInst.address }}
              </div>
            </div>
          </div>

          <!-- Notes Section -->
          <div class="space-y-3">
            <h4 class="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <FileText class="h-4 w-4 text-slate-500" /> Notes de Chantier ({{ installationNotes[selectedInst.id]?.length || 0 }})
            </h4>

            <!-- Add Note Input -->
            <div class="flex gap-2">
              <input 
                v-model="newNoteText"
                placeholder="Ajouter une instruction, un code d'accès..."
                @keyup.enter="addNote"
                class="flex-1 px-4 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium placeholder:text-slate-400"
              />
              <Button @click="addNote" size="icon" class="bg-indigo-600 hover:bg-indigo-500 shrink-0 rounded-xl">
                <Send class="h-4 w-4 text-white" />
              </Button>
            </div>

            <!-- Notes List -->
            <div class="space-y-2 max-h-[250px] overflow-y-auto pr-1">
              <div v-for="(note, index) in installationNotes[selectedInst.id]" :key="index" 
                class="bg-slate-50/80 p-3 rounded-xl border border-slate-100/60 space-y-1"
              >
                <div class="flex justify-between items-center text-[10px]">
                  <span class="font-bold text-slate-400">Note #{{ installationNotes[selectedInst.id].length - index }}</span>
                  <span class="font-medium text-slate-400 bg-slate-200/50 px-1.5 py-0.5 rounded">{{ note.date }}</span>
                </div>
                <p class="text-sm text-slate-700 font-medium whitespace-pre-wrap">{{ note.text }}</p>
              </div>
              
              <div v-if="!installationNotes[selectedInst.id]?.length" class="text-center py-6 text-slate-400 text-sm italic">
                Aucune note pour le moment.
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>

    <!-- Modal: Nouvelle Pose -->
    <div v-if="showAddModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click="showAddModal = false">
      <div class="bg-white rounded-2xl max-w-md w-full overflow-hidden flex flex-col shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200" @click.stop>
        
        <!-- Modal Header -->
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 class="text-lg font-bold text-slate-900">Planifier une Nouvelle Pose</h3>
          <button @click="showAddModal = false" class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X class="h-5 w-5" />
          </button>
        </div>

        <!-- Modal Content -->
        <div class="p-6 space-y-4">
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700">Client</label>
            <input 
              v-model="newInst.client"
              placeholder="Ex: Boulangerie Louise"
              class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700">Adresse de Pose</label>
            <input 
              v-model="newInst.address"
              placeholder="Ex: 12 Rue de la Paix, Paris"
              class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700">Type d'Enseigne</label>
            <input 
              v-model="newInst.signType"
              placeholder="Ex: Enseigne Lumineuse LED"
              class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Date prévue</label>
              <input 
                v-model="newInst.deadline"
                placeholder="Ex: 15 Octobre"
                class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium"
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Poseur</label>
              <select 
                v-model="newInst.poseur"
                class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium"
              >
                <option v-for="p in poseurs" :key="p" :value="p">{{ p }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <Button variant="ghost" size="sm" @click="showAddModal = false">Annuler</Button>
          <Button size="sm" @click="addInstallation" class="bg-indigo-600 hover:bg-indigo-500 text-white">Planifier</Button>
        </div>

      </div>
    </div>

  </div>
</template>
