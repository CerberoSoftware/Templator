import type { ButtonProps } from '../model'
import { DEFAULT_FONT } from '../model'
import { normalizeColor, paddingY, px, styleOf } from '../htmlUtils'
import { esc } from '../htmlUtils'
import { childTd, marker, type BlockDef } from './types'

const FONT_FIELD = { key: 'fontFamily', label: 'Font', type: 'font' } as const

export const buttonDef: BlockDef = {
  type: 'button',
  label: 'Button',
  category: 'Content',
  fields: [
    { key: 'label', label: 'Label', type: 'text', placeholder: 'Get started' },
    { key: 'href', label: 'Link URL', type: 'url', placeholder: 'https://…' },
    { key: 'bgColor', label: 'Background', type: 'color' },
    { key: 'textColor', label: 'Text color', type: 'color' },
    { key: 'radius', label: 'Corner radius', type: 'number', min: 0, max: 40, step: 1 },
    { key: 'fullWidth', label: 'Full width', type: 'toggle' },
    { key: 'width', label: 'Width (px)', type: 'number', min: 80, max: 680, step: 1 },
    { key: 'fontSize', label: 'Font size', type: 'number', min: 12, max: 24, step: 1 },
    FONT_FIELD,
    { key: 'paddingY', label: 'Vertical padding', type: 'number', min: 0, max: 64, step: 1 },
  ],
  defaults: (): ButtonProps => ({
    label: 'Get started',
    href: 'https://example.com',
    bgColor: '#2b7fe0',
    textColor: '#ffffff',
    radius: 24,
    fullWidth: false,
    width: 200,
    fontSize: 16,
    fontFamily: DEFAULT_FONT,
    paddingY: 12,
  }),
  render: ({ props, id }: { props: ButtonProps; id: string }, ctx) => {
    const height = Math.max(32, Math.round(props.fontSize * 2.2))
    const width = props.fullWidth ? ctx.contentWidth - 48 : props.width
    const vmlWidth = props.fullWidth
      ? width
      : Math.max(120, Math.round(props.label.length * props.fontSize * 0.62 + props.fontSize * 2))
    const arc = Math.min(100, Math.round((props.radius / height) * 100))
    const widthStyle = props.fullWidth ? 'width:100%;' : `width:${props.width}px;`
    return `<tr${marker(id, ctx)}>
  <td class="et-btn-td" align="center" style="padding:${props.paddingY}px 24px;">
    <!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${esc(props.href)}" style="height:${height}px;v-text-anchor:middle;width:${vmlWidth}px;" arcsize="${arc}%" stroke="f" fillcolor="${props.bgColor}"><w:anchorlock/><center style="color:${props.textColor};font-family:${props.fontFamily};font-size:${props.fontSize}px;font-weight:bold;">${esc(props.label)}</center></v:roundrect>
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
    return {
      label: a.textContent ?? '',
      href: a.getAttribute('href') ?? '',
      bgColor: normalizeColor(st.backgroundColor || '#2b7fe0'),
      textColor: normalizeColor(st.color || '#ffffff'),
      radius: px(st.borderRadius, 24),
      fullWidth,
      width: fullWidth ? 200 : px(st.width, 200),
      fontSize: px(st.fontSize, 16),
      fontFamily: st.fontFamily || DEFAULT_FONT,
      paddingY: paddingY(tdSt.padding, 12),
    } satisfies ButtonProps
  },
}
