import { supabase } from '@/lib/supabase'

export interface CommercialProject {
  id: number
  name: string
  client: string
  contact_name?: string
  contact_phone?: string
  contact_email?: string
  address?: string
  project_type: string
  status: string // 'Devis à faire' | 'Devis envoyé' | 'Rendez-vous pris' | 'Négociation' | 'Gagné / Signé' | 'Perdu'
  priority: string // 'Basse' | 'Moyenne' | 'Haute' | 'Urgente'
  estimated_amount?: string
  commercial_name?: string
  deadline?: string
  description?: string
  website?: string // Site Web / Lien URL du projet
  photos: string[]
  meeting_date?: string // Date et heure du rendez-vous
  meeting_note?: string // Lieu ou précision du rendez-vous
  created_at?: string
}

export interface CommercialNote {
  id: number
  project_id: number
  text: string
  date: string
  created_at?: string
}

const LOCAL_STORAGE_KEY = 'md_commercial_projects'
const LOCAL_STORAGE_NOTES_KEY = 'md_commercial_project_notes'

const getLocalProjects = (): CommercialProject[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    return []
  }
}

const saveLocalProjects = (projects: CommercialProject[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(projects))
  } catch (e) {
    console.error('Failed to save to localStorage', e)
  }
}

const getLocalNotes = (): Record<number, CommercialNote[]> => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_NOTES_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch (e) {
    return {}
  }
}

const saveLocalNotes = (notesMap: Record<number, CommercialNote[]>) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_NOTES_KEY, JSON.stringify(notesMap))
  } catch (e) {
    console.error('Failed to save notes to localStorage', e)
  }
}

export const commercialService = {
  async getProjects(): Promise<{ data: CommercialProject[]; isOnline: boolean }> {
    try {
      const { data, error } = await supabase
        .from('commercial_projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.warn('Supabase commercial_projects warning, using local fallback:', error.message)
        return { data: getLocalProjects(), isOnline: false }
      }

      const formatted = (data || []).map(p => ({
        ...p,
        photos: Array.isArray(p.photos) ? p.photos : (p.photos ? JSON.parse(p.photos) : [])
      }))

      // Sync local cache
      saveLocalProjects(formatted)
      return { data: formatted, isOnline: true }
    } catch (e) {
      console.error('Exception fetching commercial projects, using local cache:', e)
      return { data: getLocalProjects(), isOnline: false }
    }
  },

  async createProject(project: Omit<CommercialProject, 'id' | 'created_at'>): Promise<CommercialProject> {
    const projectToSave = {
      ...project,
      photos: project.photos || []
    }

    try {
      let { data, error } = await supabase
        .from('commercial_projects')
        .insert([projectToSave])
        .select()
        .single()

      if (error && (error.message.includes('schema cache') || error.message.includes('column'))) {
        const sanitized: any = { ...projectToSave }
        delete sanitized.website
        delete sanitized.meeting_date
        delete sanitized.meeting_note
        const retry = await supabase.from('commercial_projects').insert([sanitized]).select().single()
        data = retry.data
        error = retry.error
      }

      if (!error && data) {
        const created: CommercialProject = {
          ...projectToSave,
          ...data,
          photos: Array.isArray(data.photos) ? data.photos : (data.photos ? JSON.parse(data.photos) : [])
        }
        const current = getLocalProjects()
        saveLocalProjects([created, ...current.filter(p => p.id !== created.id)])
        return created
      }
    } catch (e) {
      console.warn('Supabase insert failed, storing locally:', e)
    }

    // Local fallback
    const fallbackId = Date.now()
    const fallbackItem: CommercialProject = {
      ...projectToSave,
      id: fallbackId,
      created_at: new Date().toISOString()
    }
    const current = getLocalProjects()
    saveLocalProjects([fallbackItem, ...current])
    return fallbackItem
  },

  async updateProject(id: number, updates: Partial<CommercialProject>): Promise<boolean> {
    try {
      let { error } = await supabase
        .from('commercial_projects')
        .update(updates)
        .eq('id', id)

      if (error && (error.message.includes('schema cache') || error.message.includes('column'))) {
        const sanitized: any = { ...updates }
        delete sanitized.website
        delete sanitized.meeting_date
        delete sanitized.meeting_note
        const retry = await supabase.from('commercial_projects').update(sanitized).eq('id', id)
        error = retry.error
      }

      if (error) {
        console.warn('Supabase update failed:', error.message)
      }
    } catch (e) {
      console.warn('Supabase update exception:', e)
    }

    // Always update local cache
    const current = getLocalProjects()
    const updated = current.map(p => p.id === id ? { ...p, ...updates } : p)
    saveLocalProjects(updated)
    return true
  },

  async deleteProject(id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('commercial_projects')
        .delete()
        .eq('id', id)

      if (error) {
        console.warn('Supabase delete failed:', error.message)
      }
    } catch (e) {
      console.warn('Supabase delete exception:', e)
    }

    const current = getLocalProjects()
    saveLocalProjects(current.filter(p => p.id !== id))
    return true
  },

  async getNotes(): Promise<Record<number, CommercialNote[]>> {
    try {
      const { data, error } = await supabase
        .from('commercial_project_notes')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) {
        const mapped: Record<number, CommercialNote[]> = {}
        data.forEach(note => {
          if (!mapped[note.project_id]) mapped[note.project_id] = []
          mapped[note.project_id].push(note)
        })
        saveLocalNotes(mapped)
        return mapped
      }
    } catch (e) {
      console.warn('Error fetching notes from Supabase:', e)
    }

    return getLocalNotes()
  },

  async addNote(projectId: number, text: string): Promise<CommercialNote> {
    const now = new Date()
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

    const notePayload = {
      project_id: projectId,
      text,
      date: formattedDate
    }

    try {
      const { data, error } = await supabase
        .from('commercial_project_notes')
        .insert([notePayload])
        .select()
        .single()

      if (!error && data) {
        const local = getLocalNotes()
        if (!local[projectId]) local[projectId] = []
        local[projectId].unshift(data)
        saveLocalNotes(local)
        return data
      }
    } catch (e) {
      console.warn('Failed to insert note to Supabase:', e)
    }

    // Local fallback
    const fallbackNote: CommercialNote = {
      id: Date.now(),
      project_id: projectId,
      text,
      date: formattedDate,
      created_at: new Date().toISOString()
    }
    const local = getLocalNotes()
    if (!local[projectId]) local[projectId] = []
    local[projectId].unshift(fallbackNote)
    saveLocalNotes(local)
    return fallbackNote
  },

  async deleteNote(noteId: number, projectId: number): Promise<boolean> {
    try {
      await supabase.from('commercial_project_notes').delete().eq('id', noteId)
    } catch (e) {
      console.warn('Failed to delete note from Supabase:', e)
    }
    const local = getLocalNotes()
    if (local[projectId]) {
      local[projectId] = local[projectId].filter(n => n.id !== noteId)
      saveLocalNotes(local)
    }
    return true
  }
}
