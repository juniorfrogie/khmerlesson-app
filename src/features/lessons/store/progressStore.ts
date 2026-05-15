import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'lesson_progress';

export interface LastAccessed {
  courseId: number;
  lessonId: number;
  courseTitle: string;
  lessonTitle: string;
}

interface ProgressStore {
  completedLessons: Record<number, number[]>; // courseId → lessonId[]
  lastAccessed: LastAccessed | null;

  markComplete: (courseId: number, lessonId: number) => void;
  setLastAccessed: (info: LastAccessed) => void;
  hydrate: () => Promise<void>;
}

export const useProgressStore = create<ProgressStore>((set, get) => ({
  completedLessons: {},
  lastAccessed: null,

  markComplete: (courseId, lessonId) => {
    const existing = get().completedLessons[courseId] ?? [];
    if (existing.includes(lessonId)) return;
    const updated = { ...get().completedLessons, [courseId]: [...existing, lessonId] };
    set({ completedLessons: updated });
    persist(get());
  },

  setLastAccessed: (info) => {
    set({ lastAccessed: info });
    persist(get());
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({
          completedLessons: parsed.completedLessons ?? {},
          lastAccessed: parsed.lastAccessed ?? null,
        });
      }
    } catch {
      // ignore corrupt storage
    }
  },
}));

function persist(state: Pick<ProgressStore, 'completedLessons' | 'lastAccessed'>) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
    completedLessons: state.completedLessons,
    lastAccessed: state.lastAccessed,
  })).catch(() => {});
}
