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
    .replace(/~~([^~]+)~~/g, '<s>$1</s>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<u>$1</u>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_m, text: string, href: string) => {
      return `<a href="${href}" class="et-link" style="color:${linkColor};text-decoration:underline;">${text}</a>`
    })
}

/** Default gap, in px, between paragraphs and lists inside a rich-text block. */
export const DEFAULT_PARAGRAPH_SPACING = 12

/** Default gap, in px, between the items of a bulleted or numbered list. */
export const DEFAULT_LIST_ITEM_SPACING = 4

/** `- item` or `\u2022 item` starts a bulleted list. `*` is deliberately excluded: it is the italic marker. */
const BULLET_RE = /^[-\u2022]\s+(.+)$/
/** `1. item` or `1) item` starts a numbered list. */
const ORDERED_RE = /^(\d{1,3})[.)]\s+(.+)$/

export type RichGroup =
  | { kind: 'p'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[]; start: number }

/**
 * Split rich-text source into paragraph and list groups.
 *
 * Blank lines separate paragraphs (as before). A run of consecutive lines that
 * open with `-` / `\u2022` becomes one bulleted list, and a run opening with
 * `1.` / `1)` becomes one numbered list; the first marker's number sets the
 * list's `start`, so "3. …" numbers from three.
 */
export function groupRichContent(content: string): RichGroup[] {
  const groups: RichGroup[] = []
  let paragraph: string[] = []

  const flushParagraph = () => {
    const text = paragraph.join('\n').trim()
    if (text !== '') groups.push({ kind: 'p', text })
    paragraph = []
  }

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (line === '') {
      flushParagraph()
      continue
    }
    const bullet = BULLET_RE.exec(line)
    if (bullet) {
      flushParagraph()
      const last = groups[groups.length - 1]
      if (last?.kind === 'ul') last.items.push(bullet[1].trim())
      else groups.push({ kind: 'ul', items: [bullet[1].trim()] })
      continue
    }
    const ordered = ORDERED_RE.exec(line)
    if (ordered) {
      flushParagraph()
      const last = groups[groups.length - 1]
      if (last?.kind === 'ol') last.items.push(ordered[2].trim())
      else groups.push({ kind: 'ol', items: [ordered[2].trim()], start: parseInt(ordered[1], 10) })
      continue
    }
    paragraph.push(line)
  }
  flushParagraph()
  return groups
}

/**
 * Render rich-text source to email-safe HTML.
 *
 * `spacing` is the gap in px below every block except the last one. It is
 * written inline because a fair number of clients drop the <style> block that
 * carries `.et-p`; the classes stay on the markup so the parser (and older
 * exported HTML) keeps working.
 */
