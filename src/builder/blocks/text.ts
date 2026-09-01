import type { TextProps } from '../model'
import { DEFAULT_FONT, DEFAULT_LINK_COLOR } from '../model'
import {
  alignOf,
  firstLinkColor,
  normalizeColor,
  paddingY,
  parseRichContent,
  px,
  renderRich,
  styleOf,
} from '../htmlUtils'
import { ALIGN_OPTIONS, childTd, marker, COMMON_FIELDS, COMMON_DEFAULTS, outerTdStyle, type BlockDef } from './types'

export const textDef: BlockDef = {
  type: 'text',
  label: 'Text',
  category: 'Content',
  fields: [
    { key: 'content', label: 'Content', type: 'textarea', placeholder: 'Write your message…', help: 'Blank line = new paragraph. **bold**, *italic*, [text](https://example.com)' },
    { key: 'fontSize', label: 'Font size', type: 'range', min: 10, max: 32, step: 1, unit: 'px' },
    { key: 'lineHeight', label: 'Line height', type: 'range', min: 1.1, max: 2.5, step: 0.1, unit: '×' },
    { key: 'fontFamily', label: 'Font', type: 'font' },
    { key: 'color', label: 'Text color', type: 'color' },
    { key: 'linkColor', label: 'Link color', type: 'color' },
    { key: 'align', label: 'Alignment', type: 'select', options: ALIGN_OPTIONS },
    { key: 'paddingY', label: 'Vertical padding', type: 'range', min: 0, max: 64, step: 2, unit: 'px' },
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
    paddingY: 12,
    paddingX: 24,
    ...COMMON_DEFAULTS,
  }),
  render: ({ props, id }: { props: TextProps; id: string }, ctx) => {
    const tdStyle = outerTdStyle(
      `padding:${props.paddingY}px ${props.paddingX}px;font-family:${props.fontFamily};font-size:${props.fontSize}px;line-height:${props.lineHeight};color:${props.color};text-align:${props.align};`,
      props,
      ctx.contentWidth,
    )
    return `<tr${marker(id, ctx)}>
  <td class="et-text" style="${tdStyle}">
    ${renderRich(props.content, props.linkColor)}
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
      fontFamily: st.fontFamily || DEFAULT_FONT,
      color: normalizeColor(st.color || '#333333'),
      align: alignOf(td, 'left'),
      linkColor: firstLinkColor(td, DEFAULT_LINK_COLOR),
      paddingY: paddingY(st.padding, 12),
      paddingX: px(st.paddingLeft, 24),
      blockBg: 'transparent',
      blockRadius: 0,
      widthPct: 100,
    } satisfies TextProps
  },
}
