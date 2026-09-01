import { describe, expect, it } from 'vitest'
import type { EmailDoc } from '../src/builder/model'
import { DEFAULT_FONT } from '../src/builder/model'
import { BASE_STYLES, CANVAS_STYLES, MOBILE_BREAKPOINT, RESPONSIVE_STYLES, renderEmail } from '../src/builder/render'

export function sampleDoc(): EmailDoc {
  return {
    settings: {
      subject: 'August digest',
      preheader: 'Your monthly product update',
      contentWidth: 600,
      bodyBg: '#f4f8fc',
      containerBg: '#ffffff',
      fontFamily: DEFAULT_FONT,
      textColor: '#333333',
      linkColor: '#2b7fe0',
    },
    blocks: [
      {
        id: 'b-header',
        type: 'header',
        props: {
          logoUrl: 'https://example.com/logo.png',
          logoAlt: 'ACME',
          logoWidth: 160,
          logoLink: 'https://example.com',
          tagline: 'Product digest',
          taglineColor: '#5c7793',
          taglineSize: 13,
          bgColor: '#ffffff',
          align: 'center',
          paddingY: 24,
          paddingX: 24,
          blockBg: 'transparent',
          blockRadius: 0,
          widthPct: 100,
        },
      },
      { id: 'b-spacer', type: 'spacer', props: { height: 32, bg: 'transparent', blockBg: 'transparent', blockRadius: 0, widthPct: 100 } },
      {
        id: 'b-heading',
        type: 'heading',
        props: {
          text: 'What happened in August',
          level: 2,
          color: '#0f2540',
          align: 'left',
          fontFamily: DEFAULT_FONT,
          paddingY: 12,
          paddingX: 24,
          blockBg: 'transparent',
          blockRadius: 0,
          widthPct: 100,
        },
      },
      {
        id: 'b-text',
        type: 'text',
        props: {
          content: 'First paragraph with **bold** and a [link](https://example.com/go).\n\nSecond paragraph after a blank line.',
          fontSize: 15,
          lineHeight: 1.6,
          fontFamily: DEFAULT_FONT,
          color: '#333333',
          align: 'left',
          linkColor: '#2b7fe0',
          paddingY: 12,
          paddingX: 24,
          blockBg: 'transparent',
          blockRadius: 0,
          widthPct: 100,
        },
      },
      {
        id: 'b-button',
        type: 'button',
        props: {
          label: 'Read the update',
          href: 'https://example.com/post',
          bgColor: '#2b7fe0',
          textColor: '#ffffff',
          radius: 24,
          fullWidth: false,
          width: 200,
          height: 46,
          fontSize: 16,
          fontFamily: DEFAULT_FONT,
          align: 'center',
          paddingY: 12,
          paddingX: 24,
          blockBg: 'transparent',
          blockRadius: 0,
          widthPct: 100,
        },
      },
      {
        id: 'b-image',
        type: 'image',
        props: {
          src: 'https://example.com/hero.jpg',
          alt: 'Hero image',
          width: 552,
          align: 'center',
          link: 'https://example.com',
          paddingY: 8,
          paddingX: 0,
          blockBg: 'transparent',
          blockRadius: 0,
          widthPct: 100,
        },
      },
      {
        id: 'b-twocol',
        type: 'twocol',
        props: { ratio: '50-50', gap: 16, paddingY: 8, paddingX: 24, blockBg: 'transparent', blockRadius: 0, widthPct: 100 },
        columns: [
          [
            {
              id: 'b-col-text',
              type: 'text',
              props: {
                content: 'Left column text.',
                fontSize: 14,
                lineHeight: 1.5,
                fontFamily: DEFAULT_FONT,
                color: '#333333',
                align: 'left',
                linkColor: '#2b7fe0',
                paddingY: 12,
                paddingX: 24,
                blockBg: 'transparent',
                blockRadius: 0,
                widthPct: 100,
              },
            },
          ],
          [
            {
              id: 'b-col-image',
              type: 'image',
              props: {
                src: 'https://example.com/side.jpg',
                alt: 'Side',
                width: 240,
                align: 'center',
                link: '',
                paddingY: 8,
                paddingX: 0,
                blockBg: 'transparent',
                blockRadius: 0,
                widthPct: 100,
              },
            },
          ],
        ],
      },
      { id: 'b-divider', type: 'divider', props: { color: '#e7eef6', thickness: 2, paddingY: 16, paddingX: 24, blockBg: 'transparent', blockRadius: 0, widthPct: 100 } },
      {
        id: 'b-social',
        type: 'social',
        props: {
          socialLinks: [
            { platform: 'Twitter', href: 'https://twitter.com/example' },
            { platform: 'LinkedIn', href: 'https://linkedin.com/example' },
          ],
          layout: 'column',
          iconSize: 20,
          showLabels: true,
          align: 'center',
          iconColor: '#2b7fe0',
          color: '#5c7793',
          fontSize: 13,
          fontFamily: DEFAULT_FONT,
          paddingY: 16,
          paddingX: 24,
          blockBg: 'transparent',
          blockRadius: 0,
          widthPct: 100,
        },
      },
      {
        id: 'b-footer',
        type: 'footer',
        props: {
          content: 'ACME Inc, 1 Example Street.\n\nUnsubscribe: [here]({{unsubscribe_url}})',
          fontSize: 12,
          fontFamily: DEFAULT_FONT,
          color: '#5c7793',
          align: 'center',
          bgColor: '#f4f8fc',
          paddingY: 20,
          paddingX: 24,
          blockBg: 'transparent',
          blockRadius: 0,
          widthPct: 100,
        },
      },
      { id: 'b-raw', type: 'raw', props: { html: '<p style="margin:0;">custom</p>', blockBg: 'transparent', blockRadius: 0, widthPct: 100 } },
    ],
  }
}