export function renderRich(
  content: string,
  linkColor: string,
  spacing: number = DEFAULT_PARAGRAPH_SPACING,
  listItemSpacing: number = DEFAULT_LIST_ITEM_SPACING,
): string {
  const groups = groupRichContent(content)
  if (groups.length === 0) return ''
  const gap = Number.isFinite(spacing) ? Math.max(0, Math.round(spacing)) : DEFAULT_PARAGRAPH_SPACING
  const liGap = Number.isFinite(listItemSpacing) ? Math.max(0, Math.round(listItemSpacing)) : DEFAULT_LIST_ITEM_SPACING
  return groups
    .map((group, i) => {
      const isLast = i === groups.length - 1
      const lastCls = isLast ? ' et-last' : ''
      const margin = isLast ? 'margin:0;' : `margin:0 0 ${gap}px;`
      if (group.kind === 'p') {
        return `<p class="et-p${lastCls}" style="${margin}">${renderInlineMarkup(esc(group.text), linkColor)}</p>`
      }
      const tag = group.kind === 'ul' ? 'ul' : 'ol'
      const start = group.kind === 'ol' && group.start !== 1 ? ` start="${group.start}"` : ''
      const items = group.items
        .map(
          (item) =>
            `<li class="et-li" style="margin:0 0 ${liGap}px;">${renderInlineMarkup(esc(item), linkColor)}</li>`,
        )
        .join('')
      return `<${tag} class="et-list et-${tag}${lastCls}"${start} style="${margin}padding:0 0 0 24px;">${items}</${tag}>`
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
    .replace(/<u>(.*?)<\/u>/g, '__$1__')
    .replace(/<s>(.*?)<\/s>/g, '~~$1~~')
    .replace(/<strike>(.*?)<\/strike>/g, '~~$1~~')
    .replace(/<span[^>]*text-decoration:\s*underline[^>]*>(.*?)<\/span>/g, '__$1__')
    .replace(/<span[^>]*text-decoration:\s*line-through[^>]*>(.*?)<\/span>/g, '~~$1~~')
    .replace(/<br\s*\/?>/g, '\n')
}

function richText(html: string): string {
  return unesc(reverseInlineMarkup(html.trim())).replace(/^[\s\u00a0]+|[\s\u00a0]+$/g, '')
}

/**
 * Turn rendered rich-text HTML back into the source the editor holds.
 * Lists come back as `- item` / `1. item` lines so a round-trip through the
 * Code panel or an import preserves them.
 */
export function parseRichContent(container: Element): string {
  // Match any <p>/<ul>/<ol>, not just ones carrying the `et-p` class renderRich()
  // writes: imported legacy HTML has plain <p> tags with no such class, and
  // requiring it made every paragraph fall through to the raw-innerHTML branch
  // below, which dumps the literal tag markup into the block's text content.
  const blocks = [...container.querySelectorAll('p, ul, ol')].filter(
    (el) => el.parentElement?.closest('ul, ol') == null,
  )
  if (blocks.length === 0) {
    const text = richText(container.innerHTML)
    return text
  }
  const parts: string[] = []
  for (const el of blocks) {
    const tag = el.tagName.toLowerCase()
    if (tag === 'ul' || tag === 'ol') {
      const start = numAttr(el, 'start', 1)
      const items = [...el.children]
        .filter((c) => c.tagName === 'LI')
        .map((li) => richText(li.innerHTML))
        .filter((t) => t !== '')
      if (items.length > 0) {
        parts.push(items.map((t, i) => (tag === 'ul' ? `- ${t}` : `${start + i}. ${t}`)).join('\n'))
      }
      continue
    }
    const text = richText(el.innerHTML)
    if (text !== '') parts.push(text)
  }
  return parts.join('\n\n')
}

/**
 * Read back the paragraph gap that renderRich() wrote.
 * The final block always carries `margin:0`, so only earlier blocks can carry
 * the value; a single-block body falls back to the caller's default.
 */
export function paragraphSpacing(container: Element, fallback: number): number {
  const blocks = [...container.querySelectorAll('p.et-p, ul.et-list, ol.et-list')]
  for (const el of blocks) {
    if (el.classList.contains('et-last')) continue
    const style = styleOf(el)
    const bottom = style.getPropertyValue('margin-bottom')
    if (bottom !== '') return px(bottom, fallback)
    const shorthand = style.getPropertyValue('margin').split(/\s+/)
    if (shorthand.length >= 3) return px(shorthand[2], fallback)
  }
  return fallback
}

/**
 * Read back the gap between list items that renderRich() wrote on `<li>`
 * elements. Falls back to the caller's default when there is no list, or the
 * item carries no explicit margin (e.g. hand-authored HTML).
 */
export function listItemSpacing(container: Element, fallback: number): number {
  const li = container.querySelector('li.et-li')
  if (!li) return fallback
  const style = styleOf(li)
  const bottom = style.getPropertyValue('margin-bottom')
  if (bottom !== '') return px(bottom, fallback)
  const shorthand = style.getPropertyValue('margin').split(/\s+/)
  if (shorthand.length >= 3) return px(shorthand[2], fallback)
  return fallback
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
