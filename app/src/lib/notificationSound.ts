/**
 * Plays a short notification sound when a new notification arrives.
 * Uses Web Audio API (no external files) for a lightweight ding.
 */
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioContext;
}

export function playNotificationSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    // Resume if suspended (browser autoplay policy)
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    // Two-tone chime: 880Hz then 1100Hz
    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.connect(gain);
      gain.connect(ctx!.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    playTone(880, 0, 0.08);
    playTone(1100, 0.1, 0.1);
  } catch {
    // Silently ignore if audio fails (e.g. user hasn't interacted)
  }
}
