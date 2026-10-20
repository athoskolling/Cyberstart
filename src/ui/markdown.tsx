import { Fragment, type ReactNode } from 'react'
import { CodeBlock } from './ui'

// Renderizador de Markdown SEGURO: converte texto em elementos React.
// Nunca usa innerHTML; HTML no texto aparece literalmente. Links só http(s)/mailto.

const SAFE_URL = /^(https?:\/\/|mailto:)/i

export function inline(text: string, keyBase = 'i'): ReactNode[] {
  const out: ReactNode[] = []
  // ordem: código, link, negrito, itálico
  const re = /(`[^`]+`)|\[([^\]]+)\]\(([^)\s]+)\)|(\*\*[^*]+\*\*)|(\*[^*\s][^*]*\*|_[^_\s][^_]*_)/g
  let last = 0
  let m: RegExpExecArray | null
  let k = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const key = `${keyBase}-${k++}`
    if (m[1]) out.push(<code key={key}>{m[1].slice(1, -1)}</code>)
    else if (m[2]) {
      const href = m[3]
      out.push(
        SAFE_URL.test(href) ? (
          <a key={key} href={href} target="_blank" rel="noopener noreferrer">
            {m[2]}
          </a>
        ) : (
          <span key={key}>{m[0]}</span>
        ),
      )
    } else if (m[4]) out.push(<strong key={key}>{m[4].slice(2, -2)}</strong>)
    else if (m[5]) out.push(<em key={key}>{m[5].slice(1, -1)}</em>)
    last = re.lastIndex
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

export function Markdown({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const blocks: ReactNode[] = []
  let i = 0
  let k = 0
  while (i < lines.length) {
    const line = lines[i]
    const key = `b${k++}`
    if (/^```/.test(line)) {
      const buf: string[] = []
      i++
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++])
      i++
      blocks.push(<CodeBlock key={key} code={buf.join('\n')} />)
      continue
    }
    const h = /^(#{1,3})\s+(.*)$/.exec(line)
    if (h) {
      const Tag = (['h1', 'h2', 'h3'] as const)[h[1].length - 1]
      blocks.push(<Tag key={key}>{inline(h[2], key)}</Tag>)
      i++
      continue
    }
    if (/^---+\s*$/.test(line)) {
      blocks.push(<hr key={key} className="divider" />)
      i++
      continue
    }
    if (/^>\s?/.test(line)) {
      const buf: string[] = []
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''))
      blocks.push(<blockquote key={key}>{inline(buf.join(' '), key)}</blockquote>)
      continue
    }
    if (/^\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\|[\s:-|]+\|\s*$/.test(lines[i + 1])) {
      const cells = (l: string) => l.trim().slice(1, -1).split('|').map((c) => c.trim())
      const head = cells(line)
      i += 2
      const rows: string[][] = []
      while (i < lines.length && /^\|.*\|\s*$/.test(lines[i])) rows.push(cells(lines[i++]))
      blocks.push(
        <div key={key} className="table-wrap">
          <table>
            <thead>
              <tr>{head.map((c, j) => <th key={j}>{inline(c, `${key}h${j}`)}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri}>{r.map((c, j) => <td key={j}>{inline(c, `${key}r${ri}c${j}`)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>,
      )
      continue
    }
    if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\./.test(line)
      const items: string[] = []
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*([-*]|\d+\.)\s+/, ''))
      const L = ordered ? 'ol' : 'ul'
      blocks.push(
        <L key={key}>
          {items.map((it, j) => {
            const task = /^\[( |x)\]\s*(.*)$/i.exec(it)
            return (
              <li key={j} style={task ? { listStyle: 'none', marginLeft: '-1.2em' } : undefined}>
                {task ? (
                  <>
                    <span aria-hidden>{task[1].toLowerCase() === 'x' ? '☑' : '☐'} </span>
                    {inline(task[2], `${key}${j}`)}
                  </>
                ) : (
                  inline(it, `${key}${j}`)
                )}
              </li>
            )
          })}
        </L>,
      )
      continue
    }
    if (!line.trim()) {
      i++
      continue
    }
    const buf: string[] = []
    while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s|```|>|\s*([-*]|\d+\.)\s|\|)/.test(lines[i])) buf.push(lines[i++])
    if (!buf.length) buf.push(lines[i++])
    blocks.push(
      <p key={key}>
        {buf.map((b, j) => (
          <Fragment key={j}>
            {j > 0 && <br />}
            {inline(b, `${key}${j}`)}
          </Fragment>
        ))}
      </p>,
    )
  }
  return <div className="prose">{blocks}</div>
}
