// Playback for the uploaded "celebration" sound effect (counter finale). It
// plays through its own HTMLAudioElement, completely independent of the show's
// <video> elements, so it can never mute or interrupt a video's audio track.
//
// initSoundEffects() must be called from a user gesture (the LED "tap to
// begin") so the browser's autoplay policy allows the later, non-gesture
// play() call at the finale. Every function no-ops safely on the server and
// when nothing has been uploaded (the file 404s → silence).

let celebration: HTMLAudioElement | null = null;
let message: HTMLAudioElement | null = null;
const MESSAGE_VARIANTS = ["/message.mp3", "/message1.mp3"];

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

// The video-phase "pop" sound, served straight from the static public file.
export function initMessageSound(): void {
  if (typeof window === "undefined") return;
  if (!message) {
    message = new Audio(MESSAGE_VARIANTS[0]);
    message.preload = "auto";
    message.addEventListener("error", () => {});
  }
  // Prime within the gesture so autoplay is unlocked and the file is cached
  // before the burst loop starts spawning overlapping clones.
  message.load();
  for (const url of MESSAGE_VARIANTS.slice(1)) {
    const extra = new Audio(url);
    extra.preload = "auto";
    extra.addEventListener("error", () => {});
    extra.load();
  }
}

// One-shot play on its own element so plays can overlap (a single HTMLAudio
// element cannot play itself twice at once). Same URL → served from cache.
function playOneMessage(): void {
  try {
    const url = MESSAGE_VARIANTS[Math.floor(Math.random() * MESSAGE_VARIANTS.length)];
    const el = new Audio(url);
    void el.play().catch(() => {});
  } catch {
    // element construction failed — treat as silence
  }
}

let messageStop: (() => void) | null = null;

// Fire the message sound at a randomized rate: each 1-second window plays a
// random count in [min, max], scattered across the second. Returns nothing;
// call stopMessageBursts() to end it (e.g. when the video phase exits).
export function startMessageBursts(minPerSec: number, maxPerSec: number): void {
  if (typeof window === "undefined") return;
  stopMessageBursts();
  let stopped = false;
  let timers: ReturnType<typeof setTimeout>[] = [];

  const tick = () => {
    if (stopped) return;
    timers = timers.filter(() => true);
    const span = Math.max(0, maxPerSec - minPerSec);
    const count = minPerSec + Math.floor(Math.random() * (span + 1));
    for (let i = 0; i < count; i++) {
      timers.push(
        setTimeout(() => {
          if (!stopped) playOneMessage();
        }, Math.random() * 1000)
      );
    }
    timers.push(setTimeout(tick, 1000));
  };
  tick();

  messageStop = () => {
    stopped = true;
    timers.forEach(clearTimeout);
    timers = [];
  };
}

export function stopMessageBursts(): void {
  if (messageStop) {
    messageStop();
    messageStop = null;
  }
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
