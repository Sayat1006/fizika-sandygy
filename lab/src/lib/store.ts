import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Track } from '../data/labs';
import type { Row } from '../features/experiment/analysis';
import type { Readings } from '../engines/simulation/types';

export interface Session {
  expId: string;
  step: number;
  mode: 'basic' | 'advanced';
  hypothesis: number | null;
  rows: Row[];
  conclusion: string[];
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
  score: number | null;
  deviation: number | null;
}

export interface Assignment {
  id: string;
  expId: string;
  klass: string;
  due: string;
  note: string;
  createdAt: string;
}

export interface CustomItem {
  id: string;
  grade: 10 | 11;
  track: Track;
  title: string;
}

export type Lang = 'kk' | 'ru' | 'en';

interface AppState {
  theme: 'light' | 'dark';
  lang: Lang;
  textScale: number;
  profile: { name: string; school: string; klass: string };
  sessions: Record<string, Session>;
  assignments: Assignment[];
  custom: CustomItem[];
  setTheme: (t: 'light' | 'dark') => void;
  setLang: (l: Lang) => void;
  setTextScale: (s: number) => void;
  setProfile: (p: Partial<AppState['profile']>) => void;
  patchSession: (expId: string, patch: Partial<Session>) => void;
  resetSession: (expId: string) => void;
  addAssignment: (a: Omit<Assignment, 'id' | 'createdAt'>) => void;
  removeAssignment: (id: string) => void;
  addCustom: (c: Omit<CustomItem, 'id'>) => void;
  removeCustom: (id: string) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

export const newSession = (expId: string): Session => ({
  expId,
  step: 0,
  mode: 'basic',
  hypothesis: null,
  rows: [],
  conclusion: ['', '', '', '', ''],
  startedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  completedAt: null,
  score: null,
  deviation: null,
});

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      theme: 'light',
      lang: 'kk',
      textScale: 1,
      profile: { name: '', school: '', klass: '' },
      sessions: {},
      assignments: [],
      custom: [],
      setTheme: (theme) => set({ theme }),
      setLang: (lang) => set({ lang }),
      setTextScale: (textScale) => set({ textScale }),
      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      patchSession: (expId, patch) =>
        set((s) => ({
          sessions: {
            ...s.sessions,
            [expId]: { ...(s.sessions[expId] ?? newSession(expId)), ...patch, updatedAt: new Date().toISOString() },
          },
        })),
      resetSession: (expId) => set((s) => ({ sessions: { ...s.sessions, [expId]: newSession(expId) } })),
      addAssignment: (a) => set((s) => ({ assignments: [{ ...a, id: uid(), createdAt: new Date().toISOString() }, ...s.assignments] })),
      removeAssignment: (id) => set((s) => ({ assignments: s.assignments.filter((a) => a.id !== id) })),
      addCustom: (c) => set((s) => ({ custom: [...s.custom, { ...c, id: uid() }] })),
      removeCustom: (id) => set((s) => ({ custom: s.custom.filter((c) => c.id !== id) })),
    }),
    { name: 'physics-lab-3d', version: 1 },
  ),
);

export const rowId = uid;

// ───────────── Зертхананың уақытша күйі (сақталмайды) ─────────────
interface LabState {
  params: Record<string, number>;
  readings: Readings | null;
  paused: boolean;
  vectors: boolean;
  setParam: (key: string, value: number) => void;
  setParams: (p: Record<string, number>) => void;
}

export const useLab = create<LabState>((set) => ({
  params: {},
  readings: null,
  paused: false,
  vectors: true,
  setParam: (key, value) => set((s) => (s.params[key] === value ? s : { params: { ...s.params, [key]: value } })),
  setParams: (params) => set({ params }),
}));
