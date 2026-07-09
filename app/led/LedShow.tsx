"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { initAudio } from "@/lib/audio";
import { initSoundEffects } from "@/lib/soundEffects";
import { VIDEO_END_FREEZE_MS } from "@/lib/constants";
import { useCount } from "./useCount";
import PledgeScreen from "./screens/PledgeScreen";
import CountdownScreen from "./screens/CountdownScreen";
import LogoOverlay from "./screens/LogoOverlay";
import CounterScreen from "./screens/CounterScreen";

type Phase = "welcome" | "pledge" | "countdown" | "video" | "counter";

export default function LedShow() {
  const [phase, setPhase] = useState<Phase>("welcome");
  const videoRef = useRef<HTMLVideoElement>(null);
  const count = useCount();

  useEffect(() => {
    if (phase === "video") {
      const video = videoRef.current;
      video?.play().catch(() => {});
    }
  }, [phase]);

  // Screen 1 → 2: the welcome touch also unlocks audio and primes the show.
  const handleWelcomeTouch = async () => {
    await initAudio();
    initSoundEffects();
    const video = videoRef.current;
    if (video) {
      try {
        await video.play();
        video.pause();
        video.currentTime = 0;
      } catch {
        // priming failed; the video-phase effect will retry when needed
      }
    }
    setPhase("pledge");
  };

  const handleVideoEnded = () => {
    setTimeout(() => setPhase("counter"), VIDEO_END_FREEZE_MS);
  };

  const bgVisible = phase !== "video";

  return (
    <div className="relative h-dvh w-full select-none overflow-hidden bg-black">
      {/* Persistent video layer for the show segment. */}
      <video
        ref={videoRef}
        src="/fillingvideo.mp4"
        preload="auto"
        playsInline
        onEnded={handleVideoEnded}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {phase === "video" && <LogoOverlay />}

      {/* Shared LED background — also the Screen 1 welcome image. Fades away
          for the video, back in after. */}
      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ${
          bgVisible ? "opacity-100" : "opacity-0"
        }`}
        style={{ backgroundImage: "url(/LEDbackground.png)" }}
      />

      {phase === "welcome" && (
        <>
          {/* Logo centered on the idle/welcome screen, before the first tap.
              pointer-events-none so the full-screen Begin button still gets
              every tap. */}
          <div className="pointer-events-none absolute inset-0 flex animate-[fade-in_1.2s_ease-out_both] items-center justify-center px-[8vw]">
            <Image
               src="/logo.png"
  alt="Vaseline"
  width={2200}
  height={1560}
  priority
  className="h-auto w-[clamp(700px,80vw,1200px)]"
            />
          </div>
          <button
            type="button"
            onClick={handleWelcomeTouch}
            aria-label="Begin"
            className="absolute inset-0 cursor-pointer"
          />
        </>
      )}
      {phase === "pledge" && (
        <PledgeScreen onComplete={() => setPhase("countdown")} />
      )}
      {phase === "countdown" && (
        <CountdownScreen onComplete={() => setPhase("video")} />
      )}
      {phase === "counter" && (
        <CounterScreen
          heading="Total Pledges"
          target={count}
          mode="staggered"
          showThankYou
          onComplete={() => {}}
        />
      )}
    </div>
  );
}
