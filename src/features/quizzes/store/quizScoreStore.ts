import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { currentIdentityNamespace, subscribeToIdentityChange } from '@/src/shared/utils/identityNamespace';

const STORAGE_KEY_PREFIX = 'quiz_scores';

interface ScoreEntry {
  quizId: number;
  score: number;
  total: number;
  completedAt: string; // ISO 8601 — lets setScore resolve local-vs-cloud conflicts by recency
}

interface QuizScoreStore {
  scores: Record<string, ScoreEntry>; // keyed by lessonId (string)
  setScore: (lessonId: string, quizId: number, score: number, total: number, completedAt?: string) => void;
  getScore: (lessonId: string) => ScoreEntry | undefined;
  hydrate: () => Promise<void>;
}

// See progressStore.ts for the full rationale — same per-identity
// namespacing pattern, applied here to quiz scores.
let activeNamespace = currentIdentityNamespace();

export const useQuizScoreStore = create<QuizScoreStore>((set, get) => ({
  scores: {},

  // `completedAt` defaults to now — always correct for a fresh local
  // completion. When called with an explicit (older) completedAt — e.g. by
  // the cloud-progress merge in src/features/progress/service.ts — an
  // existing local entry that's already newer is kept as-is. This is what
  // makes the cloud merge safe to call unconditionally on every session
  // restore without first checking whether a fresher local write (possibly
  // still queued for sync) exists.
  setScore: (lessonId, quizId, score, total, completedAt = new Date().toISOString()) => {
    const existing = get().scores[lessonId];
    if (existing && existing.completedAt > completedAt) return;
    const updated = { ...get().scores, [lessonId]: { quizId, score, total, completedAt } };
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
