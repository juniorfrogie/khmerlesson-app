import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'quiz_scores';

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

export const useQuizScoreStore = create<QuizScoreStore>((set, get) => ({
  scores: {},

  setScore: (lessonId, score, total) => {
    const updated = { ...get().scores, [lessonId]: { score, total } };
    set({ scores: updated });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
  },

  getScore: (lessonId) => get().scores[lessonId],

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        set({ scores: JSON.parse(raw) as Record<string, ScoreEntry> });
      }
    } catch {
      // ignore corrupt storage
    }
  },
}));
