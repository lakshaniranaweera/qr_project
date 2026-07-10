"use client";

import Image from "next/image";
import { PLEDGE_TEXT } from "@/lib/constants";

// Advances on touch/click (kiosk interaction — the whole screen is the target).
export default function PledgeScreen({
  onComplete,
}: {
  onComplete: () => void;
}) {
  return (
    <div
      onClick={onComplete}
      className="absolute inset-0 flex animate-[fade-in_2s_ease-out_both] cursor-pointer flex-col items-center justify-center px-[8vw]"
    >
      <Image
        src="/logo.png"
        alt="Vaseline"
        width={1200}
        height={360}
        priority
        className="h-auto w-[clamp(420px,58vw,900px)]"
      />
      <p className="mt-[6vh] max-w-6xl whitespace-pre-line text-center text-[clamp(1.25rem,3.6vw,2rem)] font-semibold leading-relaxed text-vaseline-blue">
        {PLEDGE_TEXT}
      </p>
    </div>
  );
}
