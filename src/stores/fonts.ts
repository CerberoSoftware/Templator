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

/** Normalise a name or font stack so cosmetic differences don't defeat de-duplication. */
function fontKey(value: string): string {
  return value.toLowerCase().replace(/['"]/g, '').replace(/\s*,\s*/g, ',').replace(/\s+/g, ' ').trim()
}

/**
 * Returns all font options: brand fonts first, then web-safe fonts.
 * Call this anywhere you need a merged font list (e.g. FontField in PropertiesPanel).
 *
 * Entries are de-duplicated by display name *and* by font stack. Installs seeded
 * from migrations/001_init.sql start with the eight web-safe fonts already saved
 * as brand fonts, so a naive concatenation listed every font twice in every
 * picker. Brand fonts win, since they carry the name the user chose.
 */
export function fontOptions(): FontOption[] {
  const { brandFonts } = useFonts.getState()
  const seenNames = new Set<string>()
  const seenStacks = new Set<string>()
  const out: FontOption[] = []
  for (const font of [...brandFonts, ...WEB_SAFE_FONTS]) {
    const nameKey = fontKey(font.name)
    const stackKey = fontKey(font.stack)
    if (nameKey === '' || stackKey === '') continue
    if (seenNames.has(nameKey) || seenStacks.has(stackKey)) continue
    seenNames.add(nameKey)
    seenStacks.add(stackKey)
    out.push(font)
  }
  return out
}
