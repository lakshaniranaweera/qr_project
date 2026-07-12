"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { initAudio } from "@/lib/audio";
import {
  initSoundEffects,
  initMessageSound,
  startMessageBursts,
  stopMessageBursts,
} from "@/lib/soundEffects";
import {
  VIDEO_END_FREEZE_MS,
  LED_FIXED_COUNT,
  MESSAGE_PLAYS_PER_SEC_MIN,
  MESSAGE_PLAYS_PER_SEC_MAX,
} from "@/lib/constants";
import { preloadShowAssets } from "@/lib/preload";
import LoadingScreen from "./screens/LoadingScreen";
import GoScreen from ".\/screens/GoScreen";
import QRScreen from "./QRscreen";
import PledgeScreen from "./screens/PledgeScreen";
import CountdownScreen from "./screens/CountdownScreen";
import LogoOverlay from "./screens/LogoOverlay";
import CounterScreen from "./screens/CounterScreen";

type Phase = "loading" | "welcome" | "go" | "qr" | "pledge" | "countdown" | "video" | "counter";

export default function LedShow() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [loadProgress, setLoadProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Buffer every asset up front so the show never stutters. A short minimum
  // keeps the loading animation from flashing when assets are already cached.
  useEffect(() => {
    let active = true;
    const minDelay = new Promise((r) => setTimeout(r, 700));
    Promise.all([
      preloadShowAssets((loaded, total) => {
        if (active) setLoadProgress(total ? loaded / total : 1);
      }),
      minDelay,
    ]).then(() => {
      if (active) setPhase("welcome");
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (phase === "video") {
      const video = videoRef.current;
      video?.play().catch(() => {});
      // Randomized message-sound bursts run for the whole video phase.
      startMessageBursts(MESSAGE_PLAYS_PER_SEC_MIN, MESSAGE_PLAYS_PER_SEC_MAX);
      return () => stopMessageBursts();
    }
  }, [phase]);

  // Screen 1 → 2: the welcome touch also unlocks audio and primes the show.
  const handleWelcomeTouch = async () => {
    await initAudio();
    initSoundEffects();
    initMessageSound();
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
    setPhase("go");
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
      {phase === "video" && (
        <>
          <LogoOverlay />
          <CounterScreen
            heading="Total Pledges"
            target={LED_FIXED_COUNT}
            placement="bottom"
            endless
            silent
            onComplete={() => {}}
          />
        </>
      )}

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
      {phase === "go" && (
        <GoScreen onComplete={() => setPhase("qr")} />
      )}
      {phase === "qr" && (
        <QRScreen onComplete={() => setPhase("pledge")} />
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
          target={LED_FIXED_COUNT}
          showThankYou
          onComplete={() => {}}
        />
      )}

      {phase === "loading" && <LoadingScreen progress={loadProgress} />}
    </div>
  );
}
