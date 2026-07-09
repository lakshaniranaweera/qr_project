"use client";

import { useEffect, useRef, useState } from "react";

type State = "idle" | "confirm" | "busy" | "done" | "error";

export default function ResetCounter() {
  const [state, setState] = useState<State>("idle");
  const revertTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (revertTimer.current) clearTimeout(revertTimer.current);
    };
  }, []);

  const revertSoon = (ms: number) => {
    if (revertTimer.current) clearTimeout(revertTimer.current);
    revertTimer.current = setTimeout(() => setState("idle"), ms);
  };

  async function handleClick() {
    if (state === "idle") {
      setState("confirm");
      revertSoon(5000); // confirmation expires if not acted on
      return;
    }
    if (state !== "confirm") return;
    if (revertTimer.current) clearTimeout(revertTimer.current);
    setState("busy");
    try {
      const res = await fetch("/api/submissions", { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setState("done");
    } catch {
      setState("error");
    }
    revertSoon(2500);
  }

  const label =
    state === "idle"
      ? "Reset counter"
      : state === "confirm"
        ? "Tap again to confirm"
        : state === "busy"
          ? "Resetting…"
          : state === "done"
            ? "Counter reset to 0"
            : "Reset failed — try again";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={state === "busy"}
      className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
        state === "confirm"
          ? "border-red-300 bg-red-600 text-white hover:bg-red-700"
          : state === "done"
            ? "border-green-300 bg-green-50 text-green-700"
            : state === "error"
              ? "border-red-300 bg-red-50 text-red-700"
              : "border-zinc-300 bg-white text-zinc-600 hover:border-red-300 hover:text-red-600"
      }`}
    >
      {label}
    </button>
  );
}
