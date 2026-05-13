const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';
const API_KEY = process.env.EXPO_PUBLIC_API_KEY ?? '';

export const BUCKET_URL = process.env.EXPO_PUBLIC_BUCKET_URL ?? `${BASE_URL}/uploads`;

function baseHeaders(accessToken?: string) {
  return {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

export async function apiFetch<T>(path: string, accessToken?: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: baseHeaders(accessToken),
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${path}`);
  }

  const json = await res.json();
  return (json?.data ?? json) as T;
}

export async function apiPost<T>(path: string, body: unknown, accessToken?: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: baseHeaders(accessToken),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `API ${res.status}: ${path}`);
  }

  const json = await res.json();
  return (json?.data ?? json) as T;
}

export async function apiDelete(path: string, accessToken?: string): Promise<void> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers: baseHeaders(accessToken),
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json?.message ?? `API ${res.status}: ${path}`);
  }
}

// Several backend auth endpoints expect application/x-www-form-urlencoded (matches Flutter reference)
export async function apiPostForm<T>(
  path: string,
  body: Record<string, string>,
  accessToken?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    'x-api-key': API_KEY,
    'Content-Type': 'application/x-www-form-urlencoded',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: new URLSearchParams(body).toString(),
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json?.message ?? `API ${res.status}: ${path}`);
  }

  const json = await res.json();
  return (json?.data ?? json) as T;
}
