import type { Block, MarkDef, Span } from './sanity'

function escape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderSpan(span: Span, markDefs: MarkDef[]): string {
  let text = escape(span.text)
  if (!span.marks?.length) return text

  for (const mark of [...span.marks].reverse()) {
    const def = markDefs.find((m) => m._key === mark)
    if (def?._type === 'link' && def.href) {
      text = `<a href="${escape(def.href)}" target="_blank" rel="noopener noreferrer">${text}</a>`
    } else {
      if (mark === 'strong') text = `<strong>${text}</strong>`
      else if (mark === 'em') text = `<em>${text}</em>`
      else if (mark === 'underline') text = `<u>${text}</u>`
      else if (mark === 'code') text = `<code>${text}</code>`
      else if (mark === 'strike-through') text = `<s>${text}</s>`
    }
  }
  return text
}

export function portableTextToHtml(blocks: Block[]): string {
  if (!blocks?.length) return ''

  const parts: string[] = []

  for (const block of blocks) {
    if (block._type === 'block') {
      const markDefs = block.markDefs ?? []
      const inner = (block.children ?? []).map((s) => renderSpan(s, markDefs)).join('')
      const style = block.style ?? 'normal'

      if (style === 'h1') parts.push(`<h1>${inner}</h1>`)
      else if (style === 'h2') parts.push(`<h2>${inner}</h2>`)
      else if (style === 'h3') parts.push(`<h3>${inner}</h3>`)
      else if (style === 'h4') parts.push(`<h4>${inner}</h4>`)
      else if (style === 'blockquote') parts.push(`<blockquote>${inner}</blockquote>`)
      else parts.push(`<p>${inner}</p>`)
    } else if (block._type === 'image' && block.asset?.url) {
      const caption = block.caption ? `<figcaption>${escape(block.caption)}</figcaption>` : ''
      parts.push(
        `<figure><img src="${escape(block.asset.url)}" alt="${escape(block.caption ?? '')}" loading="lazy" />${caption}</figure>`
      )
    }
  }

  return parts.join('\n')
}
