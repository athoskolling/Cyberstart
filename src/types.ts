// Modelo de dados do CyberStart.
// Conteúdo educacional (estático, versionado no código) fica separado
// dos dados do usuário (dinâmicos, persistidos no IndexedDB).

// ───────────── Conteúdo educacional ─────────────

export type Category =
  | 'programacao'
  | 'redes'
  | 'linux'
  | 'seg_fundamental'
  | 'seg_defensiva'
  | 'seg_ofensiva'
  | 'web'

export type Difficulty = 'iniciante' | 'basico' | 'intermediario' | 'avancado'

export interface Phase {
  n: number
  title: string
  summary: string
  why: string
}

/** Exercício corrigível de uma lição: escolha ou texto curto (sem eval). */
export type LessonExercise =
  | { kind: 'choice'; prompt: string; options: string[]; answer: number; explain: string }
  | { kind: 'text'; prompt: string; accept: string[]; explain: string; placeholder?: string }

export interface Lesson {
  id: string
  moduleId: string
  title: string
  minutes: number
  kind: 'internal' | 'external'
  // Lição própria: estrutura pedagógica em 8 partes
  what?: string
  why?: string
  how?: string
  example?: { text: string; code?: string }
  mistake?: string
  exercise?: LessonExercise
  verify?: string
  next?: string
  // Lição externa: estudo fora da plataforma, sinalizado como tal
  resourceId?: string
  url?: string
  guidance?: string
}

export interface Module {
  id: string
  phase: number
  title: string
  description: string
  category: Category
  difficulty: Difficulty
  minutes: number
  objectives: string[]
  prereqs: string[]
  resources: string[]
  lessons: string[]
  challenges: string[]
  labs: string[]
  checklist: string[]
  criteria: string
}

export type CostType = 'gratuito' | 'gratuito_limitado' | 'freemium' | 'pago'

export interface Resource {
  id: string
  title: string
  org: string
  description: string
  category: Category
  language: string
  level: Difficulty
  cost: CostType
  costNote: string
  certificate?: string
  duration?: string
  url: string
  prereqs: string
  modules: string[]
  verifiedAt?: string
  custom?: boolean
}

export type ChallengeCategory = 'logica' | 'python' | 'linux' | 'redes' | 'seguranca' | 'logs' | 'web'

export type ChallengeType = 'mcq' | 'tf' | 'order' | 'match' | 'fill' | 'error'

export interface Challenge {
  id: string
  title: string
  category: ChallengeCategory
  type: ChallengeType
  difficulty: Difficulty
  points: number
  prompt: string
  context?: string
  code?: string
  log?: string
  hint?: string
  explanation: string
  options?: string[]
  answer?: number
  optionFeedback?: Record<number, string>
  items?: string[]
  pairs?: [string, string][]
  accept?: string[]
}

export interface Lab {
  id: string
  title: string
  category: Category
  difficulty: Difficulty
  minutes: number
  objective: string
  environment: string
  prereqs: string
  instructions: string
  steps: string[]
  externalUrl?: string
  dataset?: { name: string; content: string }
  safety?: string
}

export interface SeedCard {
  id: string
  front: string
  back: string
  deck: string
  tags: string[]
}

export interface ProjectTemplate {
  id: string
  title: string
  description: string
  objectives: string[]
  tech: string[]
  category: Category
  checklist: string[]
}

export interface RoleMatrix {
  id: string
  title: string
  summary: string
  competencies: { skill: string; level: 'essencial' | 'diferencial'; modules: string[] }[]
}

export interface InterviewQuestion {
  id: string
  type: 'tecnica' | 'comportamental'
  question: string
  guidance: string
  keyPoints: { label: string; keywords: string[] }[]
}

// ───────────── Dados do usuário ─────────────

export type Accent = 'violeta' | 'magenta' | 'ciano' | 'esmeralda'

