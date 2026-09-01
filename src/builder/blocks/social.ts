import type { SocialProps } from '../model'
import { DEFAULT_FONT } from '../model'
import { normalizeColor, paddingY, px, styleOf } from '../htmlUtils'
import { esc } from '../htmlUtils'
import { childTd, marker, COMMON_FIELDS, COMMON_DEFAULTS, outerTdStyle, type BlockDef } from './types'

export interface SocialEntry {
  label: string
  href: string
}

export function parseSocialLinks(links: string): SocialEntry[] {
  return links
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .map((line) => {
      const sep = line.indexOf('|')
      if (sep === -1) return { label: line, href: '' }
      return { label: line.slice(0, sep).trim(), href: line.slice(sep + 1).trim() }
    })
    .filter((entry) => entry.label !== '')
}

export const socialDef: BlockDef = {
  type: 'social',
  label: 'Social links',
  category: 'Structure',
  fields: [
    { key: 'links', label: 'Links', type: 'textarea', placeholder: 'Twitter|https://twitter.com/\u2026\nLinkedIn|https://linkedin.com/\u2026', help: 'One per line: Label|URL' },
    { key: 'color', label: 'Link color', type: 'color' },
    { key: 'fontSize', label: 'Font size', type: 'range', min: 10, max: 18, step: 1, unit: 'px' },
    { key: 'fontFamily', label: 'Font', type: 'font' },
    { key: 'paddingY', label: 'Vertical padding', type: 'range', min: 0, max: 64, step: 2, unit: 'px' },
    { key: 'paddingX', label: 'Horizontal padding', type: 'range', min: 0, max: 64, step: 2, unit: 'px' },
    ...COMMON_FIELDS,
  ],
  defaults: (): SocialProps => ({
    links: 'Twitter|https://twitter.com/example\nLinkedIn|https://www.linkedin.com/company/example',
    color: '#5c7793',
    fontSize: 13,
    fontFamily: DEFAULT_FONT,
    paddingY: 16,
    paddingX: 24,
    ...COMMON_DEFAULTS,
  }),
  render: ({ props, id }: { props: SocialProps; id: string }, ctx) => {
    const items = parseSocialLinks(props.links)
      .map(
        (entry) =>
          `<td class="et-social-item" style="padding:0 10px;font-family:${props.fontFamily};font-size:${props.fontSize}px;"><a href="${esc(entry.href)}" class="et-social-link" style="color:${props.color};text-decoration:none;">${esc(entry.label)}</a></td>`,
      )
      .join('')
    const tdStyle = outerTdStyle(`padding:${props.paddingY}px ${props.paddingX}px;`, props)
    return `<tr${marker(id, ctx)}>
  <td class="et-social" align="center" style="${tdStyle}">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="et-social-table" style="margin:0 auto;"><tr>${items}</tr></table>
  </td>
</tr>`
  },
  parse: (tr) => {
    const td = childTd(tr, 'et-social')
    if (!td) return null
    const items = [...td.querySelectorAll('.et-social-item')]
    if (items.length === 0) return null
    const links = items
      .map((item) => {
        const a = item.querySelector('a.et-social-link')
        if (!a) return ''
        return `${a.textContent ?? ''}|${a.getAttribute('href') ?? ''}`
      })
      .filter((line) => line !== '')
      .join('\n')
    const first = items[0].querySelector('a.et-social-link') as HTMLElement | null
    const st = first ? styleOf(first) : null
    const itemSt = styleOf(items[0])
    const tdSt = styleOf(td)
    return {
      links,
      color: st ? normalizeColor(st.color || '#5c7793') : '#5c7793',
      fontSize: parseFloat(itemSt.fontSize) || 13,
      fontFamily: itemSt.fontFamily || DEFAULT_FONT,
      paddingY: paddingY(tdSt.padding, 16),
      paddingX: px(tdSt.paddingLeft, 24),
      blockBg: 'transparent',
      blockRadius: 0,
    } satisfies SocialProps
  },
}
