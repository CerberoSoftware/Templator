import type { Block, BlockType } from '../model'
import { normalizeColor } from '../htmlUtils'

export interface FieldDef {
  key: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'range' | 'color' | 'select' | 'toggle' | 'font' | 'url' | 'social-links'
  min?: number
  max?: number
  step?: number
  unit?: string
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

/**
 * Read a block's own background color back from its outer <td>, for
 * round-tripping the shared `blockBg` field. Every block's render() writes
 * blockBg onto this same <td> (via outerTdStyle), so parse() must read it
 * back from there too — otherwise every re-import resets it to 'transparent'.
 */
export function parseBlockBg(td: Element): string {
  const bg = (td as HTMLElement).style.backgroundColor
  if (bg) return normalizeColor(bg)
  const attr = td.getAttribute('bgcolor')
  if (attr) return normalizeColor(attr)
  return 'transparent'
}

export const ALIGN_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
]

/** Shared fields appended to every block's field list */
export const COMMON_FIELDS: FieldDef[] = [
  { key: 'widthPct', label: 'Block width', type: 'range', min: 20, max: 100, step: 5, unit: '%' },
  { key: 'blockBg', label: 'Block background', type: 'color' },
  { key: 'blockRadius', label: 'Corner radius', type: 'range', min: 0, max: 32, step: 1, unit: 'px' },
]

/** Default values for the shared fields */
export const COMMON_DEFAULTS = { blockBg: 'transparent', blockRadius: 0, widthPct: 100 }

/** CSS mask that fades an image to transparent at its bottom edge. */
export const FADE_BOTTOM_MASK_CSS =
  '-webkit-mask-image:linear-gradient(to bottom, black 82%, transparent 100%);mask-image:linear-gradient(to bottom, black 82%, transparent 100%);'

/** Marker class used to detect the fade-bottom effect when parsing imported HTML back into props. */
export const FADE_BOTTOM_CLASS = 'et-fade-bottom'

/**
 * Build the inline style string for a block's outer <td>.
 * Merges base style with blockBg / blockRadius / widthPct from props.
 */
export function outerTdStyle(
  base: string,
  props: { blockBg?: string; blockRadius?: number; widthPct?: number },
  contentWidth?: number,
): string {
  const parts: string[] = [base.trim().replace(/;$/, '')]
  if (props.blockBg && props.blockBg !== 'transparent') {
    parts.push(`background-color:${props.blockBg}`)
  }
  if (props.blockRadius && props.blockRadius > 0) {
    parts.push(`border-radius:${props.blockRadius}px`)
    parts.push('overflow:hidden')
  }
  const pct = props.widthPct ?? 100
  if (pct < 100 && contentWidth) {
    const w = Math.round((contentWidth * pct) / 100)
    parts.push(`max-width:${w}px`)
    // Centre the narrowed block within the row
    parts.push('margin-left:auto')
    parts.push('margin-right:auto')
  }
  return parts.filter(Boolean).join(';') + ';'
}
