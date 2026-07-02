/**
 * Trace-id logger — mirrors server/utils/trace-logger.ts on the backend.
 *
 * Every API call gets a fresh traceId (see src/services/api.ts), sent as the
 * `X-Correlation-ID` header. The server echoes it back and, if it logs
 * anything for that request, writes it to `debug_logs` with the same id.
 * This module buffers local log lines tagged with a traceId and periodically
 * ships them to `POST /api/v1/debug-logs`, so a single traceId can be looked
 * up to see what happened on both the app and the server for one request.
 *
 * Best-effort by design: a logging failure must never crash or interrupt
 * the feature it's describing.
 */
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';
const API_KEY = process.env.EXPO_PUBLIC_API_KEY ?? '';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export function newTraceId(): string {
  return Crypto.randomUUID();
}

type BufferedLog = {
  traceId: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
};

const MAX_BUFFER = 200;
const FLUSH_INTERVAL_MS = 15000;
const buffer: BufferedLog[] = [];

function push(entry: BufferedLog) {
  const line = `[${entry.level.toUpperCase()}][${entry.traceId}] ${entry.message}`;
  if (entry.level === 'error') console.error(line, entry.context ?? '');
  else if (entry.level === 'warn') console.warn(line, entry.context ?? '');
  else console.log(line, entry.context ?? '');

  buffer.push(entry);
  if (buffer.length > MAX_BUFFER) buffer.shift(); // drop oldest — never grow unbounded
}

export const logger = {
  debug: (traceId: string, message: string, context?: Record<string, unknown>) =>
    push({ traceId, level: 'debug', message, context }),
  info: (traceId: string, message: string, context?: Record<string, unknown>) =>
    push({ traceId, level: 'info', message, context }),
  warn: (traceId: string, message: string, context?: Record<string, unknown>) =>
    push({ traceId, level: 'warn', message, context }),
  error: (traceId: string, message: string, context?: Record<string, unknown>) =>
    push({ traceId, level: 'error', message, context }),
};

// Deferred require to avoid a module cycle: authStore -> api.ts -> logger.ts.
// Same pattern used by src/features/courses/service/purchaseService.ts.
function getAccessToken(): string | undefined {
  try {
    const { useAuthStore } = require('@/src/features/auth/store/authStore');
    return useAuthStore.getState().tokens?.accessToken;
  } catch {
    return undefined;
  }
}

// Ships buffered logs to the backend. The endpoint is semi-public (works for
// guests too — see SEMI_PUBLIC_PREFIXES in the server's authenticate.ts) but
// still attaches a bearer token when signed in so rows get tagged with userId.
// Never throws — a logging failure must not surface to the app — but DOES
// re-buffer on failure instead of silently discarding, since swallowing a
// non-2xx response here previously made flush failures invisible.
export async function flushLogs(): Promise<void> {
  if (buffer.length === 0 || !BASE_URL) return;
  const batch = buffer.splice(0, buffer.length);
  const accessToken = getAccessToken();
  try {
    const res = await fetch(`${BASE_URL}/api/v1/debug-logs`, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({
        logs: batch.map((entry) => ({
          ...entry,
          context: { ...entry.context, platform: Platform.OS },
        })),
      }),
    });
    if (!res.ok) {
      console.warn(`[logger] flush failed with status ${res.status} — re-buffering ${batch.length} entries`);
      buffer.unshift(...batch);
    }
  } catch {
    // Network error (offline) — re-buffer so the next interval retries.
    buffer.unshift(...batch);
  }
}

let flushTimer: ReturnType<typeof setInterval> | null = null;

// Call once at app startup (see app/_layout.tsx).
export function startLogFlushing(): void {
  if (flushTimer) return;
  flushTimer = setInterval(flushLogs, FLUSH_INTERVAL_MS);
}
