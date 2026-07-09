"use client";

import { useEffect, useRef, useState } from "react";

const COUNTDOWN_START = 10;
const COUNTDOWN_STEP_MS = 1000;
const BLAST_HOLD_MS = 900;

export default function CountdownScreen({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [count, setCount] = useState(COUNTDOWN_START);
  const [blast, setBlast] = useState(false);
  const doneRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const videoRef = useRef<HTMLVideoElement>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const blastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {});
    return () => {
      video.pause();
    };
  }, []);

  useEffect(() => {
    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      onCompleteRef.current();
    };

    tickRef.current = setInterval(() => {
      setCount((current) => {
        if (current <= 1) {
          if (tickRef.current) {
            clearInterval(tickRef.current);
            tickRef.current = null;
          }
          setBlast(true);
          blastRef.current = setTimeout(finish, BLAST_HOLD_MS);
          return 1;
        }
        return current - 1;
      });
    }, COUNTDOWN_STEP_MS);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (blastRef.current) clearTimeout(blastRef.current);
    };
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-transparent">
      <video
        ref={videoRef}
        src="/firecountdown.mp4"
        className="absolute inset-0 h-full w-full object-cover opacity-75"
        playsInline
        loop
        preload="auto"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.16),rgba(255,255,255,0.04)_32%,rgba(0,0,0,0.12)_68%,transparent_100%)]" />
      <div className="relative z-10 flex flex-col items-center justify-center gap-6 text-vaseline-navy">
        <div className="relative flex items-center justify-center">
          {blast && (
            <div className="absolute inset-[-6rem] animate-[blast-wave_0.9s_ease-out_both] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.98)_0%,rgba(255,245,181,0.9)_18%,rgba(255,196,62,0.7)_36%,rgba(255,106,0,0.24)_56%,transparent_76%)] blur-[2px]" />
          )}
          {blast && (
            <div className="absolute inset-[-10rem] animate-[blast-rays_0.9s_ease-out_both] bg-[conic-gradient(from_0deg,transparent_0_8%,rgba(255,255,255,0.92)_8%_10%,transparent_10%_18%,rgba(255,214,99,0.88)_18%_20%,transparent_20%_28%,rgba(255,255,255,0.92)_28%_30%,transparent_30%_38%,rgba(255,214,99,0.88)_38%_40%,transparent_40%_48%,rgba(255,255,255,0.92)_48%_50%,transparent_50%_58%,rgba(255,214,99,0.88)_58%_60%,transparent_60%_68%,rgba(255,255,255,0.92)_68%_70%,transparent_70%_78%,rgba(255,214,99,0.88)_78%_80%,transparent_80%_100%)] opacity-80 blur-[12px]" />
          )}
          <span className={`relative block text-[clamp(8rem,28vw,24rem)] font-bold leading-none tracking-[-0.06em] drop-shadow-[0_0.04em_0.18em_rgba(43,58,128,0.3)] ${blast ? "animate-[blast-pop_0.9s_ease-out_both]" : "animate-[count-pop_0.9s_ease-out_both]"}`}>
            {String(count).padStart(2, "0")}
          </span>
        </div>
      </div>
    </div>
  );
}
