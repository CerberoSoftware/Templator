import { type EmailDoc, DEFAULT_FONT } from './model'
import { makeRenderCtx, renderBlock } from './blocks'
import { esc } from './htmlUtils'

/** Viewport below which the email collapses to a single column. */
export const MOBILE_BREAKPOINT = 620

/**
 * Rules that apply at every viewport. Safe to emit everywhere, including the
 * Design canvas.
 */
export const BASE_STYLES = `
    .et-p { margin: 0 0 12px; }
    .et-list { margin: 0 0 12px; padding: 0 0 0 24px; }
    .et-li { margin: 0 0 4px; }
    .et-last { margin-bottom: 0; }
    .et-h { margin: 0; }
    .et-col { border-collapse: collapse; }
    .stack { display: inline-block; vertical-align: top; }
`

/**
 * Mobile rules — deliberately NOT emitted in canvas mode.
 *
 * The Design canvas iframe is exactly `settings.contentWidth` wide (600px by
 * default), which is *below* MOBILE_BREAKPOINT, so every rule in here used to
 * fire while the user was editing and collapse "Two columns" and
 * "Image + Text" into stacked rows. Counter-rules in CANVAS_STYLES could not
 * win reliably against these `!important` declarations, so canvas mode now
 * omits the whole block instead. Export, the Code panel and the Preview pane
 * (which renders a real 375px frame) still get it verbatim.
 */
export const RESPONSIVE_STYLES = `
    @media only screen and (max-width: ${MOBILE_BREAKPOINT}px) {
      .et-content { width: 100% !important; max-width: 100% !important; }
      /* Forcing display:block on the outer .et-col table alone leaves its
         <tr>/<td> children in table-row/table-cell display with no table
         ancestor, so the browser wraps them in an anonymous table that
         shrinks to fit its content (the column's own contents, e.g. a
         narrow image) instead of stretching to the new 100% width — the
         contents then sit flush left rather than honouring their own
         centering. Un-tabling the row and cell too avoids that anonymous
         wrapper so block-level width/margin rules apply as authored. */
      .et-col { width: 100% !important; max-width: 100% !important; display: block !important; float: none !important; }
      .et-col > tbody { display: block !important; }
      .et-col-row { display: block !important; }
      .et-col-inner { display: block !important; width: 100% !important; box-sizing: border-box !important; padding-left: 0 !important; padding-right: 0 !important; }
      /* Fixed gap: mirrors et-imgtext-first — the desktop side-by-side gap is
         horizontal padding, which does nothing once the columns stack, so
         give the first column a bottom gap instead. */
      .et-col1 .et-col-inner { padding-bottom: 16px !important; }
      .et-imgtext-img, .et-imgtext-text { display: block !important; width: 100% !important; padding-left: 0 !important; padding-right: 0 !important; }
      /* Fixed gap: an !important rule in a shared <style> cannot read props.gap. */
      .et-imgtext-first { padding-bottom: 16px !important; }
      .et-btn-full { width: 100% !important; }
      .et-outer-td { padding: 12px 8px !important; }
      .stack { display: block !important; width: 100% !important; }
    }
`

export interface RenderOptions {
  markers?: boolean
  canvas?: boolean
}

export const CANVAS_STYLES = `
    .et-col-blocks { min-height: 56px; }
    .et-raw:empty::before { content: 'Raw HTML block'; color: #8aa0b8; font-family: Arial, sans-serif; font-size: 13px; }
    /* The canvas iframe is exactly contentWidth wide, so drop the outer gutter:
       the content table then fills the frame edge to edge and the drag/select
       overlay lines up with what the user sees. */
    html { overflow-y: hidden; }
    .et-outer-td { padding: 0 !important; }
`

/**
 * Sanitise a value before injecting it into a CSS string inside a <style> tag.
 * Strips characters that could break out of a CSS declaration or property value
 * and end/re-open a <style> block (XSS vector).
 */
function safeCssValue(value: string): string {
  // Remove any occurrence of '<', '>', '{', '}' and HTML-special sequences
  // that could terminate a <style> block or inject new rules.
  return value.replace(/[<>{}]/g, '')
}

export function renderEmail(doc: EmailDoc, opts: RenderOptions = {}): string {
  const markers = opts.markers ?? false
  const canvas = opts.canvas ?? false
  const { settings } = doc
  const ctx = makeRenderCtx(markers, settings.contentWidth)
  const rows = doc.blocks.map((block) => renderBlock(block, ctx)).join('\n')
  const preheader =
    settings.preheader !== ''
      ? `  <div class="et-preheader" style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${esc(settings.preheader)}${'&#160;'.repeat(40)}</div>\n`
      : ''
  const canvasStyle = canvas ? `  <style>${CANVAS_STYLES}</style>\n` : ''
  // Canvas mode is always desktop: omit the mobile rules entirely rather than
  // fighting them with counter-!important declarations.
  const responsiveStyles = canvas ? '' : RESPONSIVE_STYLES
  // Sanitise user-controlled settings values before injecting into <style>.
  const safeLinkColor = safeCssValue(settings.linkColor ?? '#2b7fe0')
  const safeTextColor = safeCssValue(settings.textColor ?? '#333333')
  const safeFontFamily = safeCssValue(settings.fontFamily ?? DEFAULT_FONT)
  const globalStyles = `a { color: ${safeLinkColor}; } body { color: ${safeTextColor}; font-family: ${safeFontFamily}; }`
  const bodyBg = settings.bodyBg ?? '#f4f8fc'
  const containerBg = settings.containerBg ?? '#ffffff'
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${esc(settings.subject)}</title>
  <style>${BASE_STYLES}${responsiveStyles}
  ${globalStyles}</style>
  <!--[if mso]>
  <xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsToTheInch>96</o:PixelsToTheInch></o:OfficeDocumentSettings></xml>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${bodyBg};">
${canvasStyle}${preheader}  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${bodyBg}" class="et-outer" style="background-color:${bodyBg};">
    <tr>
      <td align="center" class="et-outer-td" style="padding:24px 12px;">
        <table role="presentation" width="${settings.contentWidth}" cellpadding="0" cellspacing="0" border="0" class="et-content" style="width:${settings.contentWidth}px;max-width:${settings.contentWidth}px;background-color:${containerBg};border-radius:10px;overflow:hidden;">
${rows}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
