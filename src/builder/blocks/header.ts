import type { HeaderProps } from '../model'
import { DEFAULT_FONT } from '../model'
import { alignOf, normalizeColor, numAttr, paddingY, px, styleOf } from '../htmlUtils'
import { esc } from '../htmlUtils'
import { ALIGN_OPTIONS, childTd, marker, COMMON_FIELDS, COMMON_DEFAULTS, outerTdStyle, type BlockDef } from './types'

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
    { key: 'align', label: 'Alignment', type: 'select', options: ALIGN_OPTIONS },
    { key: 'paddingY', label: 'Vertical padding', type: 'range', min: 0, max: 64, step: 2, unit: 'px' },
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
    align: 'center',
    paddingY: 24,
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
    const wrapped = props.logoLink !== '' ? `<a href="${esc(props.logoLink)}">${logo}</a>` : logo
    const tagline =
      props.tagline === ''
        ? ''
        : `<p class="et-header-tag et-last" style="margin:8px 0 0;font-family:${DEFAULT_FONT};font-size:${props.taglineSize}px;line-height:1.4;color:${props.taglineColor};">${esc(props.tagline)}</p>`
    const tdStyle = outerTdStyle(
      `padding:${props.paddingY}px ${props.paddingX}px;background-color:${props.bgColor};`,
      props,
    )
    return `<tr${marker(id, ctx)}>
  <td class="et-header" align="${props.align}" bgcolor="${props.bgColor}" style="${tdStyle}">${wrapped}${tagline}</td>
</tr>`
  },
  parse: (tr) => {
    const td = childTd(tr, 'et-header')
    if (!td) return null
    const img = td.querySelector('img.et-header-logo') as HTMLImageElement | null
    if (!img) return null
    const link = (img.parentElement?.tagName === 'A' ? img.parentElement.getAttribute('href') : '') ?? ''
    const taglineEl = td.querySelector('p.et-header-tag') as HTMLElement | null
    const tagSt = taglineEl ? styleOf(taglineEl) : null
    const st = styleOf(td)
    return {
      logoUrl: img.getAttribute('src') ?? '',
      logoAlt: img.getAttribute('alt') ?? 'Logo',
      logoWidth: numAttr(img, 'width', 160),
      logoLink: link,
      tagline: taglineEl?.textContent ?? '',
      taglineColor: tagSt ? normalizeColor(tagSt.color || '#5c7793') : '#5c7793',
      taglineSize: tagSt ? px(tagSt.fontSize, 13) : 13,
      bgColor: normalizeColor(st.backgroundColor || td.getAttribute('bgcolor') || '#ffffff'),
      align: alignOf(td, 'center') as HeaderProps['align'],
      paddingY: paddingY(st.padding, 24),
      paddingX: px(st.paddingLeft, 24),
      blockBg: 'transparent',
      blockRadius: 0,
    } satisfies HeaderProps
  },
}
