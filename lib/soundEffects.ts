// Playback for the two uploaded sound effects — "blast" (each countdown
// number) and "celebration" (counter finale). Each plays through its own
// HTMLAudioElement, completely independent of the show's <video>, so a sound
// effect can never mute or interrupt the video's own audio track.
//
// initSoundEffects() must be called from a user gesture (the LED "tap to
// begin") so the browser's autoplay policy allows the later, non-gesture
// play() calls during the countdown and counter. Every function no-ops safely
// on the server and when nothing has been uploaded (the file 404s → silence).

let blast: HTMLAudioElement | null = null;
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
  if (!blast) blast = make("blast");
  if (!celebration) celebration = make("celebration");
  // Prime within the gesture so buffering starts and playback is unlocked.
  blast.load();
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

/** Blast/explosion hit for a countdown number. Restarts on each call. */
export function playBlast(): void {
  play(blast);
}

/** Celebration sound for the counter finale. */
export function playCelebration(): void {
  play(celebration);
}
