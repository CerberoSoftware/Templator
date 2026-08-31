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

  it('wraps unknown rows as raw blocks', () => {
    const html = renderEmail({
      settings: sampleDoc().settings,
      blocks: [{ id: 'x', type: 'raw', props: { html: '<p style="margin:0;">weird <blink>markup</blink></p>' } }],
    })
    const parsed = parseEmailHtml(html)
    expect(parsed!.blocks).toHaveLength(1)
    expect(parsed!.blocks[0].type).toBe('raw')
  })
})
