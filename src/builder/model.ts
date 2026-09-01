export type BlockType =
  | 'header'
  | 'heading'
  | 'text'
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
  align: Align
  paddingY: number
  paddingX: number
}

export interface HeadingProps extends CommonBlockProps {
  text: string
  level: 1 | 2 | 3
  color: string
  align: Align
  fontFamily: string
  paddingY: number
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
  paddingY: number
  paddingX: number
}

export interface ImageProps extends CommonBlockProps {
  src: string
  alt: string
  width: number
  align: Align
  link: string
  paddingY: number
  paddingX: number
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
  paddingY: number
  paddingX: number
}

export interface SpacerProps extends CommonBlockProps {
  height: number
  bg: string
}

export interface DividerProps extends CommonBlockProps {
  color: string
  thickness: number
  paddingY: number
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
  iconSize: number
  showLabels: boolean
  iconColor: string
  color: string
  fontSize: number
  fontFamily: string
  align: Align
  paddingY: number
  paddingX: number
}

export interface TwoColProps extends CommonBlockProps {
  ratio: '50-50' | '40-60' | '60-40'
  gap: number
  paddingY: number
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
  imagePosition: 'left' | 'right'
  gap: number
  paddingY: number
  paddingX: number
}

export interface FooterProps extends CommonBlockProps {
  content: string
  fontSize: number
  fontFamily: string
  color: string
  align: Align
  bgColor: string
  paddingY: number
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

export const DEFAULT_FONT = 'Arial, Helvetica, sans-serif'
export const DEFAULT_LINK_COLOR = '#2b7fe0'
export const DEFAULT_TEXT_COLOR = '#333333'
export const HEADING_SIZES: Record<1 | 2 | 3, number> = { 1: 28, 2: 22, 3: 17 }

export const WEB_SAFE_FONTS: Array<{ name: string; stack: string }> = [
  { name: 'Arial', stack: 'Arial, Helvetica, sans-serif' },
  { name: 'Helvetica', stack: 'Helvetica, Arial, sans-serif' },
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
 *  - back-fills fontFamily / textColor / linkColor on settings
 *  - back-fills blockBg / blockRadius / widthPct on every block
 *  - back-fills paddingX on footer / social blocks that lacked it
 *  - migrates legacy social `links` string → `socialLinks` array
 * Safe to call on already-current docs.
 */
export function migrateDoc(raw: unknown): EmailDoc {
  const doc = raw as EmailDoc
  const s = doc.settings as Record<string, unknown>

  // 5-C: rename outerBg → bodyBg
  if (s['outerBg'] !== undefined && s['bodyBg'] === undefined) {
    s['bodyBg'] = s['outerBg']
  }
  if (s['bodyBg'] === undefined) s['bodyBg'] = '#f4f8fc'

  // 5-C: rename contentBg → containerBg
  if (s['contentBg'] !== undefined && s['containerBg'] === undefined) {
    s['containerBg'] = s['contentBg']
  }
  if (s['containerBg'] === undefined) s['containerBg'] = '#ffffff'

  // Global typography defaults
  if (!s['fontFamily']) s['fontFamily'] = DEFAULT_FONT
  if (!s['textColor']) s['textColor'] = DEFAULT_TEXT_COLOR
  if (!s['linkColor']) s['linkColor'] = DEFAULT_LINK_COLOR

  // Block field back-fills
  const migrate = (blocks: Block[]): void => {
    for (const b of blocks) {
      const p = b.props as Record<string, unknown>
      if (p['blockBg'] === undefined) p['blockBg'] = 'transparent'
      if (p['blockRadius'] === undefined) p['blockRadius'] = 0
      if (p['widthPct'] === undefined) p['widthPct'] = 100
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
      }
      if (b.type === 'twocol') {
        migrate(b.columns[0])
        migrate(b.columns[1])
      }
    }
  }
  migrate(doc.blocks)
  return doc
}
