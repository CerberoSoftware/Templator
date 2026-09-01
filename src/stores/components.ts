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
  saveAsComponent: (name: string, html: string, category?: string) => Promise<void>
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

  saveAsComponent: async (name: string, html: string, category = 'Custom') => {
    const data = await api.post<{ id: number }>('/api/components', {
      name,
      category,
      html_template: html,
    })
    // Optimistically append so the sidebar updates immediately
    const newComponent: EmailComponent = {
      id: data.id,
      name,
      category,
      html_template: html,
      props_schema: null,
      is_system: 0,
      created_at: new Date().toISOString(),
    }
    set({ components: [...get().components, newComponent] })
  },

  remove: async (id: number) => {
    await api.del(`/api/components/${id}`)
    set({ components: get().components.filter((c) => c.id !== id) })
  },
}))
