import { describe, expect, it } from 'vitest'
import { DEFAULT_PARAGRAPH_SPACING, paragraphSpacing, parseRichContent, renderRich } from '../src/builder/htmlUtils'

function container(html: string): Element {
  const doc = new DOMParser().parseFromString(`<div id="root">${html}</div>`, 'text/html')
  return doc.getElementById('root')!
}

describe('renderRich lists', () => {
  it('turns `- item` runs into a single bulleted list', () => {
    const html = renderRich('- Alpha\n- Beta', '#2b7fe0')
    expect(html).toContain('<ul class="et-list et-ul et-last"')
    expect(html.match(/<li/g)).toHaveLength(2)
    expect(html).not.toContain('<ol')
  })

  it('turns `1.` / `1)` runs into a single numbered list', () => {
    expect(renderRich('1. one\n2. two', '#2b7fe0')).toContain('<ol class="et-list et-ol et-last"')
    expect(renderRich('1) one\n2) two', '#2b7fe0')).toContain('<ol class="et-list et-ol et-last"')
  })

  it('numbers from the first marker so `3.` starts at three', () => {
    expect(renderRich('3. three\n4. four', '#2b7fe0')).toContain('<ol class="et-list et-ol et-last" start="3"')
  })

  it('keeps inline markup inside list items', () => {
    expect(renderRich('- Alpha with **bold**', '#2b7fe0')).toContain('<strong>bold</strong>')
  })

  it('leaves `*` for italics rather than treating it as a bullet', () => {
    const html = renderRich('*emphasis* leads this line', '#2b7fe0')
    expect(html).toContain('<em>emphasis</em>')
    expect(html).not.toContain('<ul')
  })

  it('ends a list when a plain line follows it', () => {
    const html = renderRich('- Alpha\nBack to prose.', '#2b7fe0')
    expect(html).toContain('</ul>')
    expect(html).toContain('<p class="et-p et-last"')
  })
})

describe('paragraph spacing', () => {
  it('writes the gap inline below every block but the last', () => {
    const html = renderRich('One.\n\n- Alpha\n\nTwo.', '#2b7fe0', 24)
    expect(html).toContain('<p class="et-p" style="margin:0 0 24px;">')
    expect(html).toContain('style="margin:0 0 24px;padding:0 0 0 24px;"')
    expect(html).toContain('<p class="et-p et-last" style="margin:0;">')
  })

  it('defaults to 12px and clamps nonsense values', () => {
    expect(renderRich('One.\n\nTwo.', '#2b7fe0')).toContain(`margin:0 0 ${DEFAULT_PARAGRAPH_SPACING}px;`)
    expect(renderRich('One.\n\nTwo.', '#2b7fe0', -5)).toContain('margin:0 0 0px;')
    expect(renderRich('One.\n\nTwo.', '#2b7fe0', Number.NaN)).toContain(`margin:0 0 ${DEFAULT_PARAGRAPH_SPACING}px;`)
  })

  it('reads the gap back out of rendered HTML', () => {
    expect(paragraphSpacing(container(renderRich('One.\n\nTwo.', '#2b7fe0', 30)), 12)).toBe(30)
  })

  it('falls back to the default when a single block leaves nothing to read', () => {
    expect(paragraphSpacing(container(renderRich('Only one.', '#2b7fe0', 30)), 12)).toBe(12)
  })
})

describe('parseRichContent', () => {
  it('round-trips paragraphs and both list kinds', () => {
    const src = 'Intro.\n\n- Alpha with **bold**\n- Beta\n\n1. Step one\n2. Step two\n\nClosing.'
    expect(parseRichContent(container(renderRich(src, '#2b7fe0', 20)))).toBe(src)
  })

  it('round-trips a numbered list that does not start at one', () => {
    const src = '3. three\n4. four'
    expect(parseRichContent(container(renderRich(src, '#2b7fe0')))).toBe(src)
  })

  it('still reads bodies with no recognisable blocks', () => {
    expect(parseRichContent(container('plain <strong>text</strong>'))).toBe('plain **text**')
  })
})
