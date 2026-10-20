import type { Challenge } from '../types'

// Correção declarativa e segura: só compara valores. Nunca executa código.

export function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
}

export function checkText(input: string, accept: string[]): boolean {
  const n = normalize(input)
  return n.length > 0 && accept.some((a) => normalize(a) === n)
}

export type ChallengeAnswer =
  | { kind: 'option'; index: number }
  | { kind: 'text'; value: string }
  | { kind: 'order'; items: string[] }
  | { kind: 'match'; map: Record<string, string> }

export function grade(c: Challenge, a: ChallengeAnswer): boolean {
  switch (c.type) {
    case 'mcq':
    case 'tf':
    case 'error':
      return a.kind === 'option' && a.index === c.answer
    case 'fill':
      return a.kind === 'text' && checkText(a.value, c.accept ?? [])
    case 'order':
      return a.kind === 'order' && a.items.length === c.items!.length && a.items.every((x, i) => x === c.items![i])
    case 'match':
      return a.kind === 'match' && c.pairs!.every(([l, r]) => a.map[l] === r)
  }
}

export function describeAnswer(c: Challenge, a: ChallengeAnswer): string {
  if (a.kind === 'option') return c.options?.[a.index] ?? String(a.index)
  if (a.kind === 'text') return a.value
  if (a.kind === 'order') return a.items.join(' → ')
  return Object.entries(a.map)
    .map(([l, r]) => `${l} = ${r}`)
    .join('; ')
}

/** Embaralhamento determinístico por id (mesma ordem a cada visita, sem revelar a resposta). */
export function seededShuffle<T>(arr: T[], seed: string): T[] {
  let h = 2166136261
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0
    const j = h % (i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  // garante que não venha já na ordem correta
  if (out.length > 1 && out.every((x, i) => x === arr[i])) out.push(out.shift()!)
  return out
}
