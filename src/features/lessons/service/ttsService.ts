import { Audio } from 'expo-av';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

let activeSound: Audio.Sound | null = null;

export async function playTTS(text: string): Promise<Audio.Sound> {
  await stopTTS();
  const url = `${BASE_URL}/api/tts?q=${encodeURIComponent(text)}`;
  const { sound } = await Audio.Sound.createAsync({ uri: url });
  activeSound = sound;
  await sound.playAsync();
  return sound;
}

export async function stopTTS(): Promise<void> {
  if (!activeSound) return;
  const s = activeSound;
  activeSound = null;
  try {
    await s.stopAsync();
    await s.unloadAsync();
  } catch { /* ignore if already unloaded */ }
}
