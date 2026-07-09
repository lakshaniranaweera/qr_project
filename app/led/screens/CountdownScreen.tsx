"use client";

import { useEffect, useRef } from "react";

export default function CountdownScreen({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const doneRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  const handleEnded = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onCompleteRef.current();
  };

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <video
        ref={videoRef}
        src="/firecountdown.mp4"
        className="absolute inset-0 h-full w-full object-cover"
        playsInline
        preload="auto"
        onEnded={handleEnded}
      />
    </div>
  );
}
