import type { Block, BlockType } from '../model'
import { uid } from '../model'
import { headerDef } from './header'
import { headingDef } from './heading'
import { textDef } from './text'
import { imageDef } from './image'
import { buttonDef } from './button'
import { spacerDef } from './spacer'
import { dividerDef } from './divider'
import { socialDef } from './social'
import { footerDef } from './footer'
import { twoColDef } from './twocol'
import { rawDef } from './raw'
import type { BlockDef, ParseCtx, RenderCtx } from './types'

export type { BlockDef, FieldDef, RenderCtx, ParseCtx } from './types'
export { childTd } from './types'

export const REGISTRY: Record<BlockType, BlockDef> = {
  header: headerDef,
  heading: headingDef,
  text: textDef,
  image: imageDef,
  button: buttonDef,
  spacer: spacerDef,
  divider: dividerDef,
  social: socialDef,
  footer: footerDef,
  twocol: twoColDef,
  raw: rawDef,
}

export const REGISTRY_ORDER: BlockDef[] = [
  headerDef,
  headingDef,
  textDef,
  imageDef,
  buttonDef,
  spacerDef,
  dividerDef,
  socialDef,
  footerDef,
  twoColDef,
  rawDef,
]

export function createBlock(type: BlockType): Block {
  const def = REGISTRY[type]
  const props = def.defaults()
  const block = { id: uid(), type, props } as Block
  if (def.container) {
    ;(block as Extract<Block, { type: 'twocol' }>).columns = [[], []]
  }
  return block
}

export function makeRenderCtx(markers: boolean, contentWidth: number): RenderCtx {
  const ctx: RenderCtx = {
    markers,
    contentWidth,
    renderChild: (block: Block) => renderBlock(block, ctx),
  }
  return ctx
}

export function renderBlock(block: Block, ctx: RenderCtx): string {
  const def = REGISTRY[block.type]
  return def.render(block, ctx)
}

export function makeParseCtx(): ParseCtx {
  const ctx: ParseCtx = {
    parseRow: (tr: Element) => parseRow(tr, ctx),
  }
  return ctx
}

export function parseRow(tr: Element, ctx: ParseCtx): Block | null {
  const id = tr.getAttribute('data-et-block') ?? uid()
  for (const def of REGISTRY_ORDER) {
    const props = def.parse(tr, ctx)
    if (props !== null) {
      if (def.container) {
        const { columns, ...rest } = props as { columns: [Block[], Block[]] }
        const container = { id, type: def.type, props: rest } as Extract<Block, { type: 'twocol' }>
        container.columns = [columns[0] ?? [], columns[1] ?? []]
        return container
      }
      return { id, type: def.type, props } as Block
    }
  }
  return null
}
