// Playback for the uploaded "celebration" sound effect (counter finale). It
// plays through its own HTMLAudioElement, completely independent of the show's
// <video> elements, so it can never mute or interrupt a video's audio track.
//
// initSoundEffects() must be called from a user gesture (the LED "tap to
// begin") so the browser's autoplay policy allows the later, non-gesture
// play() call at the finale. Every function no-ops safely on the server and
// when nothing has been uploaded (the file 404s → silence).

let celebration: HTMLAudioElement | null = null;

function make(slot: string): HTMLAudioElement {
  const el = new Audio(`/api/audio/${slot}`);
  el.preload = "auto";
  // A missing upload 404s; swallow the resulting media error so it stays silent.
  el.addEventListener("error", () => {});
  return el;
}

export function initSoundEffects(): void {
  if (typeof window === "undefined") return;
  if (!celebration) celebration = make("celebration");
  // Prime within the gesture so buffering starts and playback is unlocked.
  celebration.load();
}

function play(el: HTMLAudioElement | null): void {
  if (!el) return;
  try {
    el.currentTime = 0;
  } catch {
    // currentTime can throw before metadata loads — play() still restarts it
  }
  void el.play().catch(() => {
    // no upload, or autoplay refused — treat as silence
  });
}

/** Celebration sound for the counter finale. */
export function playCelebration(): void {
  play(celebration);
}
