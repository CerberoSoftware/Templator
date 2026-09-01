import { create } from 'zustand'
import { api } from '../api/client'

function isHex(s: unknown): s is string {
  return typeof s === 'string' && /^#[0-9a-fA-F]{6}$/.test(s)
}

function normalize(list: unknown): string[] {
  if (!Array.isArray(list)) return []
  const out: string[] = []
  for (const v of list) {
    if (isHex(v) && out.length < 7 && !out.includes(v.toLowerCase())) out.push(v.toLowerCase())
    else if (typeof v === 'string' && out.length < 7) {
      // allow objects like {hex:"#..."} from older drafts
      const hex = (v as unknown as Record<string, unknown>)['hex']
      if (isHex(hex) && !out.includes((hex as string).toLowerCase())) out.push((hex as string).toLowerCase())
    }
    // also handle {color:"#..."} shape
    if (typeof v === 'object' && v !== null) {
      const c = (v as Record<string, unknown>)['color'] ?? (v as Record<string, unknown>)['value']
      if (isHex(c) && out.length < 7 && !out.includes((c as string).toLowerCase())) out.push((c as string).toLowerCase())
    }
  }
  return out
}

interface BrandColoursState {
  colours: string[]
  loaded: boolean
  load: () => Promise<void>
  save: (colours: string[]) => Promise<void>
  add: (hex: string) => Promise<boolean>
  remove: (index: number) => Promise<void>
  update: (index: number, hex: string) => Promise<void>
}

export const useBrandColours = create<BrandColoursState>((set, get) => ({
  colours: [],
  loaded: false,
  load: async () => {
    try {
      const settings = await api.get<Record<string, unknown>>('/api/settings')
      const raw = settings['brand_colours'] ?? settings['brand_colors']
      set({ colours: normalize(raw), loaded: true })
    } catch {
      set({ loaded: true })
    }
  },
  save: async (colours) => {
    const cleaned = normalize(colours).slice(0, 7)
    await api.put('/api/settings', { settings: { brand_colours: cleaned } })
    set({ colours: cleaned })
  },
  add: async (hex) => {
    if (!isHex(hex)) return false
    const { colours } = get()
    if (colours.length >= 7) return false
    const norm = hex.toLowerCase()
    if (colours.includes(norm)) return false
    const next = [...colours, norm]
    await api.put('/api/settings', { settings: { brand_colours: next } })
    set({ colours: next })
    return true
  },
  remove: async (index) => {
    const { colours } = get()
    const next = colours.filter((_, i) => i !== index)
    await api.put('/api/settings', { settings: { brand_colours: next } })
    set({ colours: next })
  },
  update: async (index, hex) => {
    if (!isHex(hex)) return
    const { colours } = get()
    const next = [...colours]
    next[index] = hex.toLowerCase()
    const dedup = normalize(next)
    // keep position: if dedup removed duplicate, pad? simpler: just normalize and keep order
    await api.put('/api/settings', { settings: { brand_colours: dedup } })
    set({ colours: dedup })
  },
}))
