// Procedural audio for the show, synthesized with the Web Audio API.
// The counter spin still uses procedural roll texture here, while the
// scrolling MP3 and finale celebration live in lib/soundEffects.ts.
//
// initAudio() must be called from a user gesture (the LED "tap to begin")
// so the AudioContext is allowed to run. Every function no-ops safely
// when the context is unavailable (SSR, or init not yet called).

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

let scrolling: HTMLAudioElement | null = null;

export async function initAudio(): Promise<void> {
  if (typeof window === "undefined") return;
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.6;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") {
    await ctx.resume();
  }
}

function makeScrolling(): HTMLAudioElement {
  const el = new Audio("/api/audio/scrolling");
  el.preload = "auto";
  el.loop = true;
  el.addEventListener("error", () => {});
  return el;
}

function tone(
  freq: number,
  start: number,
  duration: number,
  opts: {
    type?: OscillatorType;
    gain?: number;
    endFreq?: number;
    dest?: AudioNode;
  } = {}
): void {
  if (!ctx || !master) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(freq, start);
  if (opts.endFreq) {
    osc.frequency.exponentialRampToValueAtTime(opts.endFreq, start + duration);
  }
  const peak = opts.gain ?? 0.5;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peak, start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(opts.dest ?? master);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

function noiseBurst(start: number, duration: number, gainAmount: number): void {
  if (!ctx || !master) return;
  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    channel[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }

  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  filter.type = "highpass";
  filter.frequency.setValueAtTime(900, start);
  filter.frequency.exponentialRampToValueAtTime(220, start + duration);

  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(gainAmount, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  source.buffer = buffer;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(master);

  source.start(start);
  source.stop(start + duration + 0.05);
}

/**
 * Slot-machine roll: rapid soft clicks scheduled ahead of time.
 * Returns a handle whose stop() silences it immediately.
 */
export function rollLoop(): { stop: () => void } {
  if (!ctx || !master) return { stop: () => {} };
  const gate = ctx.createGain();
  gate.gain.value = 1;
  gate.connect(master);
  let stopped = false;
  let next = ctx.currentTime + 0.02;

  const schedule = () => {
    if (stopped || !ctx) return;
    // keep ~0.3s of clicks scheduled ahead
    while (next < ctx.currentTime + 0.3) {
      tone(700 + Math.random() * 500, next, 0.03, {
        type: "triangle",
        gain: 0.14,
        dest: gate,
      });
      next += 0.04; // ~25 clicks/sec
    }
  };
  schedule();
  const timer = setInterval(schedule, 100);

  return {
    stop: () => {
      stopped = true;
      clearInterval(timer);
      if (ctx) gate.gain.setTargetAtTime(0, ctx.currentTime, 0.02);
    },
  };
}

/** Digit lock-in — satisfying pitch-drop "clunk". */
export function stopThunk(): void {
  if (!ctx) return;
  const t = ctx.currentTime;
  tone(180, t, 0.16, { type: "sine", gain: 0.6, endFreq: 90 });
  tone(360, t, 0.06, { type: "triangle", gain: 0.2 });
}

/** Countdown blast — short impact with a noisy burst and low boom. */
export function playCountdownBlast(): void {
  if (!ctx) return;
  const t = ctx.currentTime;
  noiseBurst(t, 0.42, 0.5);
  tone(120, t, 0.5, { type: "sine", gain: 0.75, endFreq: 38 });
  tone(240, t, 0.2, { type: "triangle", gain: 0.18, endFreq: 120 });
  tone(520, t + 0.02, 0.08, { type: "square", gain: 0.09, endFreq: 260 });
}

/** Countdown tick — a light click on each number change. */
export function playCountdownTick(): void {
  if (!ctx) return;
  const t = ctx.currentTime;
  tone(980, t, 0.03, { type: "triangle", gain: 0.09, endFreq: 820 });
  tone(1560, t + 0.004, 0.015, { type: "square", gain: 0.025, endFreq: 1200 });
}

export function initScrollingSound(): void {
  if (typeof window === "undefined") return;
  if (!scrolling) scrolling = makeScrolling();
  scrolling.load();
}

export function startScrollingSound(): void {
  if (!scrolling) return;
  scrolling.currentTime = 0;
  void scrolling.play().catch(() => {});
}

export function stopScrollingSound(): void {
  if (!scrolling) return;
  scrolling.pause();
  try {
    scrolling.currentTime = 0;
  } catch {
    // ignore reset timing errors before metadata loads
  }
}
