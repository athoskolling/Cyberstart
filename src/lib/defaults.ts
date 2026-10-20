import type { AppData, Settings } from '../types'

export const DEFAULT_SETTINGS: Settings = {
  name: '',
  theme: 'dark',
  accent: 'violeta',
  density: 'confortavel',
  weeklyHours: 8,
  preferredDays: [1, 2, 3, 4, 6],
  gamification: true,
  animations: true,
  priorityCategories: [],
  sidebarCollapsed: false,
  onboarded: false,
  demo: false,
}

export function emptyData(): AppData {
  return {
    settings: { ...DEFAULT_SETTINGS },
    moduleProgress: {},
    lessonProgress: {},
    resourceState: {},
    cardState: {},
    labLogs: {},
    attempts: [],
    sessions: [],
    notes: [],
    userCards: [],
    projects: [],
    jobs: [],
    interview: [],
    activity: [],
    customResources: [],
  }
}

export const META_KEYS = ['settings', 'moduleProgress', 'lessonProgress', 'resourceState', 'cardState', 'labLogs'] as const
export const COLLECTION_KEYS = [
  'attempts',
  'sessions',
  'notes',
  'userCards',
  'projects',
  'jobs',
  'interview',
  'activity',
  'customResources',
] as const
