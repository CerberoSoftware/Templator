import { describe, expect, it } from 'vitest'
import type { EmailDoc, ImageTextProps } from '../src/builder/model'
import { DEFAULT_FONT, DEFAULT_LINK_COLOR } from '../src/builder/model'
import { renderEmail } from '../src/builder/render'
import { parseEmailHtml } from '../src/builder/parser'
import { inlineCss } from '../src/builder/inliner'

function imgTextDoc(imagePosition: ImageTextProps['imagePosition']): EmailDoc {
  return {
    settings: {
      subject: 'Image and text',
      preheader: '',
      contentWidth: 600,
      bodyBg: '#f4f8fc',
      containerBg: '#ffffff',
      fontFamily: DEFAULT_FONT,
      textColor: '#333333',
      linkColor: DEFAULT_LINK_COLOR,
    },
    blocks: [
      {
        id: 'b-imgtext',
        type: 'image_text',
        props: {
          imgSrc: 'https://example.com/hero.png',
          imgAlt: 'Hero',
          imgWidth: 200,
          text: 'Side by side copy.',
          fontSize: 15,
          lineHeight: 1.6,
          fontFamily: DEFAULT_FONT,
          color: '#333333',
          linkColor: DEFAULT_LINK_COLOR,
          imagePosition,
          gap: 16,
          paddingY: 16,
          paddingX: 24,
          blockBg: 'transparent',
          blockRadius: 0,
          widthPct: 100,
        },
      },
    ],
  }
}

describe('image + text block', () => {
  it('renders both halves as real table cells in one row', () => {
    const html = renderEmail(imgTextDoc('left'))
    const dom = new DOMParser().parseFromString(html, 'text/html')
    const row = dom.querySelector('td.et-imgtext table tr')
    const cells = [...(row?.children ?? [])]
    expect(cells).toHaveLength(2)
    expect(cells.every((c) => c.tagName === 'TD')).toBe(true)
    expect(cells[0].className).toContain('et-imgtext-img')
    expect(cells[1].className).toContain('et-imgtext-text')
    expect(cells[0].getAttribute('style')).toContain('padding-right:8px')
    expect(cells[1].getAttribute('style')).toContain('padding-left:8px')
  })

  it('honours the image side and moves the mobile gap onto the leading cell', () => {
    expect(renderEmail(imgTextDoc('left'))).toContain('class="et-imgtext-img et-imgtext-first"')
    expect(renderEmail(imgTextDoc('right'))).toContain('class="et-imgtext-text et-imgtext-first"')
  })

  it('no longer emits the dead stack class or the malformed mso ghost', () => {
    const html = renderEmail(imgTextDoc('left'))
    // The .stack rules stay in the stylesheet for legacy imported markup, but
    // no block emits the class any more.
    expect(html).not.toMatch(/class="[^"]*\bstack\b/)
    // The old ghost opened <table><tr> around a <table> with no <td> in
    // between, which is invalid for Word and did nothing. Scoped to the block:
    // the document head keeps its own legitimate mso conditional.
    const row = html.slice(html.indexOf('<td class="et-imgtext"'), html.indexOf('</tr>', html.indexOf('<td class="et-imgtext"')))
    expect(row).not.toContain('[if mso]')
  })

  it('stacks on mobile in exported html but never in the canvas', () => {
    const exported = renderEmail(imgTextDoc('left'))
    expect(exported).toMatch(/\.et-imgtext-img, \.et-imgtext-text \{[^}]*display: block !important/)
    expect(exported).toContain('.et-imgtext-first { padding-bottom: 16px !important; }')
    expect(renderEmail(imgTextDoc('left'), { canvas: true })).not.toContain('.et-imgtext-img,')
  })

  it('round-trips through the parser for both image sides', () => {
    for (const side of ['left', 'right'] as const) {
      const doc = imgTextDoc(side)
      expect(parseEmailHtml(renderEmail(doc, { markers: true }))).toEqual(doc)
    }
  })

  it('survives the inliner: classes and media rules are preserved', () => {
    const out = inlineCss(renderEmail(imgTextDoc('left')))
    expect(out).toContain('et-imgtext-img')
    expect(out).toContain('et-imgtext-text')
    expect(out).toContain('et-imgtext-first')
    expect(out).toContain('@media only screen and (max-width: 620px)')
    // The re-import path (ImportDialog / re-opening a saved template).
    const reparsed = parseEmailHtml(out)
    expect(reparsed?.blocks[0].type).toBe('image_text')
    expect((reparsed?.blocks[0].props as ImageTextProps).imagePosition).toBe('left')
    expect((reparsed?.blocks[0].props as ImageTextProps).gap).toBe(16)
  })

  it('still parses pre-existing markup that carries the legacy stack class', () => {
    const legacy = renderEmail(imgTextDoc('left')).replace(
      'class="et-imgtext-img et-imgtext-first"',
      'class="et-imgtext-img stack"',
    )
    expect(parseEmailHtml(legacy)?.blocks[0].type).toBe('image_text')
  })
})
