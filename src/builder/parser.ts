import type { Block, EmailDoc, EmailDocSettings } from './model'
import { DEFAULT_FONT, DEFAULT_LINK_COLOR, DEFAULT_SETTINGS, DEFAULT_TEXT_COLOR, uid } from './model'
import { makeParseCtx } from './blocks'
import { normalizeColor, px } from './htmlUtils'

export function directRows(table: Element): Element[] {
  const out: Element[] = []
  for (const child of table.children) {
    if (child.tagName === 'TR') {
      out.push(child)
    } else if (child.tagName === 'TBODY' || child.tagName === 'THEAD' || child.tagName === 'TFOOT') {
      for (const tr of child.children) {
        if (tr.tagName === 'TR') out.push(tr)
      }
    }
  }
  return out
}

export interface ParseResult {
  doc: EmailDoc
  unmatched: number
}

export function parseEmailHtmlDetailed(html: string): ParseResult | null {
  const dom = new DOMParser().parseFromString(html, 'text/html')
  const content = dom.querySelector('table.et-content') as HTMLTableElement | null
  if (!content) return null

  const settings = extractSettings(dom, content)
  const ctx = makeParseCtx()
  const blocks: Block[] = []
  let unmatched = 0
  for (const row of directRows(content)) {
    const block = ctx.parseRow(row)
    if (block !== null) {
      blocks.push(block)
    } else {
      // Use each cell's own innerHTML, not the row's — row.innerHTML includes
      // the <td>...</td> wrapper(s), which the raw block's own render() then
      // wraps in another <td class="et-raw">. A <td> can't nest inside a
      // <td>, so the browser fosters the inner cell out as an unstyled
      // sibling, leaving the raw block empty and the content adrift outside
      // its intended container.
      const cells = [...row.children].filter((c) => c.tagName === 'TD') as HTMLElement[]
      const html = cells.length > 0 ? cells.map((td) => td.innerHTML.trim()).filter((s) => s !== '').join('\n') : row.innerHTML.trim()
      blocks.push({ id: uid(), type: 'raw', props: { html, blockBg: 'transparent', blockRadius: 0, widthPct: 100 } })
      unmatched++
    }
  }
  return { doc: { settings, blocks }, unmatched }
}

export function parseEmailHtml(html: string): EmailDoc | null {
  return parseEmailHtmlDetailed(html)?.doc ?? null
}

function extractSettings(doc: Document, content: HTMLElement): EmailDocSettings {
  const outer = doc.querySelector('table.et-outer') as HTMLElement | null
  const bodyBgRaw =
    outer !== null
      ? outer.style.backgroundColor || outer.getAttribute('bgcolor') || DEFAULT_SETTINGS.bodyBg
      : DEFAULT_SETTINGS.bodyBg
  const containerBgRaw = content.style.backgroundColor || content.getAttribute('bgcolor') || '#ffffff'
  const contentWidth = parseInt((content.getAttribute('width') ?? '600').replace('px', ''), 10) || 600
  const subject = doc.title ?? ''
  const preDiv = doc.querySelector('.et-preheader')
  const preheader = preDiv ? (preDiv.textContent ?? '').replace(/[\u00a0\s]+$/g, '') : ''
  let fontFamily: string = DEFAULT_FONT
  let textColor: string = DEFAULT_TEXT_COLOR
  let linkColor: string = DEFAULT_LINK_COLOR
  // Read the global rules back out of whichever <style> tag carries them; a
  // document that has been through the inliner may have several.
  const styleText = [...doc.querySelectorAll('style')].map((el) => el.textContent ?? '').join('\n')
  if (styleText) {
    const fontM = /body\s*\{[^}]*font-family:\s*([^;}]+)/i.exec(styleText)
    if (fontM) fontFamily = fontM[1].trim()
    const colorM = /body\s*\{[^}]*color:\s*([^;}]+)/i.exec(styleText)
    if (colorM) textColor = normalizeColor(colorM[1].trim())
    const linkM = /a\s*\{[^}]*color:\s*([^;}]+)/i.exec(styleText)
    if (linkM) linkColor = normalizeColor(linkM[1].trim())
  }
  return {
    subject,
    preheader,
    contentWidth,
    bodyBg: normalizeColor(bodyBgRaw),
    containerBg: normalizeColor(containerBgRaw),
    fontFamily,
    textColor,
    linkColor,
    containerRadius: px(content.style.borderRadius, DEFAULT_SETTINGS.containerRadius),
  }
}
