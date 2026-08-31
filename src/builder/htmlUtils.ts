export function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function unesc(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

export function renderInlineMarkup(escaped: string, linkColor: string): string {
  return escaped
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_m, text: string, href: string) => {
      return `<a href="${href}" class="et-link" style="color:${linkColor};text-decoration:underline;">${text}</a>`
    })
}

export function renderRich(content: string, linkColor: string): string {
  const paragraphs = content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p !== '')
  if (paragraphs.length === 0) return ''
  return paragraphs
    .map((p, i) => {
      const cls = i === paragraphs.length - 1 ? 'et-p et-last' : 'et-p'
      return `<p class="${cls}">${renderInlineMarkup(esc(p), linkColor)}</p>`
    })
    .join('')
}

export function reverseInlineMarkup(html: string): string {
  return html
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g, (_m, href: string, text: string) => `[${text}](${href})`)
    .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
    .replace(/<b>(.*?)<\/b>/g, '**$1**')
    .replace(/<em>(.*?)<\/em>/g, '*$1*')
    .replace(/<i>(.*?)<\/i>/g, '*$1*')
    .replace(/<br\s*\/?>/g, '\n')
}

export function parseRichContent(container: Element): string {
  const paragraphs = [...container.querySelectorAll('p.et-p')]
  const sources = paragraphs.length > 0 ? paragraphs.map((p) => p.innerHTML) : [container.innerHTML]
  const parts = sources
    .map((h) => unesc(reverseInlineMarkup(h.trim())))
    .map((t) => t.replace(/^[\s\u00a0]+|[\s\u00a0]+$/g, ''))
    .filter((t) => t !== '')
  return parts.join('\n\n')
}

export function normalizeColor(value: string): string {
  const v = value.trim().toLowerCase()
  if (/^#[0-9a-f]{6}$/.test(v)) return v
  if (/^#[0-9a-f]{3}$/.test(v)) return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`
  const m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)$/.exec(v)
  if (m) {
    const hex = (n: string) => parseInt(n, 10).toString(16).padStart(2, '0')
    return `#${hex(m[1])}${hex(m[2])}${hex(m[3])}`
  }
  return value.trim()
}

export function firstLinkColor(container: Element, fallback: string): string {
  const a = container.querySelector('a.et-link') as HTMLElement | null
  if (a) {
    const color = a.style.getPropertyValue('color')
    if (color !== '') return normalizeColor(color)
  }
  return fallback
}

export function px(value: string | null | undefined, fallback: number): number {
  if (value == null) return fallback
  const m = /(-?\d+(?:\.\d+)?)px/.exec(value)
  return m ? Math.round(parseFloat(m[1])) : fallback
}

export function paddingY(styleValue: string | null | undefined, fallback: number): number {
  if (styleValue == null || styleValue === '') return fallback
  const first = styleValue.split(' ')[0]
  return px(first, fallback)
}

export function numAttr(el: Element, name: string, fallback: number): number {
  const v = el.getAttribute(name)
  return v != null && /^\d+$/.test(v) ? parseInt(v, 10) : fallback
}

export function hasClass(el: Element, cls: string): boolean {
  return el.classList.contains(cls)
}

export function styleOf(el: Element): CSSStyleDeclaration {
  return (el as HTMLElement).style
}

export function alignOf(el: Element, fallback: 'left' | 'center' | 'right'): 'left' | 'center' | 'right' {
  const a = el.getAttribute('align')
  if (a === 'left' || a === 'center' || a === 'right') return a
  const ta = styleOf(el).getPropertyValue('text-align')
  if (ta === 'left' || ta === 'center' || ta === 'right') return ta
  return fallback
}

export function colorOf(el: Element, prop: string, fallback: string): string {
  const v = styleOf(el).getPropertyValue(prop)
  if (v === '' && prop === 'background-color') {
    const bg = el.getAttribute('bgcolor')
    return bg != null && bg !== '' ? normalizeColor(bg) : fallback
  }
  return v !== '' ? normalizeColor(v) : fallback
}
