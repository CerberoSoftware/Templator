import type { FooterProps } from '../model'
import { DEFAULT_FONT } from '../model'
import { alignOf, normalizeColor, paddingY, parseRichContent, px, renderRich, styleOf } from '../htmlUtils'
import { ALIGN_OPTIONS, childTd, marker, COMMON_FIELDS, COMMON_DEFAULTS, outerTdStyle, type BlockDef } from './types'

export const footerDef: BlockDef = {
  type: 'footer',
  label: 'Footer',
  category: 'Structure',
  fields: [
    { key: 'content', label: 'Content', type: 'textarea', placeholder: 'Company address, unsubscribe link\u2026', help: 'Use {{unsubscribe_url}} or other merge tags where needed.' },
    { key: 'fontSize', label: 'Font size', type: 'range', min: 10, max: 16, step: 1, unit: 'px' },
    { key: 'fontFamily', label: 'Font', type: 'font' },
    { key: 'color', label: 'Text color', type: 'color' },
    { key: 'align', label: 'Alignment', type: 'select', options: ALIGN_OPTIONS },
    { key: 'bgColor', label: 'Background', type: 'color' },
    { key: 'paddingY', label: 'Vertical padding', type: 'range', min: 0, max: 64, step: 2, unit: 'px' },
    { key: 'paddingX', label: 'Horizontal padding', type: 'range', min: 0, max: 64, step: 2, unit: 'px' },
    ...COMMON_FIELDS,
  ],
  defaults: (): FooterProps => ({
    content: 'You are receiving this because you signed up at example.com.\n\nUnsubscribe: [Unsubscribe now]({{unsubscribe_url}})',
    fontSize: 12,
    fontFamily: DEFAULT_FONT,
    color: '#5c7793',
    align: 'center',
    bgColor: '#f4f8fc',
    paddingY: 20,
    paddingX: 24,
    ...COMMON_DEFAULTS,
  }),
  render: ({ props, id }: { props: FooterProps; id: string }, ctx) => {
    const tdStyle = outerTdStyle(
      `padding:${props.paddingY}px ${props.paddingX}px;background-color:${props.bgColor};font-family:${props.fontFamily};font-size:${props.fontSize}px;line-height:1.5;color:${props.color};text-align:${props.align};`,
      props,
    )
    return `<tr${marker(id, ctx)}>
  <td class="et-footer" bgcolor="${props.bgColor}" style="${tdStyle}">
    ${renderRich(props.content, props.color)}
  </td>
</tr>`
  },
  parse: (tr) => {
    const td = childTd(tr, 'et-footer')
    if (!td) return null
    const st = styleOf(td)
    return {
      content: parseRichContent(td),
      fontSize: parseFloat(st.fontSize) || 12,
      fontFamily: st.fontFamily || DEFAULT_FONT,
      color: normalizeColor(st.color || '#5c7793'),
      align: alignOf(td, 'center') as FooterProps['align'],
      bgColor: normalizeColor(st.backgroundColor || td.getAttribute('bgcolor') || '#f4f8fc'),
      paddingY: paddingY(st.padding, 20),
      paddingX: px(st.paddingLeft, 24),
      blockBg: 'transparent',
      blockRadius: 0,
    } satisfies FooterProps
  },
}
