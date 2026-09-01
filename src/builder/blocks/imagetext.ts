import type { ImageTextProps } from '../model'
import { DEFAULT_FONT, DEFAULT_LINK_COLOR } from '../model'
import { alignOf, normalizeColor, numAttr, paddingY, px, renderRich, styleOf } from '../htmlUtils'
import { esc } from '../htmlUtils'
import { childTd, marker, COMMON_FIELDS, COMMON_DEFAULTS, outerTdStyle, type BlockDef, type RenderCtx } from './types'

export const imageTextDef: BlockDef = {
  type: 'image_text',
  label: 'Image + Text',
  category: 'Layout',
  fields: [
    { key: 'imgSrc', label: 'Image URL', type: 'url', placeholder: 'https://…' },
    { key: 'imgAlt', label: 'Image alt text', type: 'text' },
    { key: 'imgWidth', label: 'Image width', type: 'range', min: 60, max: 400, step: 4, unit: 'px' },
    { key: 'imagePosition', label: 'Image side', type: 'select', options: [
      { value: 'left', label: 'Left' },
      { value: 'right', label: 'Right' },
    ] },
    { key: 'text', label: 'Text', type: 'textarea', placeholder: 'Write your copy…', help: 'Supports **bold**, *italic*, [link](url)' },
    { key: 'fontSize', label: 'Font size', type: 'range', min: 10, max: 24, step: 1, unit: 'px' },
    { key: 'lineHeight', label: 'Line height', type: 'range', min: 1.1, max: 2.5, step: 0.1, unit: '×' },
    { key: 'fontFamily', label: 'Font', type: 'font' },
    { key: 'color', label: 'Text color', type: 'color' },
    { key: 'linkColor', label: 'Link color', type: 'color' },
    { key: 'gap', label: 'Gap', type: 'range', min: 0, max: 48, step: 2, unit: 'px' },
    { key: 'paddingY', label: 'Vertical padding', type: 'range', min: 0, max: 64, step: 2, unit: 'px' },
    { key: 'paddingX', label: 'Horizontal padding', type: 'range', min: 0, max: 64, step: 2, unit: 'px' },
    ...COMMON_FIELDS,
  ],
  defaults: (): ImageTextProps => ({
    imgSrc: '',
    imgAlt: 'Image',
    imgWidth: 200,
    text: 'Your compelling message goes here. Explain what makes your product or announcement special.',
    fontSize: 15,
    lineHeight: 1.6,
    fontFamily: DEFAULT_FONT,
    color: '#333333',
    linkColor: DEFAULT_LINK_COLOR,
    imagePosition: 'left',
    gap: 16,
    paddingY: 16,
    paddingX: 24,
    ...COMMON_DEFAULTS,
  }),
  render: (block: { props: ImageTextProps; id: string }, ctx: RenderCtx) => {
    const props = block.props
    const imgCell = props.imgSrc === ''
      ? `<div style="background-color:#e7eef6;border:1px dashed #b3cbe8;border-radius:6px;color:#5c7793;font-family:Arial;font-size:12px;padding:20px 8px;text-align:center;width:${props.imgWidth}px;">Image</div>`
      : `<img src="${esc(props.imgSrc)}" alt="${esc(props.imgAlt)}" width="${props.imgWidth}" style="display:block;width:${props.imgWidth}px;max-width:100%;height:auto;border:0;">`
    const textCell = renderRich(props.text, props.linkColor)
    const half = Math.round(props.gap / 2)
    const imgTd = `<td class="et-imgtext-img stack" valign="top" width="${props.imgWidth}" style="width:${props.imgWidth}px;padding-${props.imagePosition === 'left' ? 'right' : 'left'}:${half}px;">${imgCell}</td>`
    const textTd = `<td class="et-imgtext-text stack" valign="top" style="padding-${props.imagePosition === 'left' ? 'left' : 'right'}:${half}px;font-family:${props.fontFamily};font-size:${props.fontSize}px;line-height:${props.lineHeight};color:${props.color};">${textCell}</td>`
    const cells = props.imagePosition === 'left' ? `${imgTd}${textTd}` : `${textTd}${imgTd}`
    const tdStyle = outerTdStyle(`padding:${props.paddingY}px ${props.paddingX}px;`, props, ctx.contentWidth)
    return `<tr${marker(block.id, ctx)}>
  <td class="et-imgtext" style="${tdStyle}">
    <!--[if mso]><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><![endif]-->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
      <tr>
        ${cells}
      </tr>
    </table>
    <!--[if mso]></tr></table><![endif]-->
  </td>
</tr>`
  },
  parse: (tr) => {
    const td = childTd(tr, 'et-imgtext')
    if (!td) return null
    const imgTd = td.querySelector('td.et-imgtext-img') as HTMLElement | null
    const textTd = td.querySelector('td.et-imgtext-text') as HTMLElement | null
    if (!imgTd || !textTd) return null
    const img = imgTd.querySelector('img') as HTMLImageElement | null
    const tdSt = styleOf(td)
    const textSt = styleOf(textTd)
    const imgFirst = imgTd.compareDocumentPosition(textTd) & Node.DOCUMENT_POSITION_FOLLOWING
    return {
      imgSrc: img?.getAttribute('src') ?? '',
      imgAlt: img?.getAttribute('alt') ?? 'Image',
      imgWidth: img ? numAttr(img, 'width', 200) : 200,
      text: textTd.innerHTML ?? '',
      fontSize: px(textSt.fontSize, 15),
      lineHeight: parseFloat(textSt.lineHeight) || 1.6,
      fontFamily: textSt.fontFamily || DEFAULT_FONT,
      color: normalizeColor(textSt.color || '#333333'),
      linkColor: DEFAULT_LINK_COLOR,
      imagePosition: imgFirst ? 'left' : 'right',
      gap: px(imgTd.style.paddingRight || imgTd.style.paddingLeft, 16) * 2,
      paddingY: paddingY(tdSt.padding, 16),
      paddingX: px(tdSt.paddingLeft, 24),
      blockBg: 'transparent',
      blockRadius: 0,
      // Bug 1 fix: widthPct was missing, causing custom block width to be
      // lost on round-trips and component drops.
      widthPct: 100,
    } satisfies ImageTextProps
  },
}
