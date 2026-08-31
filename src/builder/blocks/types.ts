import type { Block, BlockType } from '../model'

export interface FieldDef {
  key: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'color' | 'select' | 'toggle' | 'font' | 'url'
  min?: number
  max?: number
  step?: number
  options?: Array<{ value: string; label: string }>
  placeholder?: string
  help?: string
}

export interface RenderCtx {
  markers: boolean
  contentWidth: number
  renderChild: (block: Block) => string
}

export interface ParseCtx {
  parseRow: (tr: Element) => Block | null
}

export interface BlockDef {
  type: BlockType
  label: string
  category: 'Content' | 'Layout' | 'Media' | 'Structure'
  container?: boolean
  fields: FieldDef[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaults: () => any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render: (block: any, ctx: RenderCtx) => string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parse: (tr: Element, ctx: ParseCtx) => any | null
}

export function marker(id: string, ctx: RenderCtx): string {
  return ctx.markers ? ` data-et-block="${id}"` : ''
}

export function colMarker(id: string, col: number, ctx: RenderCtx): string {
  return ctx.markers ? ` data-et-col="${id}:${col}"` : ''
}

export function childTd(tr: Element, cls: string): HTMLElement | null {
  for (const child of tr.children) {
    if (child.tagName === 'TD' && child.classList.contains(cls)) {
      return child as HTMLElement
    }
  }
  return null
}

export const ALIGN_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
]
