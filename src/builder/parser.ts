import type { Block, EmailDoc, EmailDocSettings } from './model'
import { DEFAULT_FONT, DEFAULT_LINK_COLOR, DEFAULT_SETTINGS, DEFAULT_TEXT_COLOR, uid } from './model'
import { makeParseCtx } from './blocks'
import { normalizeColor } from './htmlUtils'

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
      blocks.push({ id: uid(), type: 'raw', props: { html: row.innerHTML.trim(), blockBg: 'transparent', blockRadius: 0, widthPct: 100 } })
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
  const styleText = doc.querySelector('style')?.textContent ?? ''
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
  }
}
