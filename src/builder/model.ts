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
}

export interface EmailDocSettings {
  subject: string
  preheader: string
  contentWidth: number
  outerBg: string
  contentBg: string
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

export interface SocialProps extends CommonBlockProps {
  links: string
  color: string
  fontSize: number
  fontFamily: string
  paddingY: number
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
}

export interface RawProps {
  html: string
  blockBg: string
  blockRadius: number
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
  outerBg: '#f4f8fc',
  contentBg: '#ffffff',
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
 * Safe to call on already-current docs.
 */
export function migrateDoc(raw: unknown): EmailDoc {
  const doc = raw as EmailDoc
  // Settings migration: back-fill new fields
  const s = doc.settings as Partial<EmailDocSettings>
  if (!s.fontFamily) s.fontFamily = DEFAULT_FONT
  if (!s.textColor) s.textColor = DEFAULT_TEXT_COLOR
  if (!s.linkColor) s.linkColor = DEFAULT_LINK_COLOR
  // Block migration: back-fill blockBg / blockRadius on all blocks
  const migrate = (blocks: Block[]): void => {
    for (const b of blocks) {
      const p = b.props as Record<string, unknown>
      if (p['blockBg'] === undefined) p['blockBg'] = 'transparent'
      if (p['blockRadius'] === undefined) p['blockRadius'] = 0
      if (b.type === 'twocol') {
        migrate(b.columns[0])
        migrate(b.columns[1])
      }
    }
  }
  migrate(doc.blocks)
  return doc
}
