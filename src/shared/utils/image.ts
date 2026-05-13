const BUCKET_URL = process.env.EXPO_PUBLIC_BUCKET_URL ?? '';

export const getImageUrl = (
    path?: string | null
) => {
    if (!path) return null;

    // already full URL
    if (path.startsWith("http")) {
        return path;
    }
    return `${BUCKET_URL}/${path}`;
};