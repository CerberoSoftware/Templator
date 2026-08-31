import { create } from 'zustand'
import { api } from '../api/client'

export interface EmailComponent {
  id: number
  name: string
  category: string
  html_template: string
  props_schema: string | null
  is_system: number
  created_at: string
}

interface ComponentsState {
  components: EmailComponent[]
  loaded: boolean
  load: () => Promise<void>
  remove: (id: number) => Promise<void>
}

export const useComponents = create<ComponentsState>((set, get) => ({
  components: [],
  loaded: false,
  load: async () => {
    try {
      const list = await api.get<EmailComponent[]>('/api/components')
      set({ components: list, loaded: true })
    } catch {
      set({ loaded: true })
    }
  },
  remove: async (id) => {
    await api.del(`/api/components/${id}`)
    set({ components: get().components.filter((c) => c.id !== id) })
  },
}))
