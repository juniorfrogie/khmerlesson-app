import { logger, newTraceId } from '@/src/shared/utils/logger';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';
const API_KEY = process.env.EXPO_PUBLIC_API_KEY ?? '';

export const BUCKET_URL = process.env.EXPO_PUBLIC_BUCKET_URL ?? `${BASE_URL}/uploads`;

// Every call gets its own traceId, sent as X-Correlation-ID. The server
// echoes it back and tags any of its own logs for this request with the
// same id (server/auth/middleware/correlation.ts + server/utils/trace-logger.ts),
// so a single id can be grepped/queried across both sides.
function baseHeaders(accessToken?: string, traceId?: string) {
  return {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json',
    'X-Correlation-ID': traceId ?? newTraceId(),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

export async function apiFetch<T>(path: string, accessToken?: string): Promise<T> {
  const traceId = newTraceId();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: baseHeaders(accessToken, traceId),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    logger.warn(traceId, `apiFetch ${res.status} ${path}`, { response: text });
    let message = `API ${res.status}: ${path}`;
    let code: string | undefined;
    try {
      const json = JSON.parse(text);
      if (json?.message) message = json.message;
      if (json?.error) message = json.error;
      if (json?.code) code = json.code;
    } catch { /* ignore */ }
    const err = new Error(message);
    if (code) (err as Error & { code: string }).code = code;
    (err as Error & { status: number }).status = res.status;
    (err as Error & { traceId: string }).traceId = traceId;
    throw err;
  }

  const json = await res.json();
  return (json?.data ?? json) as T;
}

export async function apiPost<T>(path: string, body: unknown, accessToken?: string, traceIdOverride?: string): Promise<T> {
  const traceId = traceIdOverride ?? newTraceId();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: baseHeaders(accessToken, traceId),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    logger.warn(traceId, `apiPost ${res.status} ${path}`, { response: text });
    let message = text || `API ${res.status}: ${path}`;
    let code: string | undefined;
    try {
      const json = JSON.parse(text);
      if (json?.message) message = json.message;
      if (json?.code) code = json.code;
    } catch { /* ignore */ }
    const err = new Error(message);
    if (code) (err as Error & { code: string }).code = code;
    (err as Error & { status: number }).status = res.status;
    (err as Error & { responseBody: string }).responseBody = text;
    (err as Error & { traceId: string }).traceId = traceId;
    throw err;
  }

  const json = await res.json();
  return (json?.data ?? json) as T;
}

export async function apiDelete(path: string, accessToken?: string): Promise<void> {
  const traceId = newTraceId();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers: baseHeaders(accessToken, traceId),
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    logger.warn(traceId, `apiDelete ${res.status} ${path}`, { response: json });
    const err = new Error(json?.message ?? `API ${res.status}: ${path}`);
    (err as Error & { traceId: string }).traceId = traceId;
    throw err;
  }
}

// Several backend auth endpoints expect application/x-www-form-urlencoded (matches Flutter reference)
export async function apiPostForm<T>(
  path: string,
  body: Record<string, string>,
  accessToken?: string,
): Promise<T> {
  const traceId = newTraceId();
  const headers: Record<string, string> = {
    'x-api-key': API_KEY,
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-Correlation-ID': traceId,
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: new URLSearchParams(body).toString(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    logger.warn(traceId, `apiPostForm ${res.status} ${path}`, { response: text });
    let json: Record<string, unknown> = {};
    try { json = JSON.parse(text); } catch { /* ignore */ }

    // Some backends return "user already exists" as a non-2xx status but still include
    // the session token in the body — treat that as a successful login.
    const data = (json?.data ?? json) as Record<string, unknown>;
    if (data?.token) return data as T;

    const message = (json?.message as string) ?? `API ${res.status}: ${path}`;
    const code = json?.code as string | undefined;
    const err = new Error(message);
    if (code) (err as Error & { code: string }).code = code;
    (err as Error & { traceId: string }).traceId = traceId;
    throw err;
  }

  const json = await res.json();
  return (json?.data ?? json) as T;
}
