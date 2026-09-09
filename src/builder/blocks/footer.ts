import type { FooterProps } from '../model'
import { DEFAULT_FONT, DEFAULT_LINK_COLOR } from '../model'
import {
  DEFAULT_LIST_ITEM_SPACING,
  DEFAULT_PARAGRAPH_SPACING,
  alignOf,
  firstLinkUnderline,
  normalizeColor,
  normalizeFontStack,
  paddingBottom,
  paddingTop,
  paddingX,
  parseRichContent,
  renderRich,
  styleOf,
} from '../htmlUtils'
import { ALIGN_OPTIONS, childTd, marker, COMMON_FIELDS, COMMON_DEFAULTS, outerTdStyle, type BlockDef } from './types'

export const footerDef: BlockDef = {
  type: 'footer',
  label: 'Footer',
  category: 'Structure',
  fields: [
    { key: 'content', label: 'Content', type: 'textarea', placeholder: 'Company address, unsubscribe link…', help: 'Use {{unsubscribe_url}} or other merge tags where needed.' },
    { key: 'fontSize', label: 'Font size', type: 'range', min: 10, max: 16, step: 1, unit: 'px' },
    { key: 'fontFamily', label: 'Font', type: 'font' },
    { key: 'color', label: 'Text color', type: 'color' },
    { key: 'linkColor', label: 'Link color', type: 'color' },
    { key: 'linkUnderline', label: 'Underline links', type: 'toggle', help: 'Underline links' },
    { key: 'align', label: 'Alignment', type: 'select', options: ALIGN_OPTIONS },
    { key: 'bgColor', label: 'Background', type: 'color' },
    { key: 'paddingTop', label: 'Top padding', type: 'range', min: 0, max: 64, step: 2, unit: 'px' },
    { key: 'paddingBottom', label: 'Bottom padding', type: 'range', min: 0, max: 64, step: 2, unit: 'px' },
    { key: 'paddingX', label: 'Horizontal padding', type: 'range', min: 0, max: 64, step: 2, unit: 'px' },
    ...COMMON_FIELDS,
  ],
  defaults: (): FooterProps => ({
    content: 'You are receiving this because you signed up at example.com.\n\nUnsubscribe: [Unsubscribe now]({{unsubscribe_url}})',
    fontSize: 12,
    fontFamily: DEFAULT_FONT,
    color: '#5c7793',
    linkColor: DEFAULT_LINK_COLOR,
    linkUnderline: true,
    align: 'center',
    bgColor: '#f4f8fc',
    paddingTop: 20,
    paddingBottom: 20,
    paddingX: 24,
    ...COMMON_DEFAULTS,
  }),
  render: ({ props, id }: { props: FooterProps; id: string }, ctx) => {
    const tdStyle = outerTdStyle(
      `padding:${props.paddingTop}px ${props.paddingX}px ${props.paddingBottom}px;background-color:${props.bgColor};font-family:${props.fontFamily};font-size:${props.fontSize}px;line-height:1.5;color:${props.color};text-align:${props.align};word-break:break-word;`,
      props,
      ctx.contentWidth,
    )
    return `<tr${marker(id, ctx)}>
  <td class="et-footer" bgcolor="${props.bgColor}" style="${tdStyle}">
    ${renderRich(props.content, props.linkColor ?? props.color, DEFAULT_PARAGRAPH_SPACING, DEFAULT_LIST_ITEM_SPACING, props.linkUnderline)}
  </td>
</tr>`
  },
  parse: (tr) => {
    const td = childTd(tr, 'et-footer')
    if (!td) return null
    const st = styleOf(td)
    const paddingShorthand = st.padding
    const firstLink = td.querySelector('a.et-link')
    return {
      content: parseRichContent(td),
      fontSize: parseFloat(st.fontSize) || 12,
      fontFamily: normalizeFontStack(st.fontFamily, DEFAULT_FONT),
      color: normalizeColor(st.color || '#5c7793'),
      linkColor: firstLink ? normalizeColor(styleOf(firstLink).color || DEFAULT_LINK_COLOR) : DEFAULT_LINK_COLOR,
      linkUnderline: firstLinkUnderline(td, true),
      align: alignOf(td, 'center') as FooterProps['align'],
      bgColor: normalizeColor(st.backgroundColor || td.getAttribute('bgcolor') || '#f4f8fc'),
      paddingTop: paddingTop(paddingShorthand, 20),
      paddingBottom: paddingBottom(paddingShorthand, 20),
      paddingX: paddingX(paddingShorthand, 24),
      blockBg: 'transparent',
      blockRadius: 0,
      widthPct: 100,
    } satisfies FooterProps
  },
}
