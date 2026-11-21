import type { ReactNode } from 'react'
import { safeHref } from './content'
import type { RichNode, RichContent } from './content'

function node(value: RichNode, index: number): ReactNode {
  const children = value.children?.map(node)
  if (value.type === 'text') {
    let text: ReactNode = value.text || ''
    const format = typeof value.format === 'number' ? value.format : 0
    if (format & 1) text = <strong>{text}</strong>
    if (format & 2) text = <em>{text}</em>
    if (format & 8) text = <u>{text}</u>
    return <span key={index}>{text}</span>
  }
  switch (value.type) {
    case 'paragraph': return <p key={index}>{children}</p>
    case 'heading': return value.tag === 'h3' || value.tag === 'h4' ? <h3 key={index}>{children}</h3> : <h2 key={index}>{children}</h2>
    case 'list': return value.tag === 'ol' ? <ol key={index}>{children}</ol> : <ul key={index}>{children}</ul>
    case 'listitem': return <li key={index}>{children}</li>
    case 'link': case 'autolink': return <a key={index} href={safeHref(value.fields?.url || value.url)}>{children}</a>
    case 'quote': return <blockquote key={index}>{children}</blockquote>
    case 'linebreak': return <br key={index} />
    case 'horizontalrule': return <hr key={index} />
    default: return <span key={index}>{children}</span>
  }
}
export default function RichText({ content }: { content: RichContent }) {
  return <div className="cms-prose">{content?.root.children?.map(node)}</div>
}
