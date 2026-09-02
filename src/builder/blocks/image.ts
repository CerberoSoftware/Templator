import type { ImageProps } from '../model'
import { alignOf, numAttr, paddingY, px, styleOf } from '../htmlUtils'
import { esc } from '../htmlUtils'
import {
  ALIGN_OPTIONS,
  childTd,
  marker,
  COMMON_FIELDS,
  COMMON_DEFAULTS,
  outerTdStyle,
  FADE_BOTTOM_MASK_CSS,
  FADE_BOTTOM_CLASS,
  type BlockDef,
} from './types'

export const imageDef: BlockDef = {
  type: 'image',
  label: 'Image',
  category: 'Media',
  fields: [
    { key: 'src', label: 'Image URL', type: 'url', placeholder: 'https://…' },
    { key: 'alt', label: 'Alt text', type: 'text', placeholder: 'Describe the image' },
    { key: 'width', label: 'Width', type: 'range', min: 20, max: 680, step: 4, unit: 'px' },
    { key: 'align', label: 'Alignment', type: 'select', options: ALIGN_OPTIONS },
    { key: 'link', label: 'Link URL', type: 'url', placeholder: 'https://… (optional)' },
    { key: 'fadeBottom', label: 'Fade bottom edge', type: 'toggle', help: 'Fade the image to transparent at the bottom' },
    { key: 'paddingY', label: 'Vertical padding', type: 'range', min: 0, max: 64, step: 2, unit: 'px' },
    { key: 'paddingX', label: 'Horizontal padding', type: 'range', min: 0, max: 64, step: 2, unit: 'px' },
    ...COMMON_FIELDS,
  ],
  defaults: (): ImageProps => ({
    src: '',
    alt: '',
    width: 552,
    align: 'center',
    link: '',
    paddingY: 8,
    paddingX: 0,
    fadeBottom: false,
    ...COMMON_DEFAULTS,
  }),
  render: ({ props, id }: { props: ImageProps; id: string }, ctx) => {
    const margin =
      props.align === 'center' ? 'margin:0 auto;' : props.align === 'right' ? 'margin:0 0 0 auto;' : ''
    const img =
      props.src === ''
        ? `<div class="et-img-placeholder" style="background-color:#e7eef6;border:1px dashed #b3cbe8;border-radius:6px;color:#5c7793;font-family:Arial;font-size:13px;padding:28px 12px;text-align:center;">Image placeholder — set an image URL</div>`
        : `<img src="${esc(props.src)}" alt="${esc(props.alt)}" width="${props.width}" class="et-img${props.fadeBottom ? ` ${FADE_BOTTOM_CLASS}` : ''}" style="display:block;${margin}width:${props.width}px;max-width:100%;height:auto;border:0;${props.fadeBottom ? FADE_BOTTOM_MASK_CSS : ''}">`
    const wrapped = props.link !== '' ? `<a href="${esc(props.link)}">${img}</a>` : img
    const tdStyle = outerTdStyle(`padding:${props.paddingY}px ${props.paddingX}px;`, props, ctx.contentWidth)
    return `<tr${marker(id, ctx)}>
  <td class="et-image" align="${props.align}" style="${tdStyle}">${wrapped}</td>
</tr>`
  },
  parse: (tr) => {
    const td = childTd(tr, 'et-image')
    if (!td) return null
    const img = td.querySelector('img.et-img') as HTMLImageElement | null
    // Bug 6 fix: when no src is set the renderer emits a placeholder <div>
    // rather than an <img>. Previously parse() returned null here, silently
    // dropping the entire block on import. Now we fall back to defaults so
    // the block is preserved with an empty src.
    const link = img
      ? ((img.parentElement?.tagName === 'A' ? img.parentElement.getAttribute('href') : '') ?? '')
      : ''
    const st = styleOf(td)
    return {
      src: img?.getAttribute('src') ?? '',
      alt: img?.getAttribute('alt') ?? '',
      width: img ? numAttr(img, 'width', 552) : 552,
      align: alignOf(td, 'center') as ImageProps['align'],
      link,
      fadeBottom: img?.classList.contains(FADE_BOTTOM_CLASS) ?? false,
      paddingY: paddingY(st.padding, 8),
      paddingX: px(st.paddingLeft, 0),
      blockBg: 'transparent',
      blockRadius: 0,
      widthPct: 100,
    } satisfies ImageProps
  },
}
