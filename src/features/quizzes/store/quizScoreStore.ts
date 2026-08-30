import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { currentIdentityNamespace, subscribeToIdentityChange } from '@/src/shared/utils/identityNamespace';

const STORAGE_KEY_PREFIX = 'quiz_scores';

interface ScoreEntry {
  score: number;
  total: number;
}

interface QuizScoreStore {
  scores: Record<string, ScoreEntry>;
  setScore: (lessonId: string, score: number, total: number) => void;
  getScore: (lessonId: string) => ScoreEntry | undefined;
  hydrate: () => Promise<void>;
}

// See progressStore.ts for the full rationale — same per-identity
// namespacing pattern, applied here to quiz scores.
let activeNamespace = currentIdentityNamespace();

export const useQuizScoreStore = create<QuizScoreStore>((set, get) => ({
  scores: {},

  setScore: (lessonId, score, total) => {
    const updated = { ...get().scores, [lessonId]: { score, total } };
    set({ scores: updated });
    AsyncStorage.setItem(storageKey(activeNamespace), JSON.stringify(updated)).catch(() => {});
  },

  getScore: (lessonId) => get().scores[lessonId],

  hydrate: async () => {
    activeNamespace = currentIdentityNamespace();
    try {
      const raw = await AsyncStorage.getItem(storageKey(activeNamespace));
      set({ scores: raw ? (JSON.parse(raw) as Record<string, ScoreEntry>) : {} });
    } catch {
      // ignore corrupt storage
    }
  },
}));

function storageKey(namespace: string): string {
  return `${STORAGE_KEY_PREFIX}:${namespace}`;
}

subscribeToIdentityChange(() => {
  useQuizScoreStore.getState().hydrate();
});
