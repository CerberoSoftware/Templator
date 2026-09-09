import { DEFAULT_LIST_ITEM_SPACING, DEFAULT_PARAGRAPH_SPACING } from './htmlUtils'

export type BlockType =
  | 'header'
  | 'heading'
  | 'text'
  | 'callout'
  | 'image'
  | 'button'
  | 'spacer'
  | 'divider'
  | 'social'
  | 'twocol'
  | 'image_text'
  | 'footer'
  | 'raw'

export type Align = 'left' | 'center' | 'right'

/** Fields shared by every block */
export interface CommonBlockProps {
  /** Per-block background colour (overrides the email container bg). 'transparent' = no override. */
  blockBg: string
  /** Corner radius applied to the outer <td> wrapper in px */
  blockRadius: number
  /** Width as a percentage of the content width (1-100). Default 100. */
  widthPct: number
}

export interface EmailDocSettings {
  subject: string
  preheader: string
  contentWidth: number
  /** Outer page background (was outerBg) */
  bodyBg: string
  /** Email container background (was contentBg) */
  containerBg: string
  /** Default font stack inherited by blocks that don't override */
  fontFamily: string
  /** Default text colour inherited by blocks that don't override */
  textColor: string
  /** Default link colour inherited by blocks that don't override */
  linkColor: string
  /** Corner radius of the email container, in px */
  containerRadius: number
}

export interface HeaderProps extends CommonBlockProps {
  logoUrl: string
  logoAlt: string
  logoWidth: number
  logoLink: string
  tagline: string
  taglineColor: string
  taglineSize: number
  bgColor: string
  /** Second colour for a gradient band. 'transparent' (or the same colour) = flat background. */
  bgColorEnd: string
  align: Align
  paddingTop: number
  paddingBottom: number
  paddingX: number
}

export interface HeadingProps extends CommonBlockProps {
  text: string
  level: 1 | 2 | 3
  color: string
  align: Align
  fontFamily: string
  paddingTop: number
  paddingBottom: number
  paddingX: number
}

export interface TextProps extends CommonBlockProps {
  content: string
  fontSize: number
  lineHeight: number
  fontFamily: string
  color: string
  align: Align
  linkColor: string
  linkUnderline: boolean
  /** Gap in px below each paragraph / list, except the last one */
  paragraphSpacing: number
  /** Gap in px below each item of a bulleted or numbered list */
  listItemSpacing: number
  paddingTop: number
  paddingBottom: number
  paddingX: number
}

export interface ImageProps extends CommonBlockProps {
  src: string
  alt: string
  width: number
  align: Align
  link: string
  /** Corner radius applied to the image itself, in px */
  radius: number
  paddingTop: number
  paddingBottom: number
  paddingX: number
  /** Fade the image to transparent at its bottom edge */
  fadeBottom: boolean
}

export interface ButtonProps extends CommonBlockProps {
  label: string
  href: string
  bgColor: string
  textColor: string
  radius: number
  fullWidth: boolean
  width: number
  height: number
  fontSize: number
  fontFamily: string
  align: Align
  paddingTop: number
  paddingBottom: number
  paddingX: number
}

export interface SpacerProps extends CommonBlockProps {
  height: number
  bg: string
}

export interface DividerProps extends CommonBlockProps {
  color: string
  thickness: number
  paddingTop: number
  paddingBottom: number
  paddingX: number
}

/** A single social network entry */
export interface SocialLink {
  platform: string
  href: string
}

export interface SocialProps extends CommonBlockProps {
  /** Structured list of social links */
  socialLinks: SocialLink[]
  /** Legacy plain-text format kept for parse round-trip of old docs */
  links?: string
  /** 'column' = stack vertically (default), 'row' = display side-by-side horizontally */
  layout: 'row' | 'column'
  iconSize: number
  showLabels: boolean
  iconColor: string
  color: string
  fontSize: number
  fontFamily: string
  align: Align
  paddingTop: number
  paddingBottom: number
  paddingX: number
}

export interface TwoColProps extends CommonBlockProps {
  ratio: '50-50' | '40-60' | '60-40'
  gap: number
  paddingTop: number
  paddingBottom: number
  paddingX: number
}

