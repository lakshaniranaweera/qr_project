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
        <div className="animate-[fade-in_0.6s_ease-out_both] text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-vaseline-blue text-white shadow-lg">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8"
              aria-hidden
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <p className="mt-5 text-[clamp(1.1rem,4.5vw,1.4rem)] font-bold uppercase tracking-wide text-vaseline-blue">
            {USER_THANK_YOU}
          </p>
        </div>
      ) : (
        <>
          <p className="text-center text-[clamp(0.95rem,3.8vw,1.2rem)] font-bold leading-relaxed text-vaseline-blue">
            {PLEDGE_TEXT}
          </p>
          <button
            type="button"
            onClick={submit}
            disabled={status === "submitting"}
            className="mt-6 w-full rounded-full bg-vaseline-blue py-4 text-[clamp(1.05rem,4.5vw,1.3rem)] font-bold uppercase tracking-widest text-white shadow-[0_8px_30px_rgba(0,87,168,0.45)] transition-all duration-150 hover:scale-[1.03] hover:bg-vaseline-blue-deep hover:shadow-[0_10px_36px_rgba(0,87,168,0.6)] active:scale-95 disabled:scale-100 disabled:opacity-60"
          >
            {status === "submitting" ? "Submitting…" : AGREE_BUTTON_LABEL}
          </button>
          {status === "error" && (
            <p className="mt-3 text-center text-sm font-bold text-red-600">
              Something went wrong. Please tap again.
            </p>
          )}
        </>
      )}
    </div>
  );
}
