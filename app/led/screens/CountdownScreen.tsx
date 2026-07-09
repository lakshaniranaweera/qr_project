"use client";

import { useEffect, useState } from "react";
import { playBlast } from "@/lib/soundEffects";
import {
  COUNTDOWN_FROM,
  COUNTDOWN_STEP_MS,
  COUNTDOWN_END_PAUSE_MS,
} from "@/lib/constants";

// Visual blast for each countdown number. The animation itself is an MP4 in
// public/ (muted, so it autoplays reliably and never competes with the
// uploaded blast sound effect). The <video> is keyed by n so it remounts and
// replays from frame 0 on every number, staying in sync with the countdown.
const BLAST_VIDEO_SRC = "/blast.mp4";

export default function CountdownScreen({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [n, setN] = useState(COUNTDOWN_FROM);

  useEffect(() => {
    const timer = setInterval(() => {
      setN((prev) => (prev > 0 ? prev - 1 : prev));
    }, COUNTDOWN_STEP_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    playBlast();
    if (n === 0) {
      const timer = setTimeout(onComplete, COUNTDOWN_END_PAUSE_MS);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* key={n} remounts the blast + number so both replay on every tick */}
      <div key={n} className="relative flex items-center justify-center">
        {/* MP4 blast animation, centered behind the number */}
        <video
          src={BLAST_VIDEO_SRC}
          autoPlay
          muted
          playsInline
          preload="auto"
          className="pointer-events-none absolute h-[80vh] w-[80vh] max-w-[90vw] object-contain"
        />
        {/* The number rides on top of the blast */}
        <span className="relative z-10 block animate-[blast-pop_0.55s_cubic-bezier(0.2,1.4,0.3,1)_both] text-[42vh] font-bold leading-none text-vaseline-navy [text-shadow:0_0_60px_rgba(43,58,128,0.35)]">
          {n}
        </span>
      </div>
    </div>
  );
}
