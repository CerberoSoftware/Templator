import type { HeadingProps } from '../model'
import { DEFAULT_FONT, HEADING_SIZES } from '../model'
import { alignOf, normalizeColor, normalizeFontStack, paddingBottom, paddingTop, paddingX, px, styleOf } from '../htmlUtils'
import { ALIGN_OPTIONS, childTd, marker, COMMON_FIELDS, COMMON_DEFAULTS, outerTdStyle, parseBlockBg, type BlockDef } from './types'
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
    { key: 'paddingTop', label: 'Top padding', type: 'range', min: 0, max: 64, step: 2, unit: 'px' },
    { key: 'paddingBottom', label: 'Bottom padding', type: 'range', min: 0, max: 64, step: 2, unit: 'px' },
    { key: 'paddingX', label: 'Horizontal padding', type: 'range', min: 0, max: 64, step: 2, unit: 'px' },
    ...COMMON_FIELDS,
  ],
  defaults: (): HeadingProps => ({
    text: 'A clear, bold heading',
    level: 2,
    color: '#0f2540',
    align: 'left',
    fontFamily: DEFAULT_FONT,
    paddingTop: 12,
    paddingBottom: 12,
    paddingX: 24,
    ...COMMON_DEFAULTS,
  }),
  render: ({ props, id }: { props: HeadingProps; id: string }, ctx) => {
    // A <select> hands back its value as a string, and imported HTML can carry
    // any heading level, so normalise before indexing HEADING_SIZES.
    const level = (Number(props.level) || 2) as 1 | 2 | 3
    const tdStyle = outerTdStyle(`padding:${props.paddingTop}px ${props.paddingX}px ${props.paddingBottom}px;`, props, ctx.contentWidth)
    return `<tr${marker(id, ctx)}>
  <td class="et-heading" style="${tdStyle}">
    <h${level} class="et-h" style="margin:0;font-family:${props.fontFamily};font-size:${HEADING_SIZES[level] ?? 22}px;line-height:1.3;color:${props.color};text-align:${props.align};">${esc(props.text)}</h${level}>
  </td>
</tr>`
  },
  parse: (tr) => {
    const td = childTd(tr, 'et-heading')
    if (!td) return null
    // Match any h1/h2/h3, not just one carrying the `et-h` class render()
    // writes — a td already tagged `et-heading` (imported HTML, or an older
    // export) can have a plain heading tag with no such class.
    const heading = td.querySelector('h1, h2, h3')
    if (!heading) return null
    const level = parseInt(heading.tagName.slice(1), 10) as 1 | 2 | 3
    const st = styleOf(heading)
    const tdSt = styleOf(td)
    return {
      text: heading.textContent ?? '',
      level,
      color: normalizeColor(st.color || '#0f2540'),
      align: alignOf(heading, 'left') as HeadingProps['align'],
      fontFamily: normalizeFontStack(st.fontFamily, DEFAULT_FONT),
      paddingTop: paddingTop(tdSt.padding, 12),
      paddingBottom: paddingBottom(tdSt.padding, 12),
      paddingX: px(tdSt.paddingLeft, 0) || paddingX(tdSt.padding, 24),
      blockBg: parseBlockBg(td),
      blockRadius: 0,
      widthPct: 100,
    } satisfies HeadingProps
  },
}