describe('renderEmail', () => {
  it('renders a full email document with markers', () => {
    const html = renderEmail(sampleDoc(), { markers: true })
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('data-et-block="b-header"')
    expect(html).toContain('data-et-block="b-twocol"')
    expect(html).toContain('data-et-block="b-col-text"')
    expect(html).toContain('data-et-col="b-twocol:0"')
    expect(html).toContain('class="et-content"')
    expect(html).toContain('width="600"')
    expect(html).toContain('class="et-preheader"')
    expect(html).toContain('Your monthly product update')
  })

  it('omits markers when disabled', () => {
    const html = renderEmail(sampleDoc(), { markers: false })
    expect(html).not.toContain('data-et-block')
    expect(html).not.toContain('data-et-col')
  })

  it('wraps buttons in VML for Outlook', () => {
    const html = renderEmail(sampleDoc())
    expect(html).toContain('<!--[if mso]>')
    expect(html).toContain('<v:roundrect')
    expect(html).toContain('<w:anchorlock/>')
    expect(html).toContain('<!--[if !mso]><!-- -->')
    expect(html).toContain('<!--<![endif]-->')
  })

  it('renders hybrid two-column structure with ghost tables', () => {
    const html = renderEmail(sampleDoc())
    expect(html).toContain('class="et-col et-col1"')
    expect(html).toContain('class="et-col et-col2"')
    expect(html).toContain('<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td width="50%" valign="top">')
    expect(html).toContain('@media only screen and (max-width: 620px)')
  })

  it('renders rich text markup safely', () => {
    const html = renderEmail(sampleDoc())
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<a href="https://example.com/go" class="et-link"')
    expect(html).toContain('Second paragraph after a blank line.')
  })
})

describe('canvas mode stylesheet', () => {
  it('omits the mobile breakpoint so the design canvas never stacks columns', () => {
    // The canvas iframe is exactly contentWidth wide (600 < 620), so shipping
    // the mobile @media block would collapse every multi-column block while
    // the user is editing.
    const html = renderEmail(sampleDoc(), { markers: true, canvas: true })
    expect(html).not.toContain('@media')
    expect(html).not.toMatch(/\.et-col[^}]*display:\s*block/)
    expect(html).toContain('.et-col-blocks')
    expect(html).toContain('.et-outer-td { padding: 0 !important; }')
  })

  it('keeps the mobile breakpoint for export, preview and the code panel', () => {
    const html = renderEmail(sampleDoc())
    expect(html).toContain('@media only screen and (max-width: 620px)')
    expect(html).toMatch(/\.et-col[^}]*display:\s*block/)
    expect(html).not.toContain('.et-col-blocks')
  })

  it('keeps the responsive rules out of the always-emitted constant', () => {
    expect(BASE_STYLES).not.toContain('@media')
    expect(RESPONSIVE_STYLES).toContain(`max-width: ${MOBILE_BREAKPOINT}px`)
    // Regression guard: the old counter-!important hacks are gone for good.
    expect(CANVAS_STYLES).not.toContain('display: table-cell !important')
    expect(CANVAS_STYLES).not.toContain('.stack')
  })

  it('leaves the two columns at their configured widths in canvas mode', () => {
    const html = renderEmail(sampleDoc(), { markers: true, canvas: true })
    const dom = new DOMParser().parseFromString(html, 'text/html')
    const col1 = dom.querySelector('table.et-col1')
    expect(col1?.getAttribute('width')).toBe('50%')
    expect(col1?.getAttribute('align')).toBe('left')
    expect(col1?.getAttribute('style')).toContain('width:50%;max-width:50%')
  })
})
