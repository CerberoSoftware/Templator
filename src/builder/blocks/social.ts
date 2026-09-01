import type { SocialProps, SocialLink } from '../model'
import { DEFAULT_FONT } from '../model'
import { normalizeColor, paddingY, px, styleOf } from '../htmlUtils'
import { esc } from '../htmlUtils'
import { childTd, marker, COMMON_FIELDS, COMMON_DEFAULTS, outerTdStyle, ALIGN_OPTIONS, type BlockDef } from './types'

// ── Supported platforms ────────────────────────────────────────────────────
export const SOCIAL_PLATFORMS = [
  'Twitter',
  'LinkedIn',
  'Facebook',
  'Instagram',
  'YouTube',
  'TikTok',
  'GitHub',
  'Pinterest',
  'Threads',
  'Bluesky',
] as const

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number]

// ── Inline SVG icons (24×24 viewBox, single-path where possible) ──────────
// All icons are rendered at the requested iconSize via width/height attrs.
const ICONS: Record<string, string> = {
  Twitter: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.636zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  LinkedIn: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
  Facebook: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
  Instagram: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>`,
  YouTube: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
  TikTok: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>`,
  GitHub: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>`,
  Pinterest: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>`,
  Threads: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.75-.375-1.31-.75-1.672-.513-.492-1.298-.754-2.35-.762h-.035c-.81 0-1.86.193-2.55 1.149l-1.64-1.133c.985-1.406 2.484-2.18 4.196-2.18h.064c3.026.024 4.874 1.862 5.089 5.08a8.137 8.137 0 0 1 1.977 1.638c.943 1.182 1.392 2.7 1.227 4.32-.267 2.64-2.018 5.394-5.567 6.645-.19.067-.389.13-.592.189A10.64 10.64 0 0 1 12.186 24zm-2.157-8.816c.532.345 1.218.5 2.01.457.917-.05 1.65-.388 2.178-1.004.517-.603.85-1.46.99-2.545a10.888 10.888 0 0 0-2.861-.207c-1.022.06-1.832.332-2.358.79-.432.373-.637.863-.61 1.438.028.536.362 1.046 1.11 1.071h-.003l-.456.001z"/></svg>`,
  Bluesky: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z"/></svg>`,
}

/** Return the SVG string for a platform, coloured via `color` CSS property */
export function socialIcon(platform: string, size: number, color: string): string {
  const svg = ICONS[platform] ?? ICONS['Twitter']
  return svg.replace(
    '<svg ',
    `<svg width="${size}" height="${size}" style="color:${color};vertical-align:middle;" `,
  )
}

/** Normalise platform label for matching (case-insensitive) */
function matchPlatform(label: string): string {
  const l = label.toLowerCase().trim()
  return SOCIAL_PLATFORMS.find((p) => p.toLowerCase() === l) ?? label
}

// ── Legacy plain-text parser (kept for parse round-trip) ────────────────────
export function parseSocialLinks(links: string): SocialLink[] {
  return links
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const sep = line.indexOf('|')
      const platform = sep === -1 ? line : line.slice(0, sep).trim()
      const href = sep === -1 ? '' : line.slice(sep + 1).trim()
      return { platform: matchPlatform(platform), href }
    })
    .filter((e) => e.platform !== '')
}

