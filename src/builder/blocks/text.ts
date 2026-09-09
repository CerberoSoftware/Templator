import type { TextProps } from '../model'
import { DEFAULT_FONT, DEFAULT_LINK_COLOR } from '../model'
import {
  DEFAULT_LIST_ITEM_SPACING,
  DEFAULT_PARAGRAPH_SPACING,
  alignOf,
  firstLinkColor,
  firstLinkUnderline,
  listItemSpacing,
  normalizeColor,
  normalizeFontStack,
  paddingBottom,
  paddingTop,
  paddingX,
  paragraphSpacing,
  parseRichContent,
  px,
  renderRich,
  styleOf,
} from '../htmlUtils'
import { ALIGN_OPTIONS, childTd, marker, COMMON_FIELDS, COMMON_DEFAULTS, outerTdStyle, parseBlockBg, type BlockDef } from './types'

export const textDef: BlockDef = {
  type: 'text',
  label: 'Text',
  category: 'Content',
  fields: [
    { key: 'content', label: 'Content', type: 'textarea', placeholder: 'Write your message…', help: 'Blank line = new paragraph. `- item` = bullets, `1. item` = numbered. **bold**, *italic*, __underline__, ~~strike~~, [link](https://example.com) — or use the toolbar above' },
    { key: 'fontSize', label: 'Font size', type: 'range', min: 10, max: 32, step: 1, unit: 'px' },
    { key: 'lineHeight', label: 'Line height', type: 'range', min: 1.1, max: 2.5, step: 0.1, unit: '×' },
    { key: 'paragraphSpacing', label: 'Paragraph spacing', type: 'range', min: 0, max: 48, step: 2, unit: 'px' },
    { key: 'listItemSpacing', label: 'List item spacing', type: 'range', min: 0, max: 32, step: 2, unit: 'px', help: 'Gap between bullets or numbered list items.' },
    { key: 'fontFamily', label: 'Font', type: 'font' },
    { key: 'color', label: 'Text color', type: 'color' },
    { key: 'linkColor', label: 'Link color', type: 'color' },
    { key: 'linkUnderline', label: 'Underline links', type: 'toggle', help: 'Underline links' },
    { key: 'align', label: 'Alignment', type: 'select', options: ALIGN_OPTIONS },
    { key: 'paddingTop', label: 'Top padding', type: 'range', min: 0, max: 64, step: 2, unit: 'px' },
    { key: 'paddingBottom', label: 'Bottom padding', type: 'range', min: 0, max: 64, step: 2, unit: 'px' },
    { key: 'paddingX', label: 'Horizontal padding', type: 'range', min: 0, max: 64, step: 2, unit: 'px' },
    ...COMMON_FIELDS,
  ],
  defaults: (): TextProps => ({
    content: 'Write something compelling here. Blank lines create paragraphs.',
    fontSize: 15,
    lineHeight: 1.6,
    fontFamily: DEFAULT_FONT,
    color: '#333333',
    align: 'left',
    linkColor: DEFAULT_LINK_COLOR,
    linkUnderline: true,
    paragraphSpacing: DEFAULT_PARAGRAPH_SPACING,
    listItemSpacing: DEFAULT_LIST_ITEM_SPACING,
    paddingTop: 12,
    paddingBottom: 12,
    paddingX: 24,
    ...COMMON_DEFAULTS,
  }),
  render: ({ props, id }: { props: TextProps; id: string }, ctx) => {
    const tdStyle = outerTdStyle(
      `padding:${props.paddingTop}px ${props.paddingX}px ${props.paddingBottom}px;font-family:${props.fontFamily};font-size:${props.fontSize}px;line-height:${props.lineHeight};color:${props.color};text-align:${props.align};word-break:break-word;`,
      props,
      ctx.contentWidth,
    )
    return `<tr${marker(id, ctx)}>
  <td class="et-text" style="${tdStyle}">
    ${renderRich(props.content, props.linkColor, props.paragraphSpacing, props.listItemSpacing, props.linkUnderline)}
  </td>
</tr>`
  },
  parse: (tr) => {
    const td = childTd(tr, 'et-text')
    if (!td) return null
    const st = styleOf(td)
    return {
      content: parseRichContent(td),
      fontSize: px(st.fontSize, 15),
      lineHeight: parseFloat(st.lineHeight) || 1.6,
      fontFamily: normalizeFontStack(st.fontFamily, DEFAULT_FONT),
      color: normalizeColor(st.color || '#333333'),
      align: alignOf(td, 'left'),
      linkColor: firstLinkColor(td, DEFAULT_LINK_COLOR),
      linkUnderline: firstLinkUnderline(td, true),
      paragraphSpacing: paragraphSpacing(td, DEFAULT_PARAGRAPH_SPACING),
      listItemSpacing: listItemSpacing(td, DEFAULT_LIST_ITEM_SPACING),
      paddingTop: paddingTop(st.padding, 12),
      paddingBottom: paddingBottom(st.padding, 12),
      paddingX: px(st.paddingLeft, 0) || paddingX(st.padding, 24),
      blockBg: parseBlockBg(td),
      blockRadius: 0,
      widthPct: 100,
    } satisfies TextProps
  },
}
