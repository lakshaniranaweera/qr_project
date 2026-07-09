"use client";

// Shown while the show's assets buffer. Pure CSS animation — no assets of its
// own — so it appears instantly on a cold load.
export default function LoadingScreen({ progress }: { progress: number }) {
  const pct = Math.round(Math.min(Math.max(progress, 0), 1) * 100);
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-10 bg-black">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-white/15 border-t-white" />
      <div className="w-[min(70vw,420px)]">
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-white transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-5 text-center text-sm font-semibold uppercase tracking-[0.35em] text-white/80">
          Loading {pct}%
        </p>
      </div>
    </div>
  );
}
