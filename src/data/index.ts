import type { Lesson } from '../types'
import { LESSONS_FUNDAMENTOS } from './lessons-fundamentos'
import { LESSONS_REDES_LINUX } from './lessons-redes-linux'
import { LESSONS_SEGURANCA } from './lessons-seguranca'

export * from './roadmap'
export * from './resources'
export * from './challenges'
export * from './labs'
export * from './cards'
export * from './career'

export const LESSONS: Lesson[] = [...LESSONS_FUNDAMENTOS, ...LESSONS_REDES_LINUX, ...LESSONS_SEGURANCA]
export const lessonById = new Map(LESSONS.map((l) => [l.id, l]))
