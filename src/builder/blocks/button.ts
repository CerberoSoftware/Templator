import type { ButtonProps } from '../model'
import { DEFAULT_FONT } from '../model'
import { normalizeColor, paddingY, px, styleOf, alignOf } from '../htmlUtils'
import { esc } from '../htmlUtils'
import { ALIGN_OPTIONS, childTd, marker, COMMON_FIELDS, COMMON_DEFAULTS, outerTdStyle, parseBlockBg, type BlockDef } from './types'

const FONT_FIELD = { key: 'fontFamily', label: 'Font', type: 'font' } as const

export const buttonDef: BlockDef = {
  type: 'button',
  label: 'Button',
  category: 'Content',
  fields: [
    { key: 'label', label: 'Label', type: 'text', placeholder: 'Get started' },
    { key: 'href', label: 'Link URL', type: 'url', placeholder: 'https://…' },
    { key: 'bgColor', label: 'Button color', type: 'color' },
    { key: 'textColor', label: 'Text color', type: 'color' },
    { key: 'radius', label: 'Button radius', type: 'range', min: 0, max: 40, step: 1, unit: 'px' },
    { key: 'fullWidth', label: 'Full width', type: 'toggle' },
    { key: 'width', label: 'Width', type: 'range', min: 80, max: 560, step: 4, unit: 'px' },
    { key: 'height', label: 'Height', type: 'range', min: 32, max: 80, step: 2, unit: 'px' },
    { key: 'fontSize', label: 'Font size', type: 'range', min: 12, max: 24, step: 1, unit: 'px' },
    FONT_FIELD,
    { key: 'align', label: 'Alignment', type: 'select', options: ALIGN_OPTIONS },
    { key: 'paddingY', label: 'Vertical padding', type: 'range', min: 0, max: 64, step: 2, unit: 'px' },
    { key: 'paddingX', label: 'Horizontal padding', type: 'range', min: 0, max: 64, step: 2, unit: 'px' },
    ...COMMON_FIELDS,
  ],
  defaults: (): ButtonProps => ({
    label: 'Get started',
    href: 'https://example.com',
    bgColor: '#2b7fe0',
    textColor: '#ffffff',
    radius: 24,
    fullWidth: false,
    width: 200,
    height: 46,
    fontSize: 16,
    fontFamily: DEFAULT_FONT,
    align: 'center',
    paddingY: 12,
    paddingX: 24,
    ...COMMON_DEFAULTS,
  }),
  render: ({ props, id }: { props: ButtonProps; id: string }, ctx) => {
    const height = props.height
    const width = props.fullWidth ? ctx.contentWidth - props.paddingX * 2 : props.width
    const arc = Math.min(100, Math.round((props.radius / height) * 100))
    const widthStyle = props.fullWidth ? 'width:100%;' : `width:${props.width}px;`
    const tdStyle = outerTdStyle(
      `padding:${props.paddingY}px ${props.paddingX}px;`,
      props,
      ctx.contentWidth,
    )
    return `<tr${marker(id, ctx)}>
  <td class="et-btn-td" align="${props.align}" style="${tdStyle}">
    <!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${esc(props.href)}" style="height:${height}px;v-text-anchor:middle;width:${width}px;" arcsize="${arc}%" stroke="f" fillcolor="${props.bgColor}"><w:anchorlock/><center style="color:${props.textColor};font-family:${props.fontFamily};font-size:${props.fontSize}px;font-weight:bold;">${esc(props.label)}</center></v:roundrect>
    <![endif]-->
    <!--[if !mso]><!-- -->
    <a href="${esc(props.href)}" class="et-btn${props.fullWidth ? ' et-btn-full' : ''}" style="background-color:${props.bgColor};border-radius:${props.radius}px;color:${props.textColor};display:inline-block;font-family:${props.fontFamily};font-size:${props.fontSize}px;font-weight:bold;line-height:${height}px;text-align:center;text-decoration:none;${widthStyle}mso-padding-alt:0 20px;">${esc(props.label)}</a>
    <!--<![endif]-->
  </td>
</tr>`
  },
  parse: (tr) => {
    const td = childTd(tr, 'et-btn-td')
    if (!td) return null
    const a = td.querySelector('a.et-btn') as HTMLElement | null
    if (!a) return null
    const st = styleOf(a)
    const tdSt = styleOf(td)
    const fullWidth = a.classList.contains('et-btn-full') || st.width === '100%'
    const lineH = parseFloat(st.lineHeight) || 46
    return {
      label: a.textContent ?? '',
      href: a.getAttribute('href') ?? '',
      bgColor: normalizeColor(st.backgroundColor || '#2b7fe0'),
      textColor: normalizeColor(st.color || '#ffffff'),
      radius: px(st.borderRadius, 24),
      fullWidth,
      width: fullWidth ? 200 : px(st.width, 200),
      height: lineH,
      fontSize: px(st.fontSize, 16),
      fontFamily: st.fontFamily || DEFAULT_FONT,
      align: alignOf(td, 'center') as ButtonProps['align'],
      paddingY: paddingY(tdSt.padding, 12),
      paddingX: px(tdSt.paddingLeft, 24),
      blockBg: parseBlockBg(td),
      blockRadius: 0,
      widthPct: 100,
    } satisfies ButtonProps
  },
}
