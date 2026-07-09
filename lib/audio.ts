// Procedural texture for the counter's slot-machine spin, synthesized with the
// Web Audio API. The two headline sound effects — the countdown "blast" and the
// finale "celebration" — are user-uploaded files played via lib/soundEffects.ts;
// only the incidental roll/lock texture lives here.
//
// initAudio() must be called from a user gesture (the LED "tap to begin")
// so the AudioContext is allowed to run. Every function no-ops safely
// when the context is unavailable (SSR, or init not yet called).

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

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