export const socialDef: BlockDef = {
  type: 'social',
  label: 'Social links',
  category: 'Structure',
  fields: [
    { key: 'socialLinks', label: 'Social links', type: 'social-links' },
    {
      key: 'layout',
      label: 'Layout',
      type: 'select',
      options: [
        { value: 'column', label: 'Vertical (stacked)' },
        { value: 'row', label: 'Horizontal (side by side)' },
      ],
    },
    { key: 'iconSize', label: 'Icon size', type: 'range', min: 14, max: 40, step: 2, unit: 'px' },
    { key: 'showLabels', label: 'Show labels', type: 'toggle', help: 'Show platform name next to icon' },
    { key: 'align', label: 'Alignment', type: 'select', options: ALIGN_OPTIONS },
    { key: 'iconColor', label: 'Icon colour', type: 'color' },
    { key: 'color', label: 'Label colour', type: 'color' },
    { key: 'fontSize', label: 'Label font size', type: 'range', min: 10, max: 18, step: 1, unit: 'px' },
    { key: 'fontFamily', label: 'Font', type: 'font' },
    { key: 'paddingY', label: 'Vertical padding', type: 'range', min: 0, max: 64, step: 2, unit: 'px' },
    { key: 'paddingX', label: 'Horizontal padding', type: 'range', min: 0, max: 64, step: 2, unit: 'px' },
    ...COMMON_FIELDS,
  ],
  defaults: (): SocialProps => ({
    socialLinks: [
      { platform: 'Twitter', href: 'https://twitter.com/example' },
      { platform: 'LinkedIn', href: 'https://www.linkedin.com/company/example' },
      { platform: 'Instagram', href: 'https://instagram.com/example' },
    ],
    layout: 'column',
    iconSize: 20,
    showLabels: true,
    align: 'center',
    iconColor: '#2b7fe0',
    color: '#5c7793',
    fontSize: 13,
    fontFamily: DEFAULT_FONT,
    paddingY: 16,
    paddingX: 24,
    ...COMMON_DEFAULTS,
  }),
  render: ({ props, id }: { props: SocialProps; id: string }, ctx) => {
    const links: SocialLink[] = props.socialLinks ?? parseSocialLinks(props.links ?? '')
    const align = props.align ?? 'center'
    const tdAlign = align === 'center' ? 'center' : align === 'right' ? 'right' : 'left'
    const layout = props.layout ?? 'column'

    const items = links.map((entry) => {
      const icon = socialIcon(entry.platform, props.iconSize, props.iconColor)
      const label = props.showLabels
        ? `<span style="font-family:${props.fontFamily};font-size:${props.fontSize}px;color:${props.color};vertical-align:middle;margin-left:8px;">${esc(entry.platform)}</span>`
        : ''
      const inner = `${icon}${label}`
      return entry.href
        ? `<a href="${esc(entry.href)}" style="text-decoration:none;display:inline-block;">${inner}</a>`
        : `<span style="display:inline-block;">${inner}</span>`
    })

    let content: string
    if (layout === 'row') {
      // Horizontal: all items in one line, separated by a small gap
      const gap = props.iconSize
      content = `<div style="text-align:${tdAlign};">${items.map((item) => `<span style="display:inline-block;margin:0 ${Math.round(gap / 2)}px;">${item}</span>`).join('')}</div>`
    } else {
      // Vertical: each item on its own line (original behaviour)
      content = items.map((item) => `<div style="margin:4px 0;text-align:${tdAlign};">${item}</div>`).join('\n')
    }

    const tdStyle = outerTdStyle(`padding:${props.paddingY}px ${props.paddingX}px;`, props, ctx.contentWidth)
    return `<tr${marker(id, ctx)}>
  <td class="et-social" align="${tdAlign}" style="${tdStyle}">
${content}
  </td>
</tr>`
  },
  parse: (tr) => {
    const td = childTd(tr, 'et-social')
    if (!td) return null
    const links: SocialLink[] = []
    td.querySelectorAll<HTMLElement>('div').forEach((div) => {
      const a = div.querySelector('a')
      const href = a?.getAttribute('href') ?? ''
      const span = div.querySelector('span')
      const platform = span?.textContent?.trim() || 'Twitter'
      links.push({ platform: matchPlatform(platform), href })
    })
    // Detect row layout: if there are no block-level divs wrapping each item
    // but instead a single wrapper div with inline spans, mark as row
    const divs = Array.from(td.querySelectorAll<HTMLElement>(':scope > div'))
    const isRow = divs.length === 1 && divs[0].querySelectorAll('span[style*="inline-block"]').length > 0
    if (links.length === 0) return null
    const tdSt = styleOf(td)
    return {
      socialLinks: links,
      layout: isRow ? 'row' : 'column',
      iconSize: 20,
      showLabels: true,
      align: (td.getAttribute('align') as 'left' | 'center' | 'right') ?? 'center',
      iconColor: '#2b7fe0',
      color: '#5c7793',
      fontSize: 13,
      fontFamily: DEFAULT_FONT,
      paddingY: paddingY(tdSt.padding, 16),
      paddingX: px(tdSt.paddingLeft, 24),
      blockBg: 'transparent',
      blockRadius: 0,
      widthPct: 100,
    } satisfies SocialProps
  },
}
