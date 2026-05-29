import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

let activePlayer: AudioPlayer | null = null;
let audioModeConfigured = false;

async function ensureAudioMode() {
  if (audioModeConfigured) return;
  await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'duckOthers' });
  audioModeConfigured = true;
}

export async function playTTS(text: string): Promise<AudioPlayer> {
  stopTTS();
  await ensureAudioMode();
  const url = `${BASE_URL}/api/tts?q=${encodeURIComponent(text)}`;
  const player = createAudioPlayer({ uri: url });
  activePlayer = player;
  player.play();
  return player;
}

export function stopTTS(): void {
  if (!activePlayer) return;
  const p = activePlayer;
  activePlayer = null;
  try { p.remove(); } catch { /* ignore */ }
}
