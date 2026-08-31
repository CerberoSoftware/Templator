import type { DividerProps } from '../model'
import { normalizeColor, paddingY, styleOf } from '../htmlUtils'
import { childTd, marker, type BlockDef } from './types'

export const dividerDef: BlockDef = {
  type: 'divider',
  label: 'Divider',
  category: 'Layout',
  fields: [
    { key: 'color', label: 'Line color', type: 'color' },
    { key: 'thickness', label: 'Thickness (px)', type: 'number', min: 1, max: 6, step: 1 },
    { key: 'paddingY', label: 'Vertical padding', type: 'number', min: 0, max: 64, step: 1 },
  ],
  defaults: (): DividerProps => ({ color: '#e7eef6', thickness: 2, paddingY: 16 }),
  render: ({ props, id }: { props: DividerProps; id: string }, ctx) => `<tr${marker(id, ctx)}>
  <td class="et-divider" style="padding:${props.paddingY}px 24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="et-divider-table"><tr><td style="border-top:${props.thickness}px solid ${props.color};font-size:0;line-height:0;">&#160;</td></tr></table>
  </td>
</tr>`,
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
      paddingY: paddingY(tdSt.padding, 16),
    } satisfies DividerProps
  },
}
