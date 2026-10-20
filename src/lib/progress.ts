import { LESSONS, MODULES, PHASES, lessonById, moduleById } from '../data'
import type { AppData, Category, Module } from '../types'

export type ModuleStatus = 'bloqueado' | 'disponivel' | 'em_andamento' | 'concluido'

export const STATUS_LABEL: Record<ModuleStatus, string> = {
  bloqueado: 'Pré-requisitos pendentes',
  disponivel: 'Disponível',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
}

export function lessonsDone(d: AppData, m: Module): number {
  return m.lessons.filter((id) => d.lessonProgress[id]?.done).length
}

export function checklistDone(d: AppData, m: Module): number {
  const c = d.moduleProgress[m.id]?.checklist ?? {}
  return m.checklist.filter((_, i) => c[i]).length
}

/** Fração 0..1 do módulo: lições pesam 70%, checklist 30%. */
export function moduleFraction(d: AppData, m: Module): number {
  if (d.moduleProgress[m.id]?.completedAt) return 1
  const l = m.lessons.length ? lessonsDone(d, m) / m.lessons.length : 0
  const c = m.checklist.length ? checklistDone(d, m) / m.checklist.length : 0
  return l * 0.7 + c * 0.3
}

export function missingPrereqs(d: AppData, m: Module): Module[] {
  return m.prereqs.map((id) => moduleById.get(id)!).filter((p) => !d.moduleProgress[p.id]?.completedAt)
}

export function moduleStatus(d: AppData, m: Module): ModuleStatus {
  const p = d.moduleProgress[m.id]
  if (p?.completedAt) return 'concluido'
  const started = !!p?.startedAt || lessonsDone(d, m) > 0 || checklistDone(d, m) > 0
  if (started) return 'em_andamento'
  if (missingPrereqs(d, m).length) return 'bloqueado'
  return 'disponivel'
}

/** O módulo pode ser marcado como concluído? Todas as lições feitas. */
export function canComplete(d: AppData, m: Module): boolean {
  return lessonsDone(d, m) === m.lessons.length
}

export function roadmapPercent(d: AppData): number {
  const total = MODULES.reduce((s, m) => s + m.minutes, 0)
  const done = MODULES.reduce((s, m) => s + m.minutes * moduleFraction(d, m), 0)
  return Math.round((done / total) * 100)
}

export function phaseFraction(d: AppData, phase: number): number {
  const ms = MODULES.filter((m) => m.phase === phase)
  return ms.reduce((s, m) => s + moduleFraction(d, m), 0) / ms.length
}

export function completedModules(d: AppData): Module[] {
  return MODULES.filter((m) => d.moduleProgress[m.id]?.completedAt)
}

export interface Recommendation {
  module: Module
  lessonId: string | null
  reason: string
  remainingMin: number
}

/**
 * Próxima atividade recomendada — regra determinística, sem IA:
 * 1) módulo em andamento mais antigo no roadmap;
 * 2) senão, primeiro módulo disponível (pré-requisitos ok), preferindo
 *    categorias prioritárias definidas nas configurações;
 * 3) dentro do módulo, a primeira lição ainda não concluída.
 */
export function recommend(d: AppData): Recommendation | null {
  const inProgress = MODULES.filter((m) => moduleStatus(d, m) === 'em_andamento')
  const available = MODULES.filter((m) => moduleStatus(d, m) === 'disponivel')
  const prio = new Set<Category>(d.settings.priorityCategories)

  let module: Module | undefined
  let reason = ''
  if (inProgress.length) {
    module = inProgress[0]
    const last = d.moduleProgress[module.id]?.lastLessonId
    reason = last
      ? `Você parou em "${lessonById.get(last)?.title ?? 'uma lição'}". Terminar o que começou consolida o aprendizado.`
      : 'Este módulo já está em andamento e é o mais cedo no roadmap.'
  } else if (available.length) {
    const preferred = available.find((m) => prio.has(m.category))
    module = preferred ?? available[0]
    const ph = PHASES.find((p) => p.n === module!.phase)!
    reason =
      module.prereqs.length === 0
        ? `É o ponto de partida da Fase ${ph.n} e não exige pré-requisitos.`
        : `Os pré-requisitos (${module.prereqs.map((id) => moduleById.get(id)!.title).join(', ')}) já estão concluídos.`
    if (preferred) reason += ' Também está numa categoria que você marcou como prioritária.'
  }
  if (!module) return null
  const pending = module.lessons.filter((id) => !d.lessonProgress[id]?.done)
  const lessonId = pending[0] ?? null
  const remainingMin = pending.reduce((s, id) => s + (lessonById.get(id)?.minutes ?? 0), 0)
  return { module, lessonId, reason, remainingMin }
}

/** Estimativa de progresso por categoria (0..100). Não é medida de conhecimento. */
export function categoryDistribution(d: AppData): { category: Category; value: number }[] {
  const cats: Category[] = ['programacao', 'redes', 'linux', 'seg_fundamental', 'seg_defensiva', 'seg_ofensiva', 'web']
  return cats.map((category) => {
    const ms = MODULES.filter((m) => m.category === category)
    if (!ms.length) return { category, value: 0 }
    const total = ms.reduce((s, m) => s + m.minutes, 0)
    const done = ms.reduce((s, m) => s + m.minutes * moduleFraction(d, m), 0)
    return { category, value: Math.round((done / total) * 100) }
  })
}

export function nextLessonInModule(m: Module, currentId: string): string | null {
  const i = m.lessons.indexOf(currentId)
  return i >= 0 && i < m.lessons.length - 1 ? m.lessons[i + 1] : null
}

export const TOTAL_LESSONS = LESSONS.length
