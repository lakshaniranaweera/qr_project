"use client";

import { useEffect, useRef, useState } from "react";
import { initScrollingSound, rollLoop, startScrollingSound, stopScrollingSound, stopThunk } from "@/lib/audio";
import { playCelebration } from "@/lib/soundEffects";
import {
  COUNTER_SPIN_MS,
  COUNTER_STAGGER_MS,
  COUNTER_HOLD_MS,
  LED_THANK_YOU,
} from "@/lib/constants";

// Slot-machine counter. Each digit cell is a window over a vertical strip of
// 0-9 repeated three times; a rAF loop drives translateY only (compositor
// work, no layout). Spinning keeps position monotonically increasing; the
// strip repeats, so the wrap from ...9 back to 0 is seamless.

const EASE_MS = 600;
const SPIN_SPEED = 18; // digits per second while spinning
const STRIP = Array.from({ length: 30 }, (_, i) => i % 10);

interface Reel {
  pos: number; // continuous position, 1 unit = one digit height
  mode: "spin" | "ease" | "locked";
  from: number;
  to: number;
  t0: number;
}

interface Props {
  heading: string;
  target: number;
  mode: "together" | "staggered";
  showThankYou?: boolean;
  onComplete: () => void;
}

export default function CounterScreen({
  heading,
  target,
  mode,
  showThankYou = false,
  onComplete,
}: Props) {
  const targetRef = useRef(target);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    targetRef.current = target;
    onCompleteRef.current = onComplete;
  }, [target, onComplete]);

  const [lockedValue, setLockedValue] = useState<number | null>(null);
  const [showMessage, setShowMessage] = useState(false);
  const doneRef = useRef(false);
  const reelsRef = useRef<Reel[]>([]);
  const cellsRef = useRef<(HTMLSpanElement | null)[]>([]);

  const numDigits = Math.max(3, String(lockedValue ?? target).length);

  // create reels as digit cells appear (they start spinning)
  useEffect(() => {
    const reels = reelsRef.current;
    while (reels.length < numDigits) {
      reels.push({
        pos: Math.random() * 10,
        mode: doneRef.current ? "locked" : "spin",
        from: 0,
        to: 0,
        t0: 0,
      });
    }
  }, [numDigits]);

  // animation loop — updates transforms only
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const reels = reelsRef.current;
      for (let i = 0; i < reels.length; i++) {
        const reel = reels[i];
        if (reel.mode === "spin") {
          reel.pos += SPIN_SPEED * dt;
        } else if (reel.mode === "ease") {
          const p = Math.min((now - reel.t0) / EASE_MS, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          reel.pos = reel.from + (reel.to - reel.from) * eased;
          if (p >= 1) {
            reel.mode = "locked";
            reel.pos = reel.to;
          }
        }
        const el = cellsRef.current[i];
        if (el) {
          // keep within the middle copy of the repeated strip
          el.style.transform = `translateY(${-((reel.pos % 10) + 10)}em)`;
        }
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // lock a reel onto a digit with at least one extra revolution
  const lockReel = (index: number, digit: number) => {
    const reel = reelsRef.current[index];
    if (!reel) return;
    const base = Math.ceil(reel.pos) + 10;
    reel.from = reel.pos;
    reel.to = base + ((((digit - base) % 10) + 10) % 10);
    reel.t0 = performance.now();
    reel.mode = "ease";
  };

  const digitsOf = (value: number, n: number) =>
    value.toString().padStart(n, "0").split("").map(Number);

  // spin/lock orchestration — runs once on mount
  useEffect(() => {
    initScrollingSound();
    const roll = rollLoop();
    const timers: ReturnType<typeof setTimeout>[] = [];
    const after = (ms: number, fn: () => void) =>
      timers.push(setTimeout(fn, ms));

    startScrollingSound();

    if (mode === "together") {
      after(COUNTER_SPIN_MS, () => {
        const value = targetRef.current;
        setLockedValue(value);
        const digits = digitsOf(value, Math.max(3, String(value).length));
        digits.forEach((d, i) => lockReel(i, d));
        after(EASE_MS, () => {
          roll.stop();
          stopScrollingSound();
          stopThunk();
          doneRef.current = true;
        });
        after(EASE_MS + COUNTER_HOLD_MS, () => onCompleteRef.current());
      });
    } else {
      after(COUNTER_SPIN_MS, () => {
        const value = targetRef.current;
        setLockedValue(value);
        const n = Math.max(3, String(value).length);
        const digits = digitsOf(value, n);
        digits.forEach((d, i) => {
          after(i * COUNTER_STAGGER_MS, () => lockReel(i, d));
          after(i * COUNTER_STAGGER_MS + EASE_MS, () => stopThunk());
        });
        const lastLock = (n - 1) * COUNTER_STAGGER_MS + EASE_MS;
        after(lastLock + 300, () => {
          roll.stop();
          stopScrollingSound();
          playCelebration();
          setShowMessage(true);
          doneRef.current = true;
          onCompleteRef.current();
        });
      });
    }

    return () => {
      roll.stop();
      stopScrollingSound();
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // live updates after the sequence finished (hold phase)
  useEffect(() => {
    if (!doneRef.current || lockedValue === null || target === lockedValue) {
      return;
    }
    setLockedValue(target);
    const n = Math.max(3, String(target).length);
    const digits = digitsOf(target, n);
    let changed = false;
    digits.forEach((d, i) => {
      const reel = reelsRef.current[i];
      if (!reel) return;
      const current = ((Math.round(reel.pos) % 10) + 10) % 10;
      if (current !== d || reel.mode !== "locked") {
        lockReel(i, d);
        changed = true;
      }
    });
    if (changed) stopThunk();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-[6vh] px-6">
      <h2 className="animate-[fade-in_1s_ease-out_both] text-center text-[clamp(1.2rem,4vh,3rem)] font-bold uppercase tracking-[0.3em] text-vaseline-navy">
        {heading}
      </h2>
      <div className="flex gap-[0.06em] text-[26vh] font-bold leading-none text-vaseline-navy">
        {Array.from({ length: numDigits }).map((_, i) => (
          <span
            key={i}
            className="relative block h-[1em] w-[0.72em] overflow-hidden text-center [text-shadow:0_0.02em_0.12em_rgba(43,58,128,0.3)]"
          >
            <span
              ref={(el) => {
                cellsRef.current[i] = el;
              }}
              className="absolute left-0 top-0 block w-full will-change-transform"
            >
              {STRIP.map((d, j) => (
                <span key={j} className="block h-[1em] w-full">
                  {d}
                </span>
              ))}
            </span>
          </span>
        ))}
      </div>
      {showThankYou && showMessage && (
        <p className="max-w-5xl animate-[zoom-fade-in_1.2s_ease-out_both] text-center text-[clamp(1.4rem,5vh,3.6rem)] font-bold uppercase tracking-[0.18em] text-vaseline-navy">
          {LED_THANK_YOU}
        </p>
      )}
    </div>
  );
}
