import { useQuizScoreStore } from '../quizScoreStore';

function resetStore() {
  useQuizScoreStore.setState({ scores: {} });
}

describe('quizScoreStore — local/cloud conflict resolution', () => {
  beforeEach(resetStore);

  it('applies a fresh local write immediately', () => {
    useQuizScoreStore.getState().setScore('10', 100, 4, 5);
    expect(useQuizScoreStore.getState().getScore('10')).toMatchObject({ quizId: 100, score: 4, total: 5 });
  });

  it('a later write (newer completedAt) overwrites an earlier one', () => {
    useQuizScoreStore.getState().setScore('10', 100, 3, 5, '2026-01-01T00:00:00.000Z');
    useQuizScoreStore.getState().setScore('10', 100, 5, 5, '2026-01-02T00:00:00.000Z');
    expect(useQuizScoreStore.getState().getScore('10')?.score).toBe(5);
  });

  it('the core bug fix: an older (e.g. stale cloud) write does NOT clobber a newer local one', () => {
    // Fresh local completion (retake), score 5/5.
    useQuizScoreStore.getState().setScore('10', 100, 5, 5, '2026-01-02T00:00:00.000Z');
    // A cloud snapshot fetched afterward, but from before the retake —
    // exactly the "cloud merge runs after a fresh local write hasn't synced
    // yet" scenario this recency check exists to protect against.
    useQuizScoreStore.getState().setScore('10', 100, 3, 5, '2026-01-01T00:00:00.000Z');
    const entry = useQuizScoreStore.getState().getScore('10');
    expect(entry?.score).toBe(5);
    expect(entry?.completedAt).toBe('2026-01-02T00:00:00.000Z');
  });

  it('an incoming write with no existing entry is always applied regardless of its timestamp', () => {
    useQuizScoreStore.getState().setScore('20', 200, 1, 5, '2000-01-01T00:00:00.000Z');
    expect(useQuizScoreStore.getState().getScore('20')?.score).toBe(1);
  });

  it('setScore defaults completedAt to "now" when omitted (the normal local-completion path)', () => {
    const before = Date.now();
    useQuizScoreStore.getState().setScore('30', 300, 2, 5);
    const after = Date.now();
    const completedAt = useQuizScoreStore.getState().getScore('30')?.completedAt;
    expect(completedAt).toBeDefined();
    const ts = new Date(completedAt as string).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });
});
