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
  | 'footer'
  | 'raw'

export type Align = 'left' | 'center' | 'right'

export interface EmailDocSettings {
  subject: string
  preheader: string
  contentWidth: number
  outerBg: string
  contentBg: string
}

export interface HeaderProps {
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
}

export interface HeadingProps {
  text: string
  level: 1 | 2 | 3
  color: string
  align: Align
  fontFamily: string
  paddingY: number
}

export interface TextProps {
  content: string
  fontSize: number
  lineHeight: number
  fontFamily: string
  color: string
  align: Align
  linkColor: string
  paddingY: number
}

export interface ImageProps {
  src: string
  alt: string
  width: number
  align: Align
  link: string
  paddingY: number
}

export interface ButtonProps {
  label: string
  href: string
  bgColor: string
  textColor: string
  radius: number
  fullWidth: boolean
  width: number
  fontSize: number
  fontFamily: string
  paddingY: number
}

export interface SpacerProps {
  height: number
}

export interface DividerProps {
  color: string
  thickness: number
  paddingY: number
}

export interface SocialProps {
  links: string
  color: string
  fontSize: number
  fontFamily: string
  paddingY: number
}

export interface TwoColProps {
  ratio: '50-50' | '40-60' | '60-40'
  gap: number
  paddingY: number
}

export interface FooterProps {
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
  | (BlockBase & { type: 'raw'; props: RawProps })
  | (BlockBase & { type: 'twocol'; props: TwoColProps; columns: [Block[], Block[]] })

export interface EmailDoc {
  settings: EmailDocSettings
  blocks: Block[]
}

export const DEFAULT_FONT = 'Arial, Helvetica, sans-serif'
export const DEFAULT_LINK_COLOR = '#2b7fe0'
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
