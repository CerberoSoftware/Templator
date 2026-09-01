import { create } from 'zustand'
import { api } from '../api/client'
import { WEB_SAFE_FONTS } from '../builder/model'

export interface FontOption {
  name: string
  stack: string
}

interface FontsState {
  brandFonts: FontOption[]
  loaded: boolean
  load: () => Promise<void>
  save: (fonts: FontOption[]) => Promise<void>
}

export const useFonts = create<FontsState>((set) => ({
  brandFonts: [],
  loaded: false,
  load: async () => {
    try {
      const settings = await api.get<Record<string, unknown>>('/api/settings')
      const raw = settings['brand_fonts']
      const parsed: FontOption[] = Array.isArray(raw)
        ? (raw as FontOption[]).filter((f) => typeof f.name === 'string' && typeof f.stack === 'string')
        : []
      set({ brandFonts: parsed, loaded: true })
    } catch {
      set({ loaded: true })
    }
  },
  save: async (fonts) => {
    await api.put('/api/settings', { settings: { brand_fonts: fonts } })
    set({ brandFonts: fonts })
  },
}))

/**
 * Returns all font options: brand fonts first, then web-safe fonts.
 * Call this anywhere you need a merged font list (e.g. FontField in PropertiesPanel).
 */
export function fontOptions(): FontOption[] {
  const { brandFonts } = useFonts.getState()
  return [...brandFonts, ...WEB_SAFE_FONTS]
}
