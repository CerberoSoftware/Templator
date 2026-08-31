import type { Block, EmailDoc, EmailDocSettings } from './model'
import { DEFAULT_SETTINGS, uid } from './model'
import { makeParseCtx } from './blocks'

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

export function parseEmailHtml(html: string): EmailDoc | null {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const content = doc.querySelector('table.et-content') as HTMLTableElement | null
  if (!content) return null

  const settings = extractSettings(doc, content)
  const ctx = makeParseCtx()
  const blocks: Block[] = []
  for (const row of directRows(content)) {
    const block = ctx.parseRow(row)
    if (block !== null) {
      blocks.push(block)
    } else {
      blocks.push({ id: uid(), type: 'raw', props: { html: row.innerHTML.trim() } })
    }
  }
  return { settings, blocks }
}

function extractSettings(doc: Document, content: HTMLElement): EmailDocSettings {
  const outer = doc.querySelector('table.et-outer') as HTMLElement | null
  const outerBg =
    outer !== null
      ? outer.style.backgroundColor || outer.getAttribute('bgcolor') || DEFAULT_SETTINGS.outerBg
      : DEFAULT_SETTINGS.outerBg
  const contentBg = content.style.backgroundColor || content.getAttribute('bgcolor') || '#ffffff'
  const contentWidth = parseInt((content.getAttribute('width') ?? '600').replace('px', ''), 10) || 600
  const subject = doc.title ?? ''
  const preDiv = doc.querySelector('.et-preheader')
  const preheader = preDiv ? (preDiv.textContent ?? '').replace(/[\u00a0\s]+$/g, '') : ''
  return {
    subject,
    preheader,
    contentWidth,
    outerBg,
    contentBg,
  }
}
