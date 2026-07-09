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
        width={500}
        height={150}
        
      />
      <p className="mt-[6vh] max-w-6xl text-center text-[clamp(1.2rem,3.4vh,2.8rem)] font-semibold leading-relaxed text-vaseline-blue">
        {PLEDGE_TEXT}
      </p>
    </div>
  );
}
