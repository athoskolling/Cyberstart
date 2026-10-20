import { challengeById, lessonById } from '../data'
import type { AppData } from '../types'
import { addDays, dayKey, weekStart } from './dates'
import { completedModules } from './progress'

// XP é sempre DERIVADO dos dados (nunca armazenado), então não há como
// "ganhar XP" sem um evento real de aprendizagem. Limites diários evitam
// recompensar sessões excessivas ou cliques repetidos.

export const XP_RULES = [
  { label: 'Lição própria concluída', value: '20 XP' },
  { label: 'Estudo externo concluído', value: '30 XP' },
  { label: 'Módulo concluído', value: '100 XP' },
  { label: 'Desafio resolvido (1ª vez)', value: 'pontos do desafio (metade se usou dica)' },
  { label: 'Laboratório concluído', value: '80 XP' },
  { label: 'Sessão de estudo concluída', value: '1 XP a cada 5 min (máx. 120 min por sessão, 180 min por dia)' },
  { label: 'Revisão de flashcard', value: '2 XP (máx. 40 XP por dia)' },
  { label: 'Nota técnica criada', value: '5 XP (máx. 3 notas por dia)' },
  { label: 'Projeto concluído', value: '150 XP' },
  { label: 'Resposta de entrevista', value: '10 XP (máx. 3 por dia)' },
]

function capByDay<T>(items: T[], day: (t: T) => string, perDay: number): T[] {
  const count = new Map<string, number>()
  return items.filter((t) => {
    const k = day(t)
    const n = count.get(k) ?? 0
    if (n >= perDay) return false
    count.set(k, n + 1)
    return true
  })
}

export function xpBreakdown(d: AppData): { source: string; xp: number }[] {
  const out: { source: string; xp: number }[] = []
  let lessons = 0
  for (const [id, p] of Object.entries(d.lessonProgress)) {
    if (!p.done) continue
    lessons += lessonById.get(id)?.kind === 'external' ? 30 : 20
  }
  out.push({ source: 'Lições', xp: lessons })
  out.push({ source: 'Módulos', xp: completedModules(d).length * 100 })

  const solved = new Map<string, boolean>()
  for (const a of [...d.attempts].sort((x, y) => x.at.localeCompare(y.at))) {
    if (a.correct && !solved.has(a.challengeId)) solved.set(a.challengeId, a.hintUsed)
  }
  let ch = 0
  for (const [id, hint] of solved) {
    const pts = challengeById.get(id)?.points ?? 0
    ch += hint ? Math.floor(pts / 2) : pts
  }
  out.push({ source: 'Desafios', xp: ch })

  out.push({ source: 'Laboratórios', xp: Object.values(d.labLogs).filter((l) => l.status === 'concluido').length * 80 })

  const perDay = new Map<string, number>()
  let sess = 0
  for (const s of d.sessions) {
    if (s.status !== 'concluida' || !s.actualMin) continue
    const used = perDay.get(s.date) ?? 0
    const allowed = Math.max(0, Math.min(Math.min(s.actualMin, 120), 180 - used))
    perDay.set(s.date, used + allowed)
    sess += Math.floor(allowed / 5)
  }
  out.push({ source: 'Sessões de estudo', xp: sess })

  const reviewsPerDay = new Map<string, number>()
  for (const st of Object.values(d.cardState)) for (const h of st.history) {
    const k = dayKey(new Date(h.at))
    reviewsPerDay.set(k, (reviewsPerDay.get(k) ?? 0) + 1)
  }
  let rev = 0
  for (const n of reviewsPerDay.values()) rev += Math.min(40, n * 2)
  out.push({ source: 'Revisões', xp: rev })

  out.push({ source: 'Notas', xp: capByDay(d.notes, (n) => dayKey(new Date(n.createdAt)), 3).length * 5 })
  out.push({ source: 'Projetos', xp: d.projects.filter((p) => p.status === 'concluido').length * 150 })
  out.push({ source: 'Entrevistas', xp: capByDay(d.interview, (i) => dayKey(new Date(i.at)), 3).length * 10 })
  return out
}

export function totalXp(d: AppData): number {
  return xpBreakdown(d).reduce((s, x) => s + x.xp, 0)
}

/** Nível n começa em 50·n·(n−1) XP: 0, 100, 300, 600, 1000… */
export function levelFor(xp: number): { level: number; current: number; next: number; into: number; span: number } {
  let n = 1
  while (50 * (n + 1) * n <= xp) n++
  const current = 50 * n * (n - 1)
  const next = 50 * (n + 1) * n
  return { level: n, current, next, into: xp - current, span: next - current }
}

/** Dias com alguma atividade registrada (chaves YYYY-MM-DD). */
export function activeDays(d: AppData): Set<string> {
  const s = new Set<string>()
  for (const a of d.activity) s.add(dayKey(new Date(a.at)))
  for (const st of Object.values(d.cardState)) for (const h of st.history) s.add(dayKey(new Date(h.at)))
  return s
}

/**
 * Sequência atual. Não penaliza severamente: a sequência continua se o
 * último dia ativo foi hoje OU ontem (o dia de hoje ainda não acabou).
 */
