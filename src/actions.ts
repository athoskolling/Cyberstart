import { useCallback, useMemo } from 'react'
import { lessonById, moduleById } from './data'
import { uid } from './lib/id'
import { canComplete } from './lib/progress'
import { useStore, useToast } from './store'
import type { ModuleProgress } from './types'

const emptyMp = (): ModuleProgress => ({ checklist: {}, notes: '' })

/** Operações de domínio: mantêm progresso, histórico e conquistas coerentes. */
export function useActions() {
  const store = useStore()
  const { toast } = useToast()
  const { updateMeta, log } = store
  const startModule = useCallback(
    (moduleId: string) =>
      updateMeta('moduleProgress', (mp) =>
        mp[moduleId]?.startedAt ? mp : { ...mp, [moduleId]: { ...(mp[moduleId] ?? emptyMp()), startedAt: new Date().toISOString() } },
      ),
    [updateMeta],
  )

  const setLesson = useCallback(
    (lessonId: string, done: boolean) => {
      const l = lessonById.get(lessonId)!
      updateMeta('lessonProgress', (lp) => ({
        ...lp,
        [lessonId]: { ...lp[lessonId], done, completedAt: done ? new Date().toISOString() : undefined },
      }))
      updateMeta('moduleProgress', (mp) => {
        const cur = mp[l.moduleId] ?? emptyMp()
        return { ...mp, [l.moduleId]: { ...cur, startedAt: cur.startedAt ?? new Date().toISOString(), lastLessonId: lessonId } }
      })
      if (done) {
        log('licao', `Concluiu a lição "${l.title}"`, lessonId)
        toast('Lição concluída')
      }
    },
    [updateMeta, log, toast],
  )

  const visitLesson = useCallback(
    (lessonId: string) => {
      const l = lessonById.get(lessonId)
      if (!l) return
      updateMeta('moduleProgress', (mp) => {
        const cur = mp[l.moduleId] ?? emptyMp()
        if (cur.lastLessonId === lessonId) return mp
        return { ...mp, [l.moduleId]: { ...cur, lastLessonId: lessonId } }
      })
    },
    [updateMeta],
  )

  const completeModule = useCallback(
    (moduleId: string, done: boolean) => {
      const m = moduleById.get(moduleId)!
      if (done && !canComplete(store.getData(), m)) {
        toast('Conclua todas as lições do módulo antes de marcá-lo como concluído.', 'info')
        return
      }
      updateMeta('moduleProgress', (mp) => ({
        ...mp,
        [moduleId]: { ...(mp[moduleId] ?? emptyMp()), completedAt: done ? new Date().toISOString() : undefined },
      }))
      if (done) {
        log('modulo', `Concluiu o módulo "${m.title}"`, moduleId)
        toast(`Módulo "${m.title}" concluído`, 'ok')
      }
    },
    [updateMeta, log, toast, store],
  )

  const toggleChecklist = useCallback(
    (moduleId: string, index: number) =>
      updateMeta('moduleProgress', (mp) => {
        const cur = mp[moduleId] ?? emptyMp()
        return {
          ...mp,
          [moduleId]: { ...cur, startedAt: cur.startedAt ?? new Date().toISOString(), checklist: { ...cur.checklist, [index]: !cur.checklist[index] } },
        }
      }),
    [updateMeta],
  )

  const setModuleNotes = useCallback(
    (moduleId: string, notes: string) => updateMeta('moduleProgress', (mp) => ({ ...mp, [moduleId]: { ...(mp[moduleId] ?? emptyMp()), notes } })),
    [updateMeta],
  )

  const recordAttempt = useCallback(
    (challengeId: string, title: string, correct: boolean, answer: string, hintUsed: boolean, firstSolve: boolean) => {
      store.upsert('attempts', { id: uid('at'), challengeId, at: new Date().toISOString(), correct, answer, hintUsed })
      if (correct && firstSolve) {
        log('desafio', `Resolveu o desafio "${title}"`, challengeId)
      }
    },
    [store, log],
  )

  return useMemo(
    () => ({ startModule, setLesson, visitLesson, completeModule, toggleChecklist, setModuleNotes, recordAttempt }),
    [startModule, setLesson, visitLesson, completeModule, toggleChecklist, setModuleNotes, recordAttempt],
  )
}
