import { describe, expect, it } from 'vitest'
import { inlineCss } from '../src/builder/inliner'
import { renderEmail } from '../src/builder/render'
import { sampleDoc } from './render.spec'

describe('inlineCss', () => {
  it('inlines class declarations into style attributes', () => {
    const out = inlineCss(`<!DOCTYPE html><html><head><style>.et-p{margin:0 0 12px;}</style></head>
<body><p class="et-p" style="color:#333;">Hello</p></body></html>`)
    expect(out).toContain('style="margin:0 0 12px;color:#333"')
    expect(out).not.toContain('class="et-p"')
    expect(out).not.toContain('<style>')
  })

  it('keeps existing inline declarations (higher specificity wins)', () => {
    const out = inlineCss(`<!DOCTYPE html><html><head><style>.et-p{margin:0 0 12px;color:red;}</style></head>
<body><p class="et-p" style="margin:0;">Hello</p></body></html>`)
    expect(out).toContain('margin:0')
    expect(out).toContain('color:red')
  })

  it('preserves media query blocks and keeps their classes on elements', () => {
    const out = inlineCss(`<!DOCTYPE html><html><head><style>
.et-col{width:50%;}
@media only screen and (max-width:620px){.et-col{width:100% !important;}}
</style></head><body><table class="et-col"><tr><td>x</td></tr></table></body></html>`)
    expect(out).toContain('@media only screen and (max-width:620px)')
    expect(out).toContain('class="et-col"')
    expect(out).toContain('width:50%')
    expect(out).toContain('.et-col{width:100% !important;}')
  })

  it('moves complex selectors to residual rules instead of inlining', () => {
    const out = inlineCss(`<!DOCTYPE html><html><head><style>
.et-a .et-b{color:blue;}
.et-a{color:green;}
</style></head><body><div class="et-a"><span class="et-b">x</span></div></body></html>`)
    expect(out).toContain('.et-a .et-b {color:blue;}')
    expect(out).toContain('style="color:green"')
    expect(out).toContain('class="et-a"')
    expect(out).toContain('class="et-b"')
  })

  it('round-trips the full builder pipeline', () => {
    const html = renderEmail(sampleDoc())
    const out = inlineCss(html)
    expect(out).toContain('style="margin:0 0 12px;')
    expect(out).toContain('@media only screen and (max-width: 620px)')
    expect(out).toContain('<!--[if mso]>')
    expect(out).toContain('<!--[if !mso]><!-- -->')
    expect(out).toContain('mso-hide:all')
  })
})
