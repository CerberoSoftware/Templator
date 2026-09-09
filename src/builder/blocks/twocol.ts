import type { Block, TwoColProps } from '../model'
import { paddingBottom, paddingTop, paddingX, px, styleOf } from '../htmlUtils'
import { directRows } from '../parser'
import { childTd, colMarker, marker, COMMON_FIELDS, COMMON_DEFAULTS, outerTdStyle, parseBlockBg, type BlockDef, type ParseCtx, type RenderCtx } from './types'

const RATIOS: Record<TwoColProps['ratio'], [number, number]> = {
  '50-50': [50, 50],
  '40-60': [40, 60],
  '60-40': [60, 40],
}

function widthToRatio(w: number): TwoColProps['ratio'] {
  if (w <= 42) return '40-60'
  if (w >= 58) return '60-40'
  return '50-50'
}

function renderColumn(
  blocks: Block[],
  width: number,
  cls: string,
  innerPadding: string,
  id: string,
  col: number,
  ctx: RenderCtx,
): string {
  const rows = blocks.map((b) => ctx.renderChild(b)).join('\n')
  return `<table role="presentation" width="${width}%" align="left" cellpadding="0" cellspacing="0" border="0" class="et-col ${cls}" style="width:${width}%;max-width:${width}%;border-collapse:collapse;">
            <tr class="et-col-row"><td class="et-col-inner"${colMarker(id, col, ctx)} style="vertical-align:top;${innerPadding}">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="et-col-blocks">
${rows}
              </table>
            </td></tr>
          </table>`
}

export const twoColDef: BlockDef = {
  type: 'twocol',
  label: 'Two columns',
  category: 'Layout',
  container: true,
  fields: [
    { key: 'ratio', label: 'Column split', type: 'select', options: [
      { value: '50-50', label: '50 / 50' },
      { value: '40-60', label: '40 / 60' },
      { value: '60-40', label: '60 / 40' },
    ] },
    { key: 'gap', label: 'Gap', type: 'range', min: 0, max: 48, step: 2, unit: 'px' },
    { key: 'paddingTop', label: 'Top padding', type: 'range', min: 0, max: 64, step: 2, unit: 'px' },
    { key: 'paddingBottom', label: 'Bottom padding', type: 'range', min: 0, max: 64, step: 2, unit: 'px' },
    { key: 'paddingX', label: 'Horizontal padding', type: 'range', min: 0, max: 64, step: 2, unit: 'px' },
    ...COMMON_FIELDS,
  ],
  defaults: (): TwoColProps => ({
    ratio: '50-50',
    gap: 16,
    paddingTop: 8,
    paddingBottom: 8,
    paddingX: 24,
    ...COMMON_DEFAULTS,
  }),
  render: (block: Block & { type: 'twocol' }, ctx: RenderCtx) => {
    const props = block.props
    const [w1, w2] = RATIOS[props.ratio] ?? RATIOS['50-50']
    const half = Math.round(props.gap / 2)
    const tdStyle = outerTdStyle(`padding:${props.paddingTop}px ${props.paddingX}px ${props.paddingBottom}px;`, props, ctx.contentWidth)
    return `<tr${marker(block.id, ctx)}>
  <td class="et-twocol" style="${tdStyle}">
    <!--[if mso]><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td width="${w1}%" valign="top"><![endif]-->
    ${renderColumn(block.columns[0], w1, 'et-col1', `padding-right:${half}px;`, block.id, 0, ctx)}
    <!--[if mso]></td><td width="${w2}%" valign="top"><![endif]-->
    ${renderColumn(block.columns[1], w2, 'et-col2', `padding-left:${half}px;`, block.id, 1, ctx)}
    <!--[if mso]></td></tr></table><![endif]-->
  </td>
</tr>`
  },
  parse: (tr: Element, ctx: ParseCtx) => {
    const td = childTd(tr, 'et-twocol')
    if (!td) return null
    const col1 = td.querySelector('table.et-col1')
    const col2 = td.querySelector('table.et-col2')
    if (!col1 || !col2) return null
    const w1 = parseInt((col1.getAttribute('width') ?? '50'), 10)
    const inner1 = col1.querySelector('td.et-col-inner') as HTMLElement | null
    const inner2 = col2.querySelector('td.et-col-inner') as HTMLElement | null
    const st = styleOf(td)
    // Fix: use styleOf() helper instead of direct .style access so that the
    // style is read through HTMLElement in a consistent, type-safe way.
    const gap = Math.round(
      px(inner1 ? styleOf(inner1).paddingRight : '', 8) +
      px(inner2 ? styleOf(inner2).paddingLeft : '', 8),
    )
    const parseColumn = (col: Element): Block[] => {
      const blocksTable = col.querySelector('table.et-col-blocks')
      if (!blocksTable) return []
      const out: Block[] = []
      for (const row of directRows(blocksTable)) {
        const block = ctx.parseRow(row)
        if (block) out.push(block)
      }
      return out
    }
    return {
      ratio: widthToRatio(w1),
      gap,
      paddingTop: paddingTop(st.padding, 8),
      paddingBottom: paddingBottom(st.padding, 8),
      paddingX: px(st.paddingLeft, 0) || paddingX(st.padding, 24),
      blockBg: parseBlockBg(td),
      blockRadius: 0,
      widthPct: 100,
      columns: [parseColumn(col1), parseColumn(col2)],
    }
  },
}
