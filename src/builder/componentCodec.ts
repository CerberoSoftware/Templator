import type { Block } from './model'
import { makeRenderCtx, renderBlock } from './blocks'
import { parseEmailHtmlDetailed } from './parser'

export function blockToComponentHtml(block: Block): string {
  const ctx = makeRenderCtx(false, 600)
  return renderBlock(block, ctx)
}

export function componentHtmlToBlocks(html: string): Block[] | null {
  const shell = `<!DOCTYPE html>
<html lang="en"><head><title>component</title></head>
<body style="margin:0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="et-outer" style="background-color:#f4f8fc;">
<tr><td align="center" class="et-outer-td" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="et-content" style="width:600px;max-width:600px;background-color:#ffffff;">
${html}
</table>
</td></tr>
</table>
</body></html>`
  const result = parseEmailHtmlDetailed(shell)
  if (result === null || result.doc.blocks.length === 0) return null
  return result.doc.blocks
}
