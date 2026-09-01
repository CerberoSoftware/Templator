import type { SpacerProps } from '../model'
import { px, styleOf } from '../htmlUtils'
import { childTd, marker, COMMON_DEFAULTS, type BlockDef } from './types'

export const spacerDef: BlockDef = {
  type: 'spacer',
  label: 'Spacer',
  category: 'Layout',
  fields: [
    { key: 'height', label: 'Height', type: 'range', min: 4, max: 120, step: 4, unit: 'px' },
    { key: 'bg', label: 'Background', type: 'color' },
    // blockRadius intentionally omitted for spacer — a radius on an invisible block is confusing
  ],
  defaults: (): SpacerProps => ({
    height: 32,
    bg: 'transparent',
    ...COMMON_DEFAULTS,
  }),
  render: ({ props, id }: { props: SpacerProps; id: string }, ctx) => {
    const bgStyle = props.bg && props.bg !== 'transparent' ? `background-color:${props.bg};` : ''
    return `<tr${marker(id, ctx)}>
  <td class="et-spacer" style="font-size:0;line-height:0;mso-line-height-rule:exactly;height:${props.height}px;${bgStyle}">&#160;</td>
</tr>`
  },
  parse: (tr) => {
    const td = childTd(tr, 'et-spacer')
    if (!td) return null
    const st = styleOf(td)
    return {
      height: px(st.height, 32),
      bg: st.backgroundColor || 'transparent',
      blockBg: 'transparent',
      blockRadius: 0,
    } satisfies SpacerProps
  },
}
