import type { HeaderProps } from '../model'
import { DEFAULT_FONT } from '../model'
import { alignOf, normalizeColor, numAttr, paddingBottom, paddingTop, paddingX, px, styleOf } from '../htmlUtils'
import { esc } from '../htmlUtils'
import { ALIGN_OPTIONS, childTd, marker, COMMON_FIELDS, COMMON_DEFAULTS, outerTdStyle, type BlockDef } from './types'

/**
 * Build the background declarations for the header band.
 *
 * The gradient goes on `background-image`, never the `background` shorthand:
 * the shorthand resets `background-color`, so Outlook — which drops the
 * gradient — would be left with no colour at all, and the parser would read
 * the band's colour back as "initial".
 */
function headerBackground(props: HeaderProps): string {
  const solid = `background-color:${props.bgColor};`
  const end = props.bgColorEnd
  if (!end || end === 'transparent' || end.toLowerCase() === String(props.bgColor).toLowerCase()) return solid
  return `${solid}background-image:linear-gradient(135deg, ${props.bgColor}, ${end});`
}

/**
 * Read the final colour stop out of a `linear-gradient(...)` value.
 * The CSSOM re-serialises colours as `rgb(r, g, b)`, whose own commas rule out
 * a naive split, so match colour tokens and take the last one.
 */
function lastGradientColor(backgroundImage: string | null | undefined): string {
  const value = backgroundImage ?? ''
  if (!value.includes('linear-gradient')) return 'transparent'
  const stops = value.match(/rgba?\([^)]*\)|#[0-9a-fA-F]{3,8}/g)
  return stops && stops.length > 0 ? normalizeColor(stops[stops.length - 1]) : 'transparent'
}

export const headerDef: BlockDef = {
  type: 'header',
  label: 'Header',
  category: 'Structure',
  fields: [
    { key: 'logoUrl', label: 'Logo URL', type: 'url', placeholder: 'https://…' },
    { key: 'logoAlt', label: 'Logo alt text', type: 'text' },
    { key: 'logoWidth', label: 'Logo width', type: 'range', min: 20, max: 400, step: 1, unit: 'px' },
    { key: 'logoLink', label: 'Logo link URL', type: 'url', placeholder: 'https://… (optional)' },
    { key: 'tagline', label: 'Tagline', type: 'text', placeholder: 'e.g. Weekly digest' },
    { key: 'taglineColor', label: 'Tagline color', type: 'color' },
    { key: 'taglineSize', label: 'Tagline size', type: 'range', min: 10, max: 20, step: 1, unit: 'px' },
    { key: 'bgColor', label: 'Background', type: 'color' },
    {
      key: 'bgColorEnd',
      label: 'Gradient end',
      type: 'color',
      help: 'Set a second colour for a gradient band. Outlook falls back to the plain background.',
    },
    { key: 'align', label: 'Alignment', type: 'select', options: ALIGN_OPTIONS },
    { key: 'paddingTop', label: 'Top padding', type: 'range', min: 0, max: 64, step: 2, unit: 'px' },
    { key: 'paddingBottom', label: 'Bottom padding', type: 'range', min: 0, max: 64, step: 2, unit: 'px' },
    { key: 'paddingX', label: 'Horizontal padding', type: 'range', min: 0, max: 64, step: 2, unit: 'px' },
    ...COMMON_FIELDS,
  ],
  defaults: (): HeaderProps => ({
    logoUrl: '',
    logoAlt: 'Logo',
    logoWidth: 160,
    logoLink: '',
    tagline: '',
    taglineColor: '#5c7793',
    taglineSize: 13,
    bgColor: '#ffffff',
    bgColorEnd: 'transparent',
    align: 'center',
    paddingTop: 24,
    paddingBottom: 24,
    paddingX: 24,
    ...COMMON_DEFAULTS,
  }),
  render: ({ props, id }: { props: HeaderProps; id: string }, ctx) => {
    const margin =
      props.align === 'center' ? 'margin:0 auto;' : props.align === 'right' ? 'margin:0 0 0 auto;' : ''
    const logo =
      props.logoUrl === ''
        ? `<div class="et-logo-placeholder" style="background-color:#e7eef6;border:1px dashed #b3cbe8;border-radius:6px;color:#5c7793;font-family:Arial;font-size:13px;padding:20px 12px;text-align:center;">Logo placeholder — set a logo URL</div>`
        : `<img src="${esc(props.logoUrl)}" alt="${esc(props.logoAlt)}" width="${props.logoWidth}" class="et-header-logo" style="display:block;${margin}width:${props.logoWidth}px;max-width:100%;height:auto;border:0;">`
    const wrapped = props.logoLink !== '' ? `<a href="${esc(props.logoLink)}" style="text-decoration:none;">${logo}</a>` : logo
    const tagline =
      props.tagline === ''
        ? ''
        : `<p class="et-header-tag et-last" style="margin:8px 0 0;font-family:${DEFAULT_FONT};font-size:${props.taglineSize}px;line-height:1.4;color:${props.taglineColor};">${esc(props.tagline)}</p>`
    const tdStyle = outerTdStyle(
      `padding:${props.paddingTop}px ${props.paddingX}px ${props.paddingBottom}px;${headerBackground(props)}`,
      props,
      ctx.contentWidth,
    )
    return `<tr${marker(id, ctx)}>
  <td class="et-header" align="${props.align}" bgcolor="${props.bgColor}" style="${tdStyle}">${wrapped}${tagline}</td>
</tr>`
  },
  parse: (tr) => {
    const td = childTd(tr, 'et-header')
    if (!td) return null
    const img = td.querySelector('img.et-header-logo') as HTMLImageElement | null
    // Bug 6 fix: when no logo URL is set the renderer emits a placeholder
    // <div class="et-logo-placeholder"> instead of an <img>. Previously
    // parse() returned null here, silently dropping the whole block on
    // import. Now we fall back to default logo values so the block is
    // preserved with an empty logoUrl.
    const link = img
      ? ((img.parentElement?.tagName === 'A' ? img.parentElement.getAttribute('href') : '') ?? '')
      : ''
    const taglineEl = td.querySelector('p.et-header-tag') as HTMLElement | null
    const tagSt = taglineEl ? styleOf(taglineEl) : null
    const st = styleOf(td)
    return {
      logoUrl: img?.getAttribute('src') ?? '',
      logoAlt: img?.getAttribute('alt') ?? 'Logo',
      logoWidth: img ? numAttr(img, 'width', 160) : 160,
      logoLink: link,
      tagline: taglineEl?.textContent ?? '',
      taglineColor: tagSt ? normalizeColor(tagSt.color || '#5c7793') : '#5c7793',
      taglineSize: tagSt ? px(tagSt.fontSize, 13) : 13,
      bgColor: normalizeColor(st.backgroundColor || td.getAttribute('bgcolor') || '#ffffff'),
      bgColorEnd: lastGradientColor(st.backgroundImage),
      align: alignOf(td, 'center') as HeaderProps['align'],
      paddingTop: paddingTop(st.padding, 24),
      paddingBottom: paddingBottom(st.padding, 24),
      paddingX: px(st.paddingLeft, 0) || paddingX(st.padding, 24),
      blockBg: 'transparent',
      blockRadius: 0,
      widthPct: 100,
    } satisfies HeaderProps
  },
}
