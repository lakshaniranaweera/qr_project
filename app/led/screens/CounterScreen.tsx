"use client";

import { useEffect, useRef, useState } from "react";
import {
  initScrollingSound,
  startScrollingSound,
  stopScrollingSound,
  stopThunk,
} from "@/lib/audio";
import { playCelebration } from "@/lib/soundEffects";
import {
  COUNTER_SPIN_MS,
  COUNTER_HOLD_MS,
  BOTTOM_COUNTER_ROLL_PER_SEC,
  LED_THANK_YOU,
} from "@/lib/constants";

// Ascending odometer counter. A single value ramps from 0 up to `target`
// (easing to a stop), and every digit wheel is geared off that value — so the
// number visibly counts *up* (0, 1, 2, …) rather than showing random digits.
// A rAF loop drives translateY only (compositor work, no layout). Each digit
// cell is a window over a vertical strip of 0-9 repeated three times, so the
// wheel's wrap from ...9 back to 0 is seamless.

const STRIP = Array.from({ length: 30 }, (_, i) => i % 10);

interface Props {
  heading: string;
  target: number;
  spinMs?: number;
  // When true the wheels roll upward forever, never locking onto the target.
  endless?: boolean;
  // When true no scrolling spin sound plays.
  silent?: boolean;
  showThankYou?: boolean;
  placement?: "center" | "bottom";
  onComplete: () => void;
}

export default function CounterScreen({
  heading,
  target,
  spinMs = COUNTER_SPIN_MS,
  endless = false,
  silent = false,
  showThankYou = false,
  placement = "center",
  onComplete,
}: Props) {
  const bottom = placement === "bottom";
  const targetRef = useRef(target);
  const spinRef = useRef(spinMs);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    targetRef.current = target;
    spinRef.current = spinMs;
    onCompleteRef.current = onComplete;
  }, [target, spinMs, onComplete]);

  const [showMessage, setShowMessage] = useState(false);
  const cellsRef = useRef<(HTMLSpanElement | null)[]>([]);

  const numDigits = Math.max(3, String(target).length);

  // count-up decelerates smoothly into its final value
  const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);

  useEffect(() => {
    if (!silent) {
      initScrollingSound();
      startScrollingSound();
    }

    let raf = 0;
    let start: number | null = null;

    // Odometer gearing: digit i (from the left) advances once per 10^place
    // counts, so translateY tracks value / 10^place.
    const render = (value: number) => {
      for (let i = 0; i < numDigits; i++) {
        const place = Math.pow(10, numDigits - 1 - i);
        const pos = value / place;
        const el = cellsRef.current[i];
        if (el) el.style.transform = `translateY(${-((pos % 10) + 10)}em)`;
      }
    };

    const finish = () => {
      // snap each wheel exactly onto the target's digits
      const digits = target
        .toString()
        .padStart(numDigits, "0")
        .split("")
        .map(Number);
      digits.forEach((d, i) => {
        const el = cellsRef.current[i];
        if (el) el.style.transform = `translateY(${-(d + 10)}em)`;
      });
      stopScrollingSound();
      stopThunk();
      if (showThankYou) {
        playCelebration();
        setShowMessage(true);
      }
      setTimeout(() => onCompleteRef.current(), COUNTER_HOLD_MS);
    };

    const loop = (now: number) => {
      if (start === null) start = now;
      if (endless) {
        // Roll upward forever at a steady, slow rate — never locks.
        const elapsedSec = (now - start) / 1000;
        render(elapsedSec * BOTTOM_COUNTER_ROLL_PER_SEC);
        raf = requestAnimationFrame(loop);
        return;
      }
      const p = Math.min((now - start) / spinRef.current, 1);
      render(targetRef.current * easeOut(p));
      if (p >= 1) {
        finish();
        return; // ramp complete — stop the loop
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      if (!silent) stopScrollingSound();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`absolute inset-0 flex flex-col items-center px-6 ${
        bottom ? "justify-end gap-[2vh] pb-[6vh]" : "justify-center gap-[6vh]"
      }`}
    >
      <h2
        className={`animate-[fade-in_1s_ease-out_both] text-center font-bold uppercase tracking-[0.3em] text-vaseline-navy ${
          bottom
            ? "text-[clamp(0.8rem,2vh,1.4rem)]"
            : "text-[clamp(1.2rem,4vh,3rem)]"
        }`}
      >
        {heading}
      </h2>
      <div
        className={`flex gap-[0.06em] font-bold leading-none text-vaseline-navy ${
          bottom ? "text-[13vh]" : "text-[26vh]"
        }`}
      >
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