export interface ImageTextProps extends CommonBlockProps {
  imgSrc: string
  imgAlt: string
  imgWidth: number
  text: string
  fontSize: number
  lineHeight: number
  fontFamily: string
  color: string
  linkColor: string
  linkUnderline: boolean
  /** Corner radius applied to the image itself, in px */
  imgRadius: number
  imagePosition: 'left' | 'right'
  gap: number
  paddingTop: number
  paddingBottom: number
  paddingX: number
  /** Fade the image to transparent at its bottom edge */
  fadeBottom: boolean
}

export interface FooterProps extends CommonBlockProps {
  content: string
  fontSize: number
  fontFamily: string
  color: string
  linkColor: string
  linkUnderline: boolean
  align: Align
  bgColor: string
  paddingTop: number
  paddingBottom: number
  paddingX: number
}

export interface CalloutProps extends CommonBlockProps {
  /** Optional eyebrow label above the content */
  label: string
  content: string
  /** Colour of the thicker bar down the left edge. 'transparent' = no bar. */
  accentColor: string
  bgColor: string
  /** Colour of the 1px border around the card. 'transparent' = no border. */
  borderColor: string
  radius: number
  fontSize: number
  lineHeight: number
  fontFamily: string
  color: string
  linkColor: string
  labelColor: string
  align: Align
  /** Padding inside the card, in px */
  innerPadding: number
  paddingTop: number
  paddingBottom: number
  paddingX: number
}

export interface RawProps {
  html: string
  blockBg: string
  blockRadius: number
  widthPct: number
}

export interface BlockBase {
  id: string
  type: BlockType
}

export type Block =
  | (BlockBase & { type: 'header'; props: HeaderProps })
  | (BlockBase & { type: 'heading'; props: HeadingProps })
  | (BlockBase & { type: 'text'; props: TextProps })
  | (BlockBase & { type: 'callout'; props: CalloutProps })
  | (BlockBase & { type: 'image'; props: ImageProps })
  | (BlockBase & { type: 'button'; props: ButtonProps })
  | (BlockBase & { type: 'spacer'; props: SpacerProps })
  | (BlockBase & { type: 'divider'; props: DividerProps })
  | (BlockBase & { type: 'social'; props: SocialProps })
  | (BlockBase & { type: 'footer'; props: FooterProps })
  | (BlockBase & { type: 'twocol'; props: TwoColProps; columns: [Block[], Block[]] })
  | (BlockBase & { type: 'image_text'; props: ImageTextProps })
  | (BlockBase & { type: 'raw'; props: RawProps })

export interface EmailDoc {
  settings: EmailDocSettings
  blocks: Block[]
}

export const DEFAULT_FONT = 'Helvetica, Arial, sans-serif'
export const DEFAULT_LINK_COLOR = '#2b7fe0'
export const DEFAULT_TEXT_COLOR = '#333333'
export const HEADING_SIZES: Record<1 | 2 | 3, number> = { 1: 28, 2: 22, 3: 17 }

export const WEB_SAFE_FONTS: Array<{ name: string; stack: string }> = [
  // Helvetica first: it backs DEFAULT_FONT, so it heads every font picker.
  { name: 'Helvetica', stack: 'Helvetica, Arial, sans-serif' },
  { name: 'Arial', stack: 'Arial, Helvetica, sans-serif' },
  { name: 'Georgia', stack: 'Georgia, serif' },
  { name: 'Times New Roman', stack: "'Times New Roman', Times, serif" },
  { name: 'Trebuchet MS', stack: "'Trebuchet MS', Tahoma, sans-serif" },
  { name: 'Verdana', stack: 'Verdana, Geneva, sans-serif' },
  { name: 'Tahoma', stack: 'Tahoma, Verdana, sans-serif' },
  { name: 'Courier New', stack: "'Courier New', Courier, monospace" },
]

