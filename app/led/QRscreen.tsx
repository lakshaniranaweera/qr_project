"use client";

import Image from "next/image";

// --- Configurable settings for this screen ---
// Adjust QR_CODE_SIZE (in pixels) to resize the QR code without touching
// any layout logic below.
const QR_CODE_SIZE = 620;

// Text shown above the QR code. Update to the real pledge URL.
const QR_URL_TEXT = "https://qr-dashboard-cfmy.onrender.com";
// ----------------------------------------------

// Second step, shown right after the idle/welcome screen. Advances on
// touch/click (kiosk interaction — the whole screen is the target), matching
// the interaction pattern used on PledgeScreen.
export default function QRScreen({
  onComplete,
}: {
  onComplete: () => void;
}) {
  return (
    <div
      onClick={onComplete}
      className="absolute inset-0 flex animate-[fade-in_2s_ease-out_both] cursor-pointer flex-col items-center justify-center px-[8vw]"
    >
      <p className="mb-[6vh] max-w-6xl whitespace-pre-line text-center text-[clamp(1.25rem,3.6vw,2rem)] font-semibold leading-relaxed text-vaseline-blue">
        {QR_URL_TEXT}
      </p>
      <Image
        src="/QR.png"
        alt="Scan to pledge"
        width={QR_CODE_SIZE}
        height={QR_CODE_SIZE}
        priority
        style={{ width: QR_CODE_SIZE, height: QR_CODE_SIZE }}
      />
    </div>
  );
}
