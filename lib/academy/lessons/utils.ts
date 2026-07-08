export function playLessonSuccessPing(): void {
  if (typeof window === "undefined") return;
  try {
    const ctx = new window.AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.18);
  } catch {
    /* Audio optional in sandboxed contexts */
  }
}

export function triggerLessonErrorVibration(): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(120);
  }
}
