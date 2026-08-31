import type { ImageProps } from '../model'
import { alignOf, numAttr, paddingY, styleOf } from '../htmlUtils'
import { esc } from '../htmlUtils'
import { ALIGN_OPTIONS, childTd, marker, type BlockDef } from './types'

export const imageDef: BlockDef = {
  type: 'image',
  label: 'Image',
  category: 'Media',
  fields: [
    { key: 'src', label: 'Image URL', type: 'url', placeholder: 'https://…' },
    { key: 'alt', label: 'Alt text', type: 'text', placeholder: 'Describe the image' },
    { key: 'width', label: 'Width (px)', type: 'number', min: 20, max: 680, step: 1 },
    { key: 'align', label: 'Alignment', type: 'select', options: ALIGN_OPTIONS },
    { key: 'link', label: 'Link URL', type: 'url', placeholder: 'https://… (optional)' },
    { key: 'paddingY', label: 'Vertical padding', type: 'number', min: 0, max: 64, step: 1 },
  ],
  defaults: (): ImageProps => ({
    src: '',
    alt: '',
    width: 552,
    align: 'center',
    link: '',
    paddingY: 8,
  }),
  render: ({ props, id }: { props: ImageProps; id: string }, ctx) => {
    const margin =
      props.align === 'center' ? 'margin:0 auto;' : props.align === 'right' ? 'margin:0 0 0 auto;' : ''
    const img =
      props.src === ''
        ? `<div class="et-img-placeholder" style="background-color:#e7eef6;border:1px dashed #b3cbe8;border-radius:6px;color:#5c7793;font-family:Arial;font-size:13px;padding:28px 12px;text-align:center;">Image placeholder — set an image URL</div>`
        : `<img src="${esc(props.src)}" alt="${esc(props.alt)}" width="${props.width}" class="et-img" style="display:block;${margin}width:${props.width}px;max-width:100%;height:auto;border:0;">`
    const wrapped = props.link !== '' ? `<a href="${esc(props.link)}">${img}</a>` : img
    return `<tr${marker(id, ctx)}>
  <td class="et-image" align="${props.align}" style="padding:${props.paddingY}px 24px;">${wrapped}</td>
</tr>`
  },
  parse: (tr) => {
    const td = childTd(tr, 'et-image')
    if (!td) return null
    const img = td.querySelector('img.et-img') as HTMLImageElement | null
    if (!img) return null
    const link = (img.parentElement?.tagName === 'A' ? img.parentElement.getAttribute('href') : '') ?? ''
    const st = styleOf(td)
    return {
      src: img.getAttribute('src') ?? '',
      alt: img.getAttribute('alt') ?? '',
      width: numAttr(img, 'width', 552),
      align: alignOf(td, 'center') as ImageProps['align'],
      link,
      paddingY: paddingY(st.padding, 8),
    } satisfies ImageProps
  },
}
