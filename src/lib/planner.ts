import { CHALLENGES, LESSONS, MODULES, SEED_CARDS, lessonById } from '../data'
import type { AppData } from '../types'
import { addDays, dayKey, parseDay, weekStart } from './dates'
import { isDue } from './srs'
import { missingPrereqs, moduleStatus } from './progress'

export interface Suggestion {
  title: string
  minutes: number
  moduleId?: string
  reason: string
  priority: 'alta' | 'media' | 'baixa'
}

/**
 * Sequência de estudos sugerida para a semana. Regras, em ordem:
 * 1. Revisões de flashcards pendentes (curtas, alta prioridade).
 * 2. Desafios tentados e não resolvidos (dificuldades registradas).
 * 3. Lições pendentes de módulos em andamento.
 * 4. Lições de módulos disponíveis (pré-requisitos ok), priorizando as
 *    categorias marcadas como objetivo de carreira nas configurações.
 * O total respeita o tempo semanal disponível menos o que já está agendado.
 */
export function suggestWeek(d: AppData, today = dayKey()): { items: Suggestion[]; budget: number; planned: number } {
  const ws = weekStart(today)
  const we = addDays(ws, 6)
  const planned = d.sessions.filter((s) => s.date >= ws && s.date <= we && s.status !== 'pulada').reduce((a, s) => a + (s.status === 'concluida' ? s.actualMin ?? 0 : s.plannedMin), 0)
  const budget = Math.max(0, d.settings.weeklyHours * 60 - planned)
  const items: Suggestion[] = []
  let left = budget
  const push = (s: Suggestion) => {
    if (left < Math.min(s.minutes, 15)) return false
    const m = Math.min(s.minutes, left)
    items.push({ ...s, minutes: m })
    left -= m
    return true
  }
  const plannedTitles = new Set(d.sessions.filter((s) => s.status === 'planejada').map((s) => s.title))

  const due = [...SEED_CARDS.map((c) => c.id), ...d.userCards.map((c) => c.id)].filter((id) => d.cardState[id] && isDue(d.cardState[id], today)).length
  if (due > 0) push({ title: `Revisar ${due} flashcards`, minutes: Math.min(30, Math.max(10, Math.ceil(due / 2))), reason: 'Revisões vencidas: revisar no dia certo é o que fixa a memória.', priority: 'alta' })

  const failed = CHALLENGES.filter((c) => {
    const at = d.attempts.filter((a) => a.challengeId === c.id)
    return at.length > 0 && !at.some((a) => a.correct)
  })
  if (failed.length) push({ title: `Revisar ${failed.length} desafio(s) com erro`, minutes: 20, reason: 'Você registrou dificuldade nesses desafios — revisar agora evita lacunas.', priority: 'alta' })

  const prio = new Set(d.settings.priorityCategories)
  const inProgress = MODULES.filter((m) => moduleStatus(d, m) === 'em_andamento')
  const available = MODULES.filter((m) => moduleStatus(d, m) === 'disponivel' && missingPrereqs(d, m).length === 0).sort(
    (a, b) => Number(prio.has(b.category)) - Number(prio.has(a.category)) || a.phase - b.phase,
  )
  for (const m of [...inProgress, ...available]) {
    for (const lid of m.lessons) {
      if (d.lessonProgress[lid]?.done) continue
      const l = lessonById.get(lid)!
      if (plannedTitles.has(l.title)) continue
      const reason = inProgress.includes(m)
        ? `Continua o módulo em andamento "${m.title}".`
        : prio.has(m.category)
          ? `Pré-requisitos ok e categoria prioritária para sua carreira.`
          : `Próximo passo do roadmap: pré-requisitos já concluídos.`
      if (!push({ title: l.title, minutes: Math.min(l.minutes, 120), moduleId: m.id, reason, priority: inProgress.includes(m) ? 'alta' : 'media' })) return { items, budget, planned }
    }
  }
  return { items, budget, planned }
}

/** Distribui sugestões nos dias preferidos restantes da semana (a partir de hoje). */
export function distribute(items: Suggestion[], preferredDays: number[], today = dayKey()): string[] {
  const ws = weekStart(today)
  const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i)).filter((k) => k >= today)
  const pref = days.filter((k) => preferredDays.includes(parseDay(k).getDay()))
  const pool = pref.length ? pref : days
  return items.map((_, i) => pool[i % pool.length])
}

export const TOTAL_LESSON_MIN = LESSONS.reduce((s, l) => s + l.minutes, 0)
