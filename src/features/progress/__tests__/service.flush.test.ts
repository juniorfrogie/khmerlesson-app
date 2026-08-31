// Covers the offline-queue stale-write fix: a queued quiz attempt that
// failed while offline can be superseded before it's ever flushed (e.g. the
// same quiz was retaken online and synced directly). Replaying the stale
// queued item afterward must not regress the cloud row back to the older
// score — the backend upsert has no recency check of its own, so this has
// to be caught client-side using the same recency rule the local store
// already applies to its own writes.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuizScoreStore } from '@/src/features/quizzes/store/quizScoreStore';

const mockApiPost = jest.fn();
jest.mock('@/src/services/api', () => ({
  apiFetch: jest.fn(),
  apiPost: (...args: unknown[]) => mockApiPost(...args),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { flushPendingProgress } = require('../service');

const PENDING_KEY = 'pending_progress_sync';

describe('flushPendingProgress — stale queued quiz writes are dropped, not replayed', () => {
  beforeEach(async () => {
    mockApiPost.mockReset();
    mockApiPost.mockResolvedValue({});
    await AsyncStorage.clear();
    useQuizScoreStore.setState({ scores: {} });
  });

  it('drops a queued item whose completedAt is older than what the local store already has', async () => {
    // Simulate: quiz failed to sync while offline (queued at T1), then the
    // same quiz was retaken online and synced successfully (local store now
    // holds T2, newer than T1).
    const t1 = new Date(Date.now() - 60_000).toISOString();
    const t2 = new Date().toISOString();
    await AsyncStorage.setItem(
      PENDING_KEY,
      JSON.stringify([{ type: 'quiz', body: { lessonId: 5, quizId: 99, score: 3, total: 10, completedAt: t1 } }]),
    );
    useQuizScoreStore.getState().setScore('5', 99, 9, 10, t2);

    await flushPendingProgress('token');

    expect(mockApiPost).not.toHaveBeenCalled(); // stale item must not be sent — it would regress the cloud row
    const remaining = JSON.parse((await AsyncStorage.getItem(PENDING_KEY)) ?? '[]');
    expect(remaining).toEqual([]); // dropped, not left pending forever
  });

  it('still flushes a queued item that is at least as new as the local store', async () => {
    const t1 = new Date().toISOString();
    await AsyncStorage.setItem(
      PENDING_KEY,
      JSON.stringify([{ type: 'quiz', body: { lessonId: 7, quizId: 1, score: 8, total: 10, completedAt: t1 } }]),
    );
    // No newer local entry exists for lessonId 7 — nothing supersedes this queued item.

    await flushPendingProgress('token');

    expect(mockApiPost).toHaveBeenCalledTimes(1);
    expect(mockApiPost.mock.calls[0][0]).toBe('/api/v1/quiz-progress');
    expect(mockApiPost.mock.calls[0][1]).toEqual(expect.objectContaining({ lessonId: 7 }));
    expect(mockApiPost.mock.calls[0][2]).toBe('token');
    const remaining = JSON.parse((await AsyncStorage.getItem(PENDING_KEY)) ?? '[]');
    expect(remaining).toEqual([]);
  });

  it('re-queues a lesson-completion item on failure without ever comparing it against the score store', async () => {
    await AsyncStorage.setItem(
      PENDING_KEY,
      JSON.stringify([{ type: 'lesson', body: { mainLessonId: 1, lessonId: 2, completedAt: new Date().toISOString() } }]),
    );
    mockApiPost.mockRejectedValueOnce(new Error('offline'));

    await flushPendingProgress('token');

    const remaining = JSON.parse((await AsyncStorage.getItem(PENDING_KEY)) ?? '[]');
    expect(remaining).toHaveLength(1); // failed send — stays queued for the next flush
  });
});
