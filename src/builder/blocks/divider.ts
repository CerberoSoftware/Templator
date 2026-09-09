import type { DividerProps } from '../model'
import { normalizeColor, paddingBottom, paddingTop, paddingX, px, styleOf } from '../htmlUtils'
import { childTd, marker, COMMON_FIELDS, COMMON_DEFAULTS, outerTdStyle, parseBlockBg, type BlockDef } from './types'

export const dividerDef: BlockDef = {
  type: 'divider',
  label: 'Divider',
  category: 'Layout',
  fields: [
    { key: 'color', label: 'Line color', type: 'color' },
    { key: 'thickness', label: 'Thickness', type: 'range', min: 1, max: 8, step: 1, unit: 'px' },
    { key: 'paddingTop', label: 'Top padding', type: 'range', min: 0, max: 64, step: 2, unit: 'px' },
    { key: 'paddingBottom', label: 'Bottom padding', type: 'range', min: 0, max: 64, step: 2, unit: 'px' },
    { key: 'paddingX', label: 'Horizontal padding', type: 'range', min: 0, max: 64, step: 2, unit: 'px' },
    ...COMMON_FIELDS,
  ],
  defaults: (): DividerProps => ({
    color: '#e7eef6',
    thickness: 2,
    paddingTop: 16,
    paddingBottom: 16,
    paddingX: 24,
    ...COMMON_DEFAULTS,
  }),
  render: ({ props, id }: { props: DividerProps; id: string }, ctx) => {
    const tdStyle = outerTdStyle(`padding:${props.paddingTop}px ${props.paddingX}px ${props.paddingBottom}px;`, props, ctx.contentWidth)
    return `<tr${marker(id, ctx)}>
  <td class="et-divider" style="${tdStyle}">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="et-divider-table"><tr><td style="border-top:${props.thickness}px solid ${props.color};font-size:0;line-height:0;">&#160;</td></tr></table>
  </td>
</tr>`
  },
  parse: (tr) => {
    const td = childTd(tr, 'et-divider')
    if (!td) return null
    const inner = td.querySelector('.et-divider-table td')
    if (!inner) return null
    const border = styleOf(inner).borderTop || ''
    const m = /(\d+)px\s+solid\s+(.+)/.exec(border)
    const tdSt = styleOf(td)
    return {
      color: m ? normalizeColor(m[2]) : '#e7eef6',
      thickness: m ? parseInt(m[1], 10) : 2,
      paddingTop: paddingTop(tdSt.padding, 16),
      paddingBottom: paddingBottom(tdSt.padding, 16),
      paddingX: px(tdSt.paddingLeft, 0) || paddingX(tdSt.padding, 24),
      blockBg: parseBlockBg(td),
      blockRadius: 0,
      widthPct: 100,
    } satisfies DividerProps
  },
}
