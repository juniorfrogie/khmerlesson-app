export function friendlyError(raw: string | null | undefined): {
  message: string;
  isOffline: boolean;
} {
  const isOffline =
    raw === 'Network request failed' ||
    raw === 'Failed to fetch' ||
    (typeof raw === 'string' && raw.toLowerCase().includes('network request'));
  return {
    isOffline,
    message: isOffline
      ? 'No internet connection.\nCheck your connection and try again.'
      : 'Something went wrong.\nPlease try again.',
  };
}
