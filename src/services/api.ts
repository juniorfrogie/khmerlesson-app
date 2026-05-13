const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';
const API_KEY = process.env.EXPO_PUBLIC_API_KEY ?? '';

export const BUCKET_URL = process.env.EXPO_PUBLIC_BUCKET_URL ?? `${BASE_URL}/uploads`;

export async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'x-api-key': API_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${path}`);
  }

  const json = await res.json();
  // Handle both raw response and { data: ... } envelope
  return (json?.data ?? json) as T;
}
