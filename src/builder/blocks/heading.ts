import type { HeadingProps } from '../model'
import { DEFAULT_FONT, HEADING_SIZES } from '../model'
import { alignOf, normalizeColor, paddingY, px, styleOf } from '../htmlUtils'
import { ALIGN_OPTIONS, childTd, marker, COMMON_FIELDS, COMMON_DEFAULTS, outerTdStyle, type BlockDef } from './types'
import { esc } from '../htmlUtils'

export const headingDef: BlockDef = {
  type: 'heading',
  label: 'Heading',
  category: 'Content',
  fields: [
    { key: 'text', label: 'Text', type: 'text', placeholder: 'Section heading' },
    { key: 'level', label: 'Level', type: 'select', options: [
      { value: '1', label: 'H1 — large' },
      { value: '2', label: 'H2 — medium' },
      { value: '3', label: 'H3 — small' },
    ] },
    { key: 'fontFamily', label: 'Font', type: 'font' },
    { key: 'color', label: 'Text color', type: 'color' },
    { key: 'align', label: 'Alignment', type: 'select', options: ALIGN_OPTIONS },
    { key: 'paddingY', label: 'Vertical padding', type: 'range', min: 0, max: 64, step: 2, unit: 'px' },
    { key: 'paddingX', label: 'Horizontal padding', type: 'range', min: 0, max: 64, step: 2, unit: 'px' },
    ...COMMON_FIELDS,
  ],
  defaults: (): HeadingProps => ({
    text: 'A clear, bold heading',
    level: 2,
    color: '#0f2540',
    align: 'left',
    fontFamily: DEFAULT_FONT,
    paddingY: 12,
    paddingX: 24,
    ...COMMON_DEFAULTS,
  }),
  render: ({ props, id }: { props: HeadingProps; id: string }, ctx) => {
    const tdStyle = outerTdStyle(`padding:${props.paddingY}px ${props.paddingX}px;`, props, ctx.contentWidth)
    return `<tr${marker(id, ctx)}>
  <td class="et-heading" style="${tdStyle}">
    <h${props.level} class="et-h" style="margin:0;font-family:${props.fontFamily};font-size:${HEADING_SIZES[props.level]}px;line-height:1.3;color:${props.color};text-align:${props.align};">${esc(props.text)}</h${props.level}>
  </td>
</tr>`
  },
  parse: (tr) => {
    const td = childTd(tr, 'et-heading')
    if (!td) return null
    const heading = td.querySelector('h1.et-h, h2.et-h, h3.et-h')
    if (!heading) return null
    const level = parseInt(heading.tagName.slice(1), 10) as 1 | 2 | 3
    const st = styleOf(heading)
    const tdSt = styleOf(td)
    return {
      text: heading.textContent ?? '',
      level,
      color: normalizeColor(st.color || '#0f2540'),
      align: alignOf(heading, 'left') as HeadingProps['align'],
      fontFamily: st.fontFamily || DEFAULT_FONT,
      paddingY: paddingY(tdSt.padding, 12),
      paddingX: px(tdSt.paddingLeft, 24),
      blockBg: 'transparent',
      blockRadius: 0,
    } satisfies HeadingProps
  },
}
