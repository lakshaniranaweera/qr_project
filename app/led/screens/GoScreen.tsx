"use client";

import Image from "next/image";

// --- Configurable settings for this screen ---
// Adjust these (in pixels) to resize Go.png without touching any layout
// logic below. Currently set to 600 x 200.
const GO_IMAGE_WIDTH = 1500;
const GO_IMAGE_HEIGHT = 1000;
// ----------------------------------------------

// New second step, shown right after the idle/welcome screen. Advances on
// touch/click (kiosk interaction — the whole screen is the target), matching
// the interaction pattern used on PledgeScreen.
export default function GoScreen({
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
        src="/Go.png"
        alt="Go"
        width={GO_IMAGE_WIDTH}
        height={GO_IMAGE_HEIGHT}
        priority
        style={{ width: GO_IMAGE_WIDTH, height: GO_IMAGE_HEIGHT }}
      />
    </div>
  );
}