export function streak(d: AppData, today = dayKey()): number {
  const days = activeDays(d)
  let cursor = days.has(today) ? today : addDays(today, -1)
  let n = 0
  while (days.has(cursor)) {
    n++
    cursor = addDays(cursor, -1)
  }
  return n
}

/** Consistência: dias ativos nas últimas 4 semanas. */
export function consistency(d: AppData, today = dayKey()): { active: number; of: number } {
  const days = activeDays(d)
  let active = 0
  for (let i = 0; i < 28; i++) if (days.has(addDays(today, -i))) active++
  return { active, of: 28 }
}

export function minutesStudied(d: AppData, from?: string, to?: string): number {
  return d.sessions
    .filter((s) => s.status === 'concluida' && (!from || s.date >= from) && (!to || s.date <= to))
    .reduce((sum, s) => sum + (s.actualMin ?? 0), 0)
}

export function solvedChallenges(d: AppData): Set<string> {
  return new Set(d.attempts.filter((a) => a.correct).map((a) => a.challengeId))
}

export interface Mission {
  id: string
  label: string
  progress: number
  target: number
}

export function weeklyMissions(d: AppData, today = dayKey()): Mission[] {
  const ws = weekStart(today)
  const inWeek = (iso: string) => dayKey(new Date(iso)) >= ws
  const lessons = d.activity.filter((a) => a.type === 'licao' && inWeek(a.at)).length
  const reviews = Object.values(d.cardState).reduce((s, st) => s + st.history.filter((h) => inWeek(h.at)).length, 0)
  const solved = new Set(d.attempts.filter((a) => a.correct && inWeek(a.at)).map((a) => a.challengeId)).size
  const minutes = minutesStudied(d, ws)
  const target = Math.max(60, Math.round(d.settings.weeklyHours * 60 * 0.75))
  return [
    { id: 'w-min', label: `Estudar ${Math.round(target / 60)} h (75% da sua meta semanal)`, progress: Math.min(minutes, target), target },
    { id: 'w-lessons', label: 'Concluir 3 lições', progress: Math.min(lessons, 3), target: 3 },
    { id: 'w-reviews', label: 'Fazer 20 revisões de flashcards', progress: Math.min(reviews, 20), target: 20 },
    { id: 'w-challenges', label: 'Resolver 3 desafios', progress: Math.min(solved, 3), target: 3 },
  ]
}

export interface Achievement {
  id: string
  title: string
  description: string
  unlocked: boolean
}

export function achievements(d: AppData): Achievement[] {
  const labDone = Object.values(d.labLogs).some((l) => l.status === 'concluido')
  const pyLab = d.labLogs['lab-py-contador']?.status === 'concluido'
  const sessionsDone = d.sessions.filter((s) => s.status === 'concluida').length
  const reviews = Object.values(d.cardState).reduce((s, st) => s + st.history.length, 0)
  const solved = solvedChallenges(d).size
  const consistent = consistency(d).active
  const reportNote = d.notes.some((n) => ['Incidente', 'Vulnerabilidade', 'Laboratório'].includes(n.category) && n.body.length > 200)
  const list: (Omit<Achievement, 'unlocked'> & { test: boolean })[] = [
    { id: 'a-first-lesson', title: 'Primeiro passo', description: 'Concluir a primeira lição.', test: Object.values(d.lessonProgress).some((p) => p.done) },
    { id: 'a-first-session', title: 'Primeira sessão', description: 'Concluir uma sessão de estudo registrada.', test: sessionsDone > 0 },
    { id: 'a-first-module', title: 'Primeiro módulo', description: 'Concluir um módulo do roadmap.', test: completedModules(d).length > 0 },
    { id: 'a-first-script', title: 'Primeiro script Python', description: 'Concluir o laboratório "Script Python: contar eventos".', test: pyLab },
    { id: 'a-first-lab', title: 'Mãos na massa', description: 'Concluir o primeiro laboratório.', test: labDone },
    { id: 'a-week', title: 'Semana consistente', description: 'Estudar em 5 dias diferentes nos últimos 28 dias.', test: consistent >= 5 },
    { id: 'a-report', title: 'Primeiro relatório técnico', description: 'Escrever uma nota de incidente, vulnerabilidade ou laboratório com conteúdo real.', test: reportNote },
    { id: 'a-portfolio', title: 'Primeiro projeto de portfólio', description: 'Concluir um projeto com link do GitHub.', test: d.projects.some((p) => p.status === 'concluido' && p.github.trim()) },
    { id: 'a-challenges10', title: 'Solucionador', description: 'Resolver 10 desafios diferentes.', test: solved >= 10 },
    { id: 'a-reviews50', title: 'Memória afiada', description: 'Fazer 50 revisões de flashcards.', test: reviews >= 50 },
    { id: 'a-phase1', title: 'Fundação lógica', description: 'Concluir todos os módulos da Fase 1.', test: ['m-logica-1', 'm-logica-2'].every((id) => d.moduleProgress[id]?.completedAt) },
    { id: 'a-applied', title: 'Primeira candidatura', description: 'Registrar uma candidatura enviada.', test: d.jobs.some((j) => ['candidatado', 'entrevista', 'oferta'].includes(j.status)) },
  ]
  return list.map(({ test, ...a }) => ({ ...a, unlocked: test }))
}
