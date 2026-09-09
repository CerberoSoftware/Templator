import type { CalloutProps } from '../model'
import { DEFAULT_FONT, DEFAULT_LINK_COLOR } from '../model'
import {
  DEFAULT_LIST_ITEM_SPACING,
  DEFAULT_PARAGRAPH_SPACING,
  alignOf,
  esc,
  firstLinkColor,
  normalizeColor,
  normalizeFontStack,
  paddingBottom,
  paddingTop,
  paddingX,
  paddingY,
  parseRichContent,
  px,
  renderRich,
  styleOf,
} from '../htmlUtils'
import { ALIGN_OPTIONS, childTd, marker, COMMON_FIELDS, COMMON_DEFAULTS, outerTdStyle, parseBlockBg, type BlockDef } from './types'

/**
 * A bordered, accent-edged panel that sets one fact apart from the body copy —
 * a deadline, a promo code, the one number the email is about.
 *
 * It is a rich-text block wrapped in its own table so the border and radius
 * survive clients that ignore them on a <td>, with an optional eyebrow label
 * above the content.
 */
export const calloutDef: BlockDef = {
  type: 'callout',
  label: 'Callout card',
  category: 'Content',
  fields: [
    { key: 'label', label: 'Eyebrow label', type: 'text', placeholder: 'e.g. What happens next (optional)' },
    {
      key: 'content',
      label: 'Content',
      type: 'textarea',
      placeholder: 'The one thing this email is about…',
      help: 'Same markup as a Text block: **bold**, *italic*, [link](url), `- ` bullets.',
    },
    { key: 'accentColor', label: 'Accent colour', type: 'color', help: 'The thicker bar down the left edge.' },
    { key: 'bgColor', label: 'Background', type: 'color' },
    { key: 'borderColor', label: 'Border colour', type: 'color' },
    { key: 'radius', label: 'Corner radius', type: 'range', min: 0, max: 32, step: 1, unit: 'px' },
    { key: 'fontSize', label: 'Font size', type: 'range', min: 10, max: 32, step: 1, unit: 'px' },
    { key: 'lineHeight', label: 'Line height', type: 'range', min: 1.1, max: 2.5, step: 0.1, unit: '×' },
    { key: 'fontFamily', label: 'Font', type: 'font' },
    { key: 'color', label: 'Text color', type: 'color' },
    { key: 'linkColor', label: 'Link color', type: 'color' },
    { key: 'labelColor', label: 'Label colour', type: 'color' },
    { key: 'align', label: 'Alignment', type: 'select', options: ALIGN_OPTIONS },
    { key: 'innerPadding', label: 'Inner padding', type: 'range', min: 4, max: 40, step: 2, unit: 'px' },
    { key: 'paddingTop', label: 'Top padding', type: 'range', min: 0, max: 64, step: 2, unit: 'px' },
    { key: 'paddingBottom', label: 'Bottom padding', type: 'range', min: 0, max: 64, step: 2, unit: 'px' },
    { key: 'paddingX', label: 'Horizontal padding', type: 'range', min: 0, max: 64, step: 2, unit: 'px' },
    ...COMMON_FIELDS,
  ],
  defaults: (): CalloutProps => ({
    label: '',
    content: 'The one thing you want to stand out.',
    accentColor: DEFAULT_LINK_COLOR,
    bgColor: '#f4f8fc',
    borderColor: '#e7eef6',
    radius: 10,
    fontSize: 15,
    lineHeight: 1.6,
    fontFamily: DEFAULT_FONT,
    color: '#333333',
    linkColor: DEFAULT_LINK_COLOR,
    labelColor: DEFAULT_LINK_COLOR,
    align: 'left',
    innerPadding: 16,
    paddingTop: 10,
    paddingBottom: 10,
    paddingX: 24,
    ...COMMON_DEFAULTS,
  }),
  render: ({ props, id }: { props: CalloutProps; id: string }, ctx) => {
    const tdStyle = outerTdStyle(
      `padding:${props.paddingTop}px ${props.paddingX}px ${props.paddingBottom}px;`,
      props,
      ctx.contentWidth,
    )
    const accent =
      props.accentColor && props.accentColor !== 'transparent' ? `border-left:4px solid ${props.accentColor};` : ''
    const border =
      props.borderColor && props.borderColor !== 'transparent'
        ? `border:1px solid ${props.borderColor};${accent}`
        : accent
    const label =
      props.label === ''
        ? ''
        : `<p class="et-callout-label" style="margin:0 0 6px;font-family:${props.fontFamily};font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:${props.labelColor};">${esc(props.label)}</p>`
    return `<tr${marker(id, ctx)}>
  <td class="et-callout" style="${tdStyle}">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="et-callout-box" style="border-collapse:separate;${border}border-radius:${props.radius}px;background-color:${props.bgColor};">
      <tr><td class="et-callout-body" style="padding:${props.innerPadding}px ${props.innerPadding + 2}px;font-family:${props.fontFamily};font-size:${props.fontSize}px;line-height:${props.lineHeight};color:${props.color};text-align:${props.align};word-break:break-word;">${label}${renderRich(props.content, props.linkColor, DEFAULT_PARAGRAPH_SPACING, DEFAULT_LIST_ITEM_SPACING)}</td></tr>
    </table>
  </td>
</tr>`
  },
  parse: (tr) => {
    const td = childTd(tr, 'et-callout')
    if (!td) return null
    const box = td.querySelector('table.et-callout-box')
    const body = td.querySelector('td.et-callout-body')
    if (!box || !body) return null
    const boxSt = styleOf(box)
    const bodySt = styleOf(body)
    const tdSt = styleOf(td)
    const labelEl = body.querySelector('p.et-callout-label')
    const labelSt = labelEl ? styleOf(labelEl) : null
    // Detach the eyebrow before reading the body, or parseRichContent() would
    // fold it into the content as another paragraph. The node stays readable
    // once detached, and the parse document is a throwaway.
    if (labelEl) labelEl.remove()
    const accentMatch = /(\d+)px\s+solid\s+(.+)/.exec(boxSt.borderLeft || '')
    const borderMatch = /(\d+)px\s+solid\s+(.+)/.exec(boxSt.borderTop || '')
    return {
      label: labelEl?.textContent ?? '',
      content: parseRichContent(body),
      accentColor: accentMatch ? normalizeColor(accentMatch[2]) : 'transparent',
      bgColor: normalizeColor(boxSt.backgroundColor || '#f4f8fc'),
      borderColor: borderMatch ? normalizeColor(borderMatch[2]) : 'transparent',
      radius: px(boxSt.borderRadius, 10),
      fontSize: px(bodySt.fontSize, 15),
      lineHeight: parseFloat(bodySt.lineHeight) || 1.6,
      fontFamily: normalizeFontStack(bodySt.fontFamily, DEFAULT_FONT),
      color: normalizeColor(bodySt.color || '#333333'),
      linkColor: firstLinkColor(body, DEFAULT_LINK_COLOR),
      labelColor: labelSt ? normalizeColor(labelSt.color || DEFAULT_LINK_COLOR) : DEFAULT_LINK_COLOR,
      align: alignOf(body, 'left'),
      innerPadding: paddingY(bodySt.padding, 16),
      paddingTop: paddingTop(tdSt.padding, 10),
      paddingBottom: paddingBottom(tdSt.padding, 10),
      paddingX: px(tdSt.paddingLeft, 0) || paddingX(tdSt.padding, 24),
      blockBg: parseBlockBg(td),
      blockRadius: 0,
      widthPct: 100,
    } satisfies CalloutProps
  },
}
