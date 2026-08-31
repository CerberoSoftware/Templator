import type { SpacerProps } from '../model'
import { px, styleOf } from '../htmlUtils'
import { childTd, marker, type BlockDef } from './types'

export const spacerDef: BlockDef = {
  type: 'spacer',
  label: 'Spacer',
  category: 'Layout',
  fields: [{ key: 'height', label: 'Height (px)', type: 'number', min: 4, max: 120, step: 4 }],
  defaults: (): SpacerProps => ({ height: 32 }),
  render: ({ props, id }: { props: SpacerProps; id: string }, ctx) => `<tr${marker(id, ctx)}>
  <td class="et-spacer" style="font-size:0;line-height:0;mso-line-height-rule:exactly;height:${props.height}px;">&#160;</td>
</tr>`,
  parse: (tr) => {
    const td = childTd(tr, 'et-spacer')
    if (!td) return null
    return { height: px(styleOf(td).height, 32) } satisfies SpacerProps
  },
}
