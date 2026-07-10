"use client";

import { useState, useSyncExternalStore } from "react";
import {
  PLEDGE_TEXT,
  AGREE_BUTTON_LABEL,
  USER_THANK_YOU,
} from "@/lib/constants";

type Status = "idle" | "submitting" | "done" | "error";

const PLEDGED_KEY = "vaseline-pledged";

const noopSubscribe = () => () => {};
function readPledgedFlag(): boolean {
  try {
    return localStorage.getItem(PLEDGED_KEY) === "1";
  } catch {
    return false; // storage unavailable (private mode) — allow submission
  }
}

export default function PledgeForm() {
  const [status, setStatus] = useState<Status>("idle");
  // Duplicate guard: a device that already pledged goes straight to the
  // thank-you state instead of offering a second submission.
  const alreadyPledged = useSyncExternalStore(
    noopSubscribe,
    readPledgedFlag,
    () => false
  );

  function submit() {
    // No backend anymore — remember the pledge locally and show the thank-you.
    try {
      localStorage.setItem(PLEDGED_KEY, "1");
    } catch {
      // storage unavailable (private mode) — proceed to thank-you anyway
    }
    setStatus("done");
  }

  // Rendered inside the frosted-glass popup owned by app/user/page.tsx.
  return (
    <div className="mt-6">
      {status === "done" || (alreadyPledged && status === "idle") ? (
        <div className="animate-[fade-in_0.6s_ease-out_both] rounded-3xl border border-white/30 bg-white/20 p-6 text-center shadow-[0_18px_45px_rgba(43,58,128,0.18)] backdrop-blur-xl sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-0">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-vaseline-blue text-white shadow-lg sm:h-16 sm:w-16">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-10 w-10 sm:h-8 sm:w-8"
              aria-hidden
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <p className="mt-5 text-[clamp(1.15rem,5vw,1.5rem)] font-bold uppercase tracking-wide text-vaseline-blue sm:mt-5 sm:text-[clamp(1.1rem,4.5vw,1.4rem)]">
            {USER_THANK_YOU}
          </p>
        </div>
      ) : (
        // Plain div, not a <form>. There's no backend submission happening
        // here anymore (see submit() below), so a <form>/type="submit"
        // button bought us nothing but risk: on mobile, native form
        // submission can fire (navigating to the current URL — a reload
        // that looks like "redirecting to the same page") before or
        // instead of a JS preventDefault() handler, especially under any
        // hydration/tap-delay race. A plain button with onClick removes
        // that failure mode entirely.
        <div>
          <p className="whitespace-pre-line text-center text-[clamp(1rem,3.8vw,1.25rem)] font-bold leading-relaxed text-vaseline-blue">
            {PLEDGE_TEXT}
          </p>
          <button
            type="button"
            onClick={submit}
            disabled={status === "submitting"}
            className="mt-6 w-full touch-manipulation rounded-full bg-vaseline-blue py-4 text-[clamp(1.05rem,4.5vw,1.3rem)] font-bold uppercase tracking-widest text-white shadow-[0_8px_30px_rgba(0,87,168,0.45)] transition-all duration-150 hover:scale-[1.03] hover:bg-vaseline-blue-deep hover:shadow-[0_10px_36px_rgba(0,87,168,0.6)] active:scale-95 disabled:scale-100 disabled:opacity-60"
          >
            {status === "submitting" ? "Submitting…" : AGREE_BUTTON_LABEL}
          </button>
          {status === "error" && (
            <p className="mt-3 text-center text-sm font-bold text-red-600">
              Something went wrong. Please tap again.
            </p>
          )}
        </div>
      )}
    </div>
  );
}