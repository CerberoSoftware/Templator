import { describe, expect, it } from 'vitest'
import { cleanLegacy } from '../src/builder/legacyImport'
import { parseEmailHtmlDetailed } from '../src/builder/parser'
import { renderEmail } from '../src/builder/render'

const NEWSLETTER = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Winter Sale</title>
<style>
  .row-text { font-family: Georgia, serif; font-size: 14px; color: #444444; }
</style>
<script>alert('tracking');</script>
</head>
<body bgcolor="#eef4fb" style="margin:0;">
<table width="100%" bgcolor="#eef4fb" cellpadding="0" cellspacing="0" border="0">
  <tr><td align="center" style="padding:20px 0;">
    <table width="600" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td height="24" style="height:24px;font-size:1px;line-height:1px;">&nbsp;</td>
      </tr>
      <tr>
        <td align="left" style="padding:10px 24px;font-family:Arial;font-size:22px;color:#0f2540;">
          <h2 style="margin:0;font-size:22px;color:#0f2540;">Winter Sale</h2>
        </td>
      </tr>
      <tr>
        <td align="left" class="row-text" style="padding:12px 24px;">
          <p style="margin:0 0 10px;">Warm deals for cold days. <strong>Save 30%</strong> today.</p>
          <p style="margin:0;">Visit <a href="https://example.com/shop">our shop</a>.</p>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding:12px;">
          <img src="https://cdn.example.com/banner.png" width="552" alt="Sale banner">
        </td>
      </tr>
      <tr>
        <td align="center" style="padding:12px;">
          <a href="https://example.com/sale" style="display:inline-block;background-color:#c0392b;color:#ffffff;padding:12px 28px;border-radius:6px;font-family:Arial;font-size:15px;text-decoration:none;">Shop now</a>
        </td>
      </tr>
      <tr>
        <td align="center" onclick="steal()" style="padding:8px;">
          <table cellpadding="0" cellspacing="0"><tr><td>two-column legacy row</td><td>with nested table</td></tr></table>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`

describe('cleanLegacy', () => {
  it('strips scripts and event handlers', () => {
    const result = cleanLegacy(NEWSLETTER)
    expect(result.html).not.toContain('<script')
    expect(result.html).not.toContain('onclick')
    expect(result.warnings.some((w) => w.includes('unsupported tag'))).toBe(true)
    expect(result.warnings.some((w) => w.includes('unsafe attribute'))).toBe(true)
  })

  it('recognizes heading, text, image, button and spacer rows', () => {
    const cleaned = cleanLegacy(NEWSLETTER)
    const parsed = parseEmailHtmlDetailed(cleaned.html)
    expect(parsed).not.toBeNull()
    const types = parsed!.doc.blocks.map((b) => b.type)
    expect(types).toContain('spacer')
    expect(types).toContain('heading')
    expect(types).toContain('text')
    expect(types).toContain('image')
    expect(types).toContain('button')
    expect(types).toContain('raw')
  })

  it('extracts button props from legacy markup', () => {
    const cleaned = cleanLegacy(NEWSLETTER)
    const parsed = parseEmailHtmlDetailed(cleaned.html)!
    const button = parsed.doc.blocks.find((b) => b.type === 'button')
    expect(button).toBeDefined()
    if (button?.type === 'button') {
      expect(button.props.label).toBe('Shop now')
      expect(button.props.href).toBe('https://example.com/sale')
      expect(button.props.bgColor).toBe('#c0392b')
    }
  })

  it('extracts text content including bold and links', () => {
    const cleaned = cleanLegacy(NEWSLETTER)
    const parsed = parseEmailHtmlDetailed(cleaned.html)!
    const text = parsed.doc.blocks.find((b) => b.type === 'text')
    expect(text).toBeDefined()
    if (text?.type === 'text') {
      expect(text.props.content).toContain('**Save 30%**')
      expect(text.props.content).toContain('[our shop](https://example.com/shop)')
      // Plain <p> tags with no `et-p` class (as legacy exports always have)
      // must not leak into the parsed content as literal markup.
      expect(text.props.content).not.toContain('<p')
      expect(text.props.content).toBe('Warm deals for cold days. **Save 30%** today.\n\nVisit [our shop](https://example.com/shop).')
    }
  })

  it('inlines class-based CSS from the legacy style block', () => {
    const cleaned = cleanLegacy(NEWSLETTER)
    const parsed = parseEmailHtmlDetailed(cleaned.html)!
    const text = parsed.doc.blocks.find((b) => b.type === 'text')
    if (text?.type === 'text') {
      expect(text.props.fontFamily).toContain('Georgia')
      expect(text.props.fontSize).toBe(14)
    }
  })

  it('keeps unrecognized rows as raw HTML without nesting a <td> inside the raw block\'s own <td>', () => {
    const cleaned = cleanLegacy(NEWSLETTER)
    const parsed = parseEmailHtmlDetailed(cleaned.html)!
    const raw = parsed.doc.blocks.find((b) => b.type === 'raw')
    expect(raw).toBeDefined()
    if (raw?.type === 'raw') {
      // The stored html is the cell's own content, not `<td>…</td>` itself —
      // otherwise rendering it inside the raw block's <td class="et-raw">
      // nests a <td> inside a <td>, which browsers "fix" by fostering the
      // content out as an unstyled sibling cell, leaving the raw block empty.
      expect(raw.props.html).not.toMatch(/^<td[\s>]/)
      expect(raw.props.html).toContain('two-column legacy row')
    }
    const rendered = renderEmail(parsed.doc, { markers: false })
    expect(rendered).not.toContain('<td class="et-raw"><td')
  })

  it('normalizes non-600 content width with a warning', () => {
    const html = NEWSLETTER.replace('<table width="600"', '<table width="720"')
    const result = cleanLegacy(html)
    expect(result.warnings.some((w) => w.includes('normalized'))).toBe(true)
    expect(result.html).toContain('width="600"')
  })
})

// A snippet shaped like the app's own export output (as opposed to NEWSLETTER,
// which is hand-authored "foreign" HTML): every block-marker class already
// present, but without the finer child-element classes (et-h, et-p) some
// versions of the exporter omitted, and with a background-color on each
// block's own <td> that should round-trip back into `blockBg`.
const ET_EXPORT = `<!DOCTYPE html>
<html><head><title>Reimport</title></head>
<body>
<table width="600" cellpadding="0" cellspacing="0" border="0" class="et-content">
  <tr>
    <td class="et-heading" style="padding:28px 32px;background-color:#f4f8fc;">
      <h1 style="margin:0;color:#1a4f99;">Welcome</h1>
    </td>
  </tr>
  <tr>
    <td class="et-text" style="padding:12px 24px;color:#333333;background-color:#f4f8fc;">
      <p style="margin:0;">Hello there.</p>
    </td>
  </tr>
  <tr>
    <td class="et-btn-td" align="center" style="padding:20px 32px;background-color:#f4f8fc;">
      <a href="#" class="et-btn" style="background-color:#594ce6;color:#fff;">Go</a>
    </td>
  </tr>
  <tr>
    <td class="et-footer" style="padding:20px 32px;background-color:#f4f8fc;color:#5c7793;">
      <p style="margin:0;">Footer text.</p>
    </td>
  </tr>
  <tr>
    <td class="et-social" align="center" style="padding:16px 24px;background-color:#f4f8fc;">
      <div style="margin:4px 0;text-align:center;"><a href="https://x.com/example" style="text-decoration:none;display:inline-block;"><svg width="24" height="24" style="color:#8d52e0;vertical-align:middle;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0"/></svg><span style="font-family:Arial;font-size:13px;color:#000000;vertical-align:middle;margin-left:8px;">X</span></a></div>
    </td>
  </tr>
</table>
</body></html>`

describe('re-importing the app\'s own export output', () => {
  it('preserves each block\'s background color instead of resetting it', () => {
    const cleaned = cleanLegacy(ET_EXPORT)
    const parsed = parseEmailHtmlDetailed(cleaned.html)!
    const byType = Object.fromEntries(parsed.doc.blocks.map((b) => [b.type, b]))
    // heading/text/button/social have no dedicated background field, so their
    // <td> color must round-trip through the shared `blockBg` prop.
    for (const type of ['heading', 'text', 'button', 'social'] as const) {
      const block = byType[type]
      expect(block, `${type} block`).toBeDefined()
      expect((block!.props as { blockBg?: string }).blockBg, `${type} blockBg`).toBe('#f4f8fc')
    }
    // footer (like header) has its own dedicated `bgColor` field, so its <td>
    // color round-trips there instead of through `blockBg`.
    const footer = byType.footer
    expect(footer, 'footer block').toBeDefined()
    if (footer?.type === 'footer') {
      expect(footer.props.bgColor).toBe('#f4f8fc')
      expect(footer.props.blockBg).toBe('transparent')
    }
  })

  it('recognizes a heading whose <h1> carries no et-h class', () => {
    const cleaned = cleanLegacy(ET_EXPORT)
    const parsed = parseEmailHtmlDetailed(cleaned.html)!
    const heading = parsed.doc.blocks.find((b) => b.type === 'heading')
    expect(heading).toBeDefined()
    if (heading?.type === 'heading') {
      expect(heading.props.text).toBe('Welcome')
      expect(heading.props.color).toBe('#1a4f99')
    }
  })

  it('keeps a footer row classified as footer, not text, so it is not reclassified and dropped', () => {
    const cleaned = cleanLegacy(ET_EXPORT)
    const parsed = parseEmailHtmlDetailed(cleaned.html)!
    const types = parsed.doc.blocks.map((b) => b.type)
    expect(types).toContain('footer')
    const footer = parsed.doc.blocks.find((b) => b.type === 'footer')
    if (footer?.type === 'footer') {
      expect(footer.props.color).toBe('#5c7793')
    }
  })

  it('reads back the social icon size and color instead of hardcoding defaults', () => {
    const cleaned = cleanLegacy(ET_EXPORT)
    const parsed = parseEmailHtmlDetailed(cleaned.html)!
    const social = parsed.doc.blocks.find((b) => b.type === 'social')
    expect(social).toBeDefined()
    if (social?.type === 'social') {
      expect(social.props.iconSize).toBe(24)
      expect(social.props.iconColor).toBe('#8d52e0')
      expect(social.props.color).toBe('#000000')
    }
  })
})

describe('legacy import edge cases', () => {
  it('handles HTML with no tables as a raw blob', () => {
    const result = cleanLegacy('<!DOCTYPE html><html><body><p>just text</p></body></html>')
    expect(result.warnings.some((w) => w.includes('No table layout'))).toBe(true)
    const parsed = parseEmailHtmlDetailed(result.html)
    expect(parsed).toBeNull()
  })

  it('strips embedded base64 images, which are too large to store', () => {
    const dataUri =
      'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    const result = cleanLegacy(
      `<!DOCTYPE html><html><body><table><tr><td><img src="${dataUri}" alt="Inline"></td></tr></table></body></html>`,
    )
    expect(result.html).not.toContain('base64')
    expect(result.warnings.some((w) => w.includes('embedded (base64) image'))).toBe(true)
  })

  it('keeps hosted image URLs', () => {
    const result = cleanLegacy(
      '<!DOCTYPE html><html><body><table><tr><td><img src="https://example.com/a.png" alt="A"></td></tr></table></body></html>',
    )
    expect(result.html).toContain('https://example.com/a.png')
    expect(result.warnings.some((w) => w.includes('embedded (base64) image'))).toBe(false)
  })

  it('adds empty alt attributes to images', () => {
    const html = NEWSLETTER.replace('alt="Sale banner"', '')
    const result = cleanLegacy(html)
    expect(result.warnings.some((w) => w.includes('missing alt'))).toBe(true)
    const parsed = parseEmailHtmlDetailed(result.html)
    expect(parsed).not.toBeNull()
    const image = parsed!.doc.blocks.find((b) => b.type === 'image')
    expect(image).toBeDefined()
  })
})
