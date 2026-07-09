"use client";

import { useEffect, useState } from "react";
import { FALLBACK_POLL_INTERVAL_MS } from "@/lib/constants";

// Live submission count. Primary channel is the SSE stream (instant pushes,
// auto-reconnecting); a slow poll runs underneath as a safety net so the
// value recovers even if the stream dies silently. Keeps the last known
// value on any error.
export function useCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    const apply = (n: number) => {
      if (active && Number.isFinite(n)) setCount(n);
    };

    const load = async () => {
      try {
        const res = await fetch("/api/submissions", { cache: "no-store" });
        if (!res.ok) return;
        const data: { count?: unknown } = await res.json();
        if (typeof data.count === "number") apply(data.count);
      } catch {
        // network hiccup — keep last value
      }
    };

    load();
    const source = new EventSource("/api/submissions/stream");
    source.onmessage = (event) => apply(Number(event.data));
    const fallback = setInterval(load, FALLBACK_POLL_INTERVAL_MS);

    return () => {
      active = false;
      source.close();
      clearInterval(fallback);
    };
  }, []);

  return count;
}
