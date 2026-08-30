import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch, apiPost } from '@/src/services/api';
import { logger, newTraceId } from '@/src/shared/utils/logger';
import { useQuizScoreStore } from '@/src/features/quizzes/store/quizScoreStore';
import { useProgressStore } from '@/src/features/lessons/store/progressStore';

// Cloud progress sync — quiz scores and lesson completion are account-scoped
// on the backend (khmerlesson-dashboard: GET/POST /api/v1/progress,
// /api/v1/quiz-progress, /api/v1/lesson-progress) rather than device-local
// only. Local AsyncStorage (quizScoreStore/progressStore) remains as a
// cache/offline buffer — every write here happens in addition to, not
// instead of, the existing local write.

interface QuizProgressPayload {
  lessonId: number;
  quizId: number;
  score: number;
  total: number;
}

interface LessonProgressPayload {
  mainLessonId: number;
  lessonId: number;
}

interface CloudQuizAttempt extends QuizProgressPayload {
  completedAt: string;
}

interface CloudLessonCompletion extends LessonProgressPayload {
  completedAt: string;
}

type PendingSync =
  | { type: 'quiz'; body: QuizProgressPayload & { completedAt: string } }
  | { type: 'lesson'; body: LessonProgressPayload & { completedAt: string } };

const PENDING_KEY = 'pending_progress_sync';

async function getPending(): Promise<PendingSync[]> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as PendingSync[]) : [];
  } catch {
    return [];
  }
}

async function setPending(items: PendingSync[]): Promise<void> {
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(items)).catch(() => {});
}

async function sendPending(accessToken: string, item: PendingSync, traceId: string): Promise<void> {
  if (item.type === 'quiz') {
    await apiPost('/api/v1/quiz-progress', item.body, accessToken, traceId);
  } else {
    await apiPost('/api/v1/lesson-progress', item.body, accessToken, traceId);
  }
}

// Retries any writes that failed while offline (or for any other transient
// reason) — call after a successful cloud-progress fetch (session
// restore/login is the natural point connectivity is most likely restored),
// mirroring the re-buffer-on-failure pattern already used by
// src/shared/utils/logger.ts's flushLogs().
export async function flushPendingProgress(accessToken: string): Promise<void> {
  const items = await getPending();
  if (items.length === 0) return;

  const traceId = newTraceId();
  const stillPending: PendingSync[] = [];
  for (const item of items) {
    try {
      await sendPending(accessToken, item, traceId);
    } catch {
      stillPending.push(item);
    }
  }
  await setPending(stillPending);
  if (stillPending.length < items.length) {
    logger.info(traceId, 'pending_progress_flushed', {
      flushed: items.length - stillPending.length,
      stillPending: stillPending.length,
    });
  }
}

export async function syncQuizAttempt(accessToken: string, payload: QuizProgressPayload): Promise<void> {
  const traceId = newTraceId();
  const body = { ...payload, completedAt: new Date().toISOString() };
  logger.info(traceId, 'quiz_progress_sync_started', { quizId: payload.quizId });
  try {
    await apiPost('/api/v1/quiz-progress', body, accessToken, traceId);
    logger.info(traceId, 'quiz_progress_synced', { quizId: payload.quizId });
  } catch (err) {
    logger.warn(traceId, 'quiz_progress_sync_failed', { quizId: payload.quizId, message: (err as Error).message });
    await getPending().then((items) => setPending([...items, { type: 'quiz', body }]));
  }
}

export async function syncLessonCompletion(accessToken: string, payload: LessonProgressPayload): Promise<void> {
  const traceId = newTraceId();
  const body = { ...payload, completedAt: new Date().toISOString() };
  logger.info(traceId, 'lesson_progress_sync_started', { lessonId: payload.lessonId });
  try {
    await apiPost('/api/v1/lesson-progress', body, accessToken, traceId);
    logger.info(traceId, 'lesson_progress_synced', { lessonId: payload.lessonId });
  } catch (err) {
    logger.warn(traceId, 'lesson_progress_sync_failed', { lessonId: payload.lessonId, message: (err as Error).message });
    await getPending().then((items) => setPending([...items, { type: 'lesson', body }]));
  }
}

// Fetches cloud progress and merges it into the local namespaced stores —
// call on session restore/login so progress from another device or a
// reinstall appears without redoing anything.
//
// Conflict rule: cloud is applied unconditionally, but quizScoreStore's own
// setScore() rejects an incoming write older than what's already local (see
// its doc comment) — so a fresher local completion that hasn't synced yet
// (e.g. still sitting in the pending queue below) is never clobbered by a
// stale cloud snapshot. Lesson completion needs no such check: it's a
// boolean, and markComplete() is already idempotent — applying a cloud
// completion the device already has locally is a safe no-op either way.
export async function fetchAndMergeCloudProgress(accessToken: string): Promise<void> {
  const traceId = newTraceId();
  logger.info(traceId, 'progress_fetch_started');
  try {
    const result = await apiFetch<{ quizAttempts: CloudQuizAttempt[]; lessonCompletions: CloudLessonCompletion[] }>(
      '/api/v1/progress',
      accessToken,
    );

    const quizStore = useQuizScoreStore.getState();
    for (const attempt of result.quizAttempts) {
      quizStore.setScore(String(attempt.lessonId), attempt.quizId, attempt.score, attempt.total, attempt.completedAt);
    }

    const progressStore = useProgressStore.getState();
    for (const completion of result.lessonCompletions) {
      progressStore.markComplete(completion.mainLessonId, completion.lessonId);
    }

    logger.info(traceId, 'progress_fetched', {
      quizAttempts: result.quizAttempts.length,
      lessonCompletions: result.lessonCompletions.length,
    });
  } catch (err) {
    logger.warn(traceId, 'progress_fetch_failed', { message: (err as Error).message });
  }

  // Independent of whether the fetch above succeeded — a working connection
  // is what matters for flushing, not the fetch's own outcome.
  await flushPendingProgress(accessToken).catch(() => {});
}
