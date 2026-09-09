import { describe, expect, it } from 'vitest'
import { parseEmailHtml } from '../src/builder/parser'
import { renderEmail } from '../src/builder/render'
import { sampleDoc } from './render.spec'

describe('parseEmailHtml round-trip', () => {
  it('parse(render(doc)) deep-equals the original document', () => {
    const doc = sampleDoc()
    const html = renderEmail(doc, { markers: true })
    const parsed = parseEmailHtml(html)
    expect(parsed).not.toBeNull()
    expect(parsed).toEqual(doc)
  })

  it('parses without markers, assigning fresh ids', () => {
    const html = renderEmail(sampleDoc(), { markers: false })
    const parsed = parseEmailHtml(html)
    expect(parsed).not.toBeNull()
    expect(parsed!.settings).toEqual(sampleDoc().settings)
    expect(parsed!.blocks.map((b) => b.type)).toEqual(sampleDoc().blocks.map((b) => b.type))
  })

  it('round-trips idempotently after one normalization pass', () => {
    const doc = sampleDoc()
    const once = parseEmailHtml(renderEmail(doc, { markers: true }))!
    const twice = parseEmailHtml(renderEmail(once, { markers: true }))!
    expect(once).toEqual(twice)
  })

  it('returns null for HTML without an et-content table', () => {
    expect(parseEmailHtml('<!DOCTYPE html><html><body><p>legacy</p></body></html>')).toBeNull()
  })

  it('round-trips the fadeBottom flag on image blocks', () => {
    const doc = sampleDoc()
    const imageBlock = doc.blocks.find((b) => b.type === 'image')
    if (imageBlock?.type !== 'image') throw new Error('expected an image block in sampleDoc')
    imageBlock.props.fadeBottom = true
    const parsed = parseEmailHtml(renderEmail(doc, { markers: true }))
    expect(parsed).toEqual(doc)
  })

  it('wraps unknown rows as raw blocks', () => {
    const html = renderEmail({
      settings: sampleDoc().settings,
      blocks: [{ id: 'x', type: 'raw', props: { html: '<p style="margin:0;">weird <blink>markup</blink></p>', blockBg: 'transparent', blockRadius: 0, widthPct: 100 } }],
    })
    const parsed = parseEmailHtml(html)
    expect(parsed!.blocks).toHaveLength(1)
    expect(parsed!.blocks[0].type).toBe('raw')
  })
})

describe('extracting document settings', () => {
  it('reads the global rules from a later <style> tag', () => {
    // The inliner consolidates rules into a <style> of its own, so the global
    // body/link rules are not always in the first one. Use values that differ
    // from the defaults, or a missed <style> would look like a match.
    const doc = sampleDoc()
    doc.settings.linkColor = '#7c3aed'
    doc.settings.textColor = '#151828'
    doc.settings.fontFamily = 'Georgia, serif'
    const html = renderEmail(doc).replace('<head>', '<head>\n  <style>.et-p { margin: 0 0 12px; }</style>')
    const parsed = parseEmailHtml(html)!
    expect(parsed.settings.linkColor).toBe('#7c3aed')
    expect(parsed.settings.textColor).toBe('#151828')
    expect(parsed.settings.fontFamily).toBe('Georgia, serif')
  })
})
