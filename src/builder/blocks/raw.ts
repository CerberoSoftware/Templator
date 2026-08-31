import type { RawProps } from '../model'
import { childTd, marker, type BlockDef } from './types'

export const rawDef: BlockDef = {
  type: 'raw',
  label: 'Raw HTML',
  category: 'Structure',
  fields: [
    { key: 'html', label: 'HTML', type: 'textarea', placeholder: '<p style="…">…</p>', help: 'Kept as-is on export. Use table-based markup for compatibility.' },
  ],
  defaults: (): RawProps => ({ html: '<p style="margin:0;font-family:Arial;font-size:14px;color:#333333;">Custom HTML block</p>' }),
  render: ({ props, id }: { props: RawProps; id: string }, ctx) => `<tr${marker(id, ctx)}>
  <td class="et-raw">${props.html}</td>
</tr>`,
  parse: (tr: Element) => {
    const td = childTd(tr, 'et-raw')
    if (!td) return null
    return { html: td.innerHTML.trim() } satisfies RawProps
  },
}