export interface Settings {
  name: string
  theme: 'dark' | 'light'
  accent: Accent
  density: 'confortavel' | 'compacta'
  weeklyHours: number
  preferredDays: number[]
  gamification: boolean
  animations: boolean
  priorityCategories: Category[]
  sidebarCollapsed: boolean
  onboarded: boolean
  demo: boolean
}

export interface ModuleProgress {
  startedAt?: string
  completedAt?: string
  checklist: Record<number, boolean>
  notes: string
  lastLessonId?: string
}

export interface LessonProgress {
  done: boolean
  completedAt?: string
  exerciseCorrect?: boolean
}

export interface ResourceState {
  favorite: boolean
  status: 'nenhum' | 'planejado' | 'estudando' | 'concluido'
  rating?: number
}

export interface CardState {
  ease: number
  interval: number
  due: string
  reps: number
  lapses: number
  history: { at: string; grade: Grade }[]
}

export type Grade = 'errei' | 'dificil' | 'bom' | 'facil'

export interface LabLog {
  status: 'nao_iniciado' | 'em_andamento' | 'concluido'
  steps: Record<number, boolean>
  evidence: string
  result: string
  difficulties: string
  lessons: string
  startedAt?: string
  completedAt?: string
}

export interface Attempt {
  id: string
  challengeId: string
  at: string
  correct: boolean
  answer: string
  hintUsed: boolean
}

export interface StudySession {
  id: string
  title: string
  date: string // YYYY-MM-DD
  time?: string // HH:MM
  moduleId?: string
  plannedMin: number
  actualMin?: number
  priority: 'alta' | 'media' | 'baixa'
  status: 'planejada' | 'concluida' | 'pulada'
  completedAt?: string
  notes?: string
}

export interface Note {
  id: string
  title: string
  body: string
  category: string
  tags: string[]
  favorite: boolean
  moduleId?: string
  labId?: string
  resourceId?: string
  createdAt: string
  updatedAt: string
}

export interface UserCard {
  id: string
  front: string
  back: string
  deck: string
  tags: string[]
  createdAt: string
}

export interface Project {
  id: string
  name: string
  description: string
  objectives: string
  tech: string[]
  category: Category
  status: 'ideia' | 'em_andamento' | 'concluido' | 'pausado'
  startDate?: string
  endDate?: string
  checklist: { text: string; done: boolean }[]
  evidence: string
  github: string
  docs: string
  learnings: string
  nextSteps: string
  templateId?: string
  createdAt: string
}

export type JobStatus = 'interessante' | 'preparando' | 'candidatado' | 'entrevista' | 'oferta' | 'encerrado'

export interface Job {
  id: string
  company: string
  role: string
  url: string
  requirements: string
  status: JobStatus
  appliedAt?: string
  nextAction: string
  notes: string
  skillsRequired: string[]
  skillsHave: string[]
  createdAt: string
}

export interface InterviewAnswer {
  id: string
  questionId: string
  answer: string
  checked: string[]
  at: string
}

export type ActivityType =
  | 'licao'
  | 'modulo'
  | 'desafio'
  | 'sessao'
  | 'nota'
  | 'revisao'
  | 'lab'
  | 'projeto'
  | 'vaga'
  | 'entrevista'

export interface Activity {
  id: string
  at: string
  type: ActivityType
  label: string
  ref?: string
}

export interface Meta {
  settings: Settings
  moduleProgress: Record<string, ModuleProgress>
  lessonProgress: Record<string, LessonProgress>
  resourceState: Record<string, ResourceState>
  cardState: Record<string, CardState>
  labLogs: Record<string, LabLog>
}

export interface Collections {
  attempts: Attempt[]
  sessions: StudySession[]
  notes: Note[]
  userCards: UserCard[]
  projects: Project[]
  jobs: Job[]
  interview: InterviewAnswer[]
  activity: Activity[]
  customResources: Resource[]
}

export type AppData = Meta & Collections

export type CollectionName = keyof Collections
export type MetaKey = keyof Meta
