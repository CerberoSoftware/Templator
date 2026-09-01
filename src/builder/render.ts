import type { EmailDoc } from './model'
import { makeRenderCtx, renderBlock } from './blocks'
import { esc } from './htmlUtils'

export const BASE_STYLES = `
    .et-p { margin: 0 0 12px; }
    .et-last { margin-bottom: 0; }
    .et-h { margin: 0; }
    .et-col { border-collapse: collapse; }
    .stack { display: inline-block; vertical-align: top; }
    @media only screen and (max-width: 620px) {
      .et-content { width: 100% !important; max-width: 100% !important; }
      .et-col { width: 100% !important; max-width: 100% !important; display: block !important; }
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
    /* Cancel any @media stacking — canvas preview is always desktop width */
    .stack:not(.et-imgtext-img):not(.et-imgtext-text) { display: inline-block !important; vertical-align: top !important; width: auto !important; }
    .et-col { display: table-cell !important; }
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
  // Sanitise user-controlled settings values before injecting into <style>.
  const safeLinkColor = safeCssValue(settings.linkColor ?? '#2b7fe0')
  const safeTextColor = safeCssValue(settings.textColor ?? '#333333')
  const safeFontFamily = safeCssValue(settings.fontFamily ?? 'Arial, Helvetica, sans-serif')
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
  <style>${BASE_STYLES}
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