export function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `b-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export const DEFAULT_SETTINGS: EmailDocSettings = {
  subject: '',
  preheader: '',
  contentWidth: 600,
  bodyBg: '#f4f8fc',
  containerBg: '#ffffff',
  fontFamily: DEFAULT_FONT,
  textColor: DEFAULT_TEXT_COLOR,
  linkColor: DEFAULT_LINK_COLOR,
  containerRadius: 10,
}

export function emptyDoc(): EmailDoc {
  return { settings: { ...DEFAULT_SETTINGS }, blocks: [] }
}

export function cloneBlock<T extends Block>(block: T): T {
  const copy = structuredClone(block)
  const reassign = (b: Block): Block => {
    b.id = uid()
    if (b.type === 'twocol') {
      b.columns = [b.columns[0].map(reassign), b.columns[1].map(reassign)] as [Block[], Block[]]
    }
    return b
  }
  return reassign(copy) as T
}

export interface BlockRef {
  block: Block
  container: Block | null
  columnIndex: number | null
  blocks: Block[]
  index: number
}

export function findBlock(doc: EmailDoc, id: string): BlockRef | null {
  const search = (blocks: Block[], container: Block | null, columnIndex: number | null): BlockRef | null => {
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i]
      if (block.id === id) return { block, container, columnIndex, blocks, index: i }
      if (block.type === 'twocol') {
        for (let c = 0; c < 2; c++) {
          const found = search(block.columns[c], block, c)
          if (found) return found
        }
      }
    }
    return null
  }
  return search(doc.blocks, null, null)
}

export function allBlocks(doc: EmailDoc): Block[] {
  const out: Block[] = []
  const walk = (blocks: Block[]) => {
    for (const block of blocks) {
      out.push(block)
      if (block.type === 'twocol') {
        walk(block.columns[0])
        walk(block.columns[1])
      }
    }
  }
  walk(doc.blocks)
  return out
}

/**
 * Migrate a doc loaded from the API that may be missing newer fields.
 * Handles:
 *  - outerBg → bodyBg  (5-C rename)
 *  - contentBg → containerBg  (5-C rename)
 *  - back-fills fontFamily / textColor / linkColor / containerRadius on settings
 *  - back-fills blockBg / blockRadius / widthPct on every block
 *  - splits the old single `paddingY` into `paddingTop` / `paddingBottom`
 *  - back-fills paddingX on footer / social blocks that lacked it
 *  - back-fills paragraphSpacing / listItemSpacing on text blocks
 *  - back-fills the image / image+text corner radius and link-underline toggles
 *  - back-fills the header gradient end and the footer link colour
 *  - migrates legacy social `links` string → `socialLinks` array
 *  - back-fills social `layout` field
 * Safe to call on already-current docs, and defensive about malformed input:
 * anything that isn't a usable doc comes back as an empty one.
 */
export function migrateDoc(raw: unknown): EmailDoc {
  const input = raw as { settings?: Record<string, unknown>; blocks?: unknown } | null
  if (!input || typeof input !== 'object' || !Array.isArray(input.blocks)) return emptyDoc()
  const s: Record<string, unknown> = { ...DEFAULT_SETTINGS, ...(input.settings ?? {}) }
  const doc = { settings: s as unknown as EmailDocSettings, blocks: input.blocks as Block[] }

  // 5-C: rename outerBg → bodyBg
  if (s['outerBg'] !== undefined && input.settings?.['bodyBg'] === undefined) {
    s['bodyBg'] = s['outerBg']
  }
  // 5-C: rename contentBg → containerBg
  if (s['contentBg'] !== undefined && input.settings?.['containerBg'] === undefined) {
    s['containerBg'] = s['contentBg']
  }
  delete s['outerBg']
  delete s['contentBg']

  // Global typography and container defaults
  if (!s['bodyBg']) s['bodyBg'] = DEFAULT_SETTINGS.bodyBg
  if (!s['containerBg']) s['containerBg'] = DEFAULT_SETTINGS.containerBg
  if (!s['fontFamily']) s['fontFamily'] = DEFAULT_FONT
  if (!s['textColor']) s['textColor'] = DEFAULT_TEXT_COLOR
  if (!s['linkColor']) s['linkColor'] = DEFAULT_LINK_COLOR
  if (!Number.isFinite(s['contentWidth'])) s['contentWidth'] = DEFAULT_SETTINGS.contentWidth
  if (!Number.isFinite(s['containerRadius'])) s['containerRadius'] = DEFAULT_SETTINGS.containerRadius

  // Block field back-fills
  const migrate = (blocks: Block[]): void => {
    for (const b of blocks) {
      const p = (b.props ?? ((b as { props: unknown }).props = {})) as unknown as Record<string, unknown>
      if (p['blockBg'] === undefined) p['blockBg'] = 'transparent'
      if (p['blockRadius'] === undefined) p['blockRadius'] = 0
      if (p['widthPct'] === undefined) p['widthPct'] = 100
      // The builder used to expose a single "Vertical padding" slider stored as
      // `paddingY`. It was split into separate `paddingTop` / `paddingBottom`
      // fields, so carry any saved `paddingY` value forward into both —
      // otherwise reopened templates lose their padding (the sliders read 0 and
      // the rendered `padding:` shorthand drops to `undefinedpx`).
      if (p['paddingY'] !== undefined) {
        if (p['paddingTop'] === undefined) p['paddingTop'] = p['paddingY']
        if (p['paddingBottom'] === undefined) p['paddingBottom'] = p['paddingY']
        delete p['paddingY']
      }
      // Paragraph spacing slider on text blocks
      if (b.type === 'text' && p['paragraphSpacing'] === undefined) {
        p['paragraphSpacing'] = DEFAULT_PARAGRAPH_SPACING
      }
      // List item spacing slider on text blocks
      if (b.type === 'text' && p['listItemSpacing'] === undefined) {
        p['listItemSpacing'] = DEFAULT_LIST_ITEM_SPACING
      }
      // Underline-links toggle (previously always underlined)
      if ((b.type === 'text' || b.type === 'image_text') && p['linkUnderline'] === undefined) {
        p['linkUnderline'] = true
      }
      // Footer link styling — links used to be rendered in the body text colour
      if (b.type === 'footer') {
        if (p['linkColor'] === undefined) p['linkColor'] = p['color'] ?? DEFAULT_LINK_COLOR
        if (p['linkUnderline'] === undefined) p['linkUnderline'] = true
      }
      // Corner radius on the image itself
      if (b.type === 'image' && p['radius'] === undefined) p['radius'] = 0
      if (b.type === 'image_text' && p['imgRadius'] === undefined) p['imgRadius'] = 0
      // Header gradient band — flat background until a second colour is picked
      if (b.type === 'header' && p['bgColorEnd'] === undefined) p['bgColorEnd'] = 'transparent'
      // 5-B: paddingX on footer + social
      if ((b.type === 'footer' || b.type === 'social') && p['paddingX'] === undefined) {
        p['paddingX'] = 24
      }
      // Migrate legacy social links string → socialLinks array
      if (b.type === 'social') {
        if (!p['socialLinks'] && p['links']) {
          p['socialLinks'] = (p['links'] as string)
            .split('\n')
            .map((line: string) => line.trim())
            .filter(Boolean)
            .map((line: string) => {
              const sep = line.indexOf('|')
              return sep === -1
                ? { platform: line, href: '' }
                : { platform: line.slice(0, sep).trim(), href: line.slice(sep + 1).trim() }
            })
        }
        if (!p['socialLinks']) {
          p['socialLinks'] = [
            { platform: 'Twitter', href: 'https://twitter.com/example' },
            { platform: 'LinkedIn', href: 'https://www.linkedin.com/company/example' },
          ]
        }
        if (p['iconSize'] === undefined) p['iconSize'] = 20
        if (p['showLabels'] === undefined) p['showLabels'] = true
        if (p['iconColor'] === undefined) p['iconColor'] = '#2b7fe0'
        if (p['align'] === undefined) p['align'] = 'center'
        if (p['layout'] === undefined) p['layout'] = 'column'
      }
      if (b.type === 'twocol') {
        if (!Array.isArray(b.columns)) b.columns = [[], []]
        b.columns[0] = b.columns[0] ?? []
        b.columns[1] = b.columns[1] ?? []
        migrate(b.columns[0])
        migrate(b.columns[1])
      }
    }
  }
  migrate(doc.blocks)
  return doc
}
