"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface AudioEntry {
  file: string;
  contentType: string;
  originalName: string;
  size: number;
  updatedAt: string;
}

interface SlotInfo {
  slot: string;
  url: string;
  entry: AudioEntry | null;
}

const SLOT_LABELS: Record<string, { title: string; hint: string }> = {
  scrolling: {
    title: "Scrolling",
    hint: "Plays while the counter reels are spinning on the last page.",
  },
  celebration: {
    title: "Celebration",
    hint: "Plays when the live counter locks in at the finale.",
  },
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AudioManager() {
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/audio", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load audio settings");
      const data = (await res.json()) as { slots: SlotInfo[] };
      setSlots(data.slots);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load audio settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // One-off load of the manifest on mount; state settles after the fetch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-zinc-800">Sound Effects</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Upload and replace the LED show sound effects. No code changes
            needed — the show picks up the latest file automatically.
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {loading
          ? [0, 1].map((i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-xl border border-zinc-200 bg-zinc-50"
              />
            ))
          : slots.map((s) => (
              <SlotCard key={s.slot} info={s} onChanged={refresh} />
            ))}
      </div>
    </div>
  );
}

function SlotCard({
  info,
  onChanged,
}: {
  info: SlotInfo;
  onChanged: () => void;
}) {
  const label = SLOT_LABELS[info.slot] ?? { title: info.slot, hint: "" };
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const notify = (text: string, err = false) => {
    setMsg(text);
    setIsError(err);
  };

  const upload = async (file: File) => {
    setBusy(true);
    notify("Uploading…");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch(`/api/audio/${info.slot}`, {
        method: "PUT",
        body,
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Upload failed");
      }
      notify("Saved");
      onChanged();
    } catch (e) {
      notify(e instanceof Error ? e.message : "Upload failed", true);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async () => {
    setBusy(true);
    notify("Removing…");
    try {
      const res = await fetch(`/api/audio/${info.slot}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Remove failed");
      notify("Removed");
      onChanged();
    } catch (e) {
      notify(e instanceof Error ? e.message : "Remove failed", true);
    } finally {
      setBusy(false);
    }
  };

  const entry = info.entry;
  // Cache-bust the preview so a replaced file is heard immediately.
  const previewSrc = entry ? `${info.url}?v=${encodeURIComponent(entry.updatedAt)}` : null;

  return (
    <div className="flex flex-col rounded-xl border border-zinc-200 bg-zinc-50/60 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold text-zinc-800">{label.title}</h4>
          <p className="mt-0.5 text-xs text-zinc-500">{label.hint}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
            entry
              ? "bg-green-100 text-green-700"
              : "bg-zinc-200 text-zinc-500"
          }`}
        >
          {entry ? "Uploaded" : "No file"}
        </span>
      </div>

      {entry ? (
        <div className="mt-3 space-y-2">
          <p className="truncate text-sm font-medium text-zinc-700" title={entry.originalName}>
            {entry.originalName}
          </p>
          <p className="text-xs text-zinc-400">
            {formatSize(entry.size)} · updated{" "}
            {new Date(entry.updatedAt).toLocaleString()}
          </p>
          {previewSrc && (
            <audio
              key={previewSrc}
              controls
              preload="none"
              src={previewSrc}
              className="h-9 w-full"
            />
          )}
        </div>
      ) : (
        <p className="mt-3 text-sm text-zinc-400">
          This effect is silent until a file is uploaded.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
          }}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="rounded-lg bg-vaseline-blue px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-vaseline-blue-deep disabled:opacity-50"
        >
          {entry ? "Replace" : "Upload"}
        </button>
        {entry && (
          <button
            type="button"
            disabled={busy}
            onClick={remove}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-50"
          >
            Remove
          </button>
        )}
        {msg && (
          <span
            className={`text-xs font-medium ${
              isError ? "text-red-600" : "text-zinc-500"
            }`}
          >
            {msg}
          </span>
        )}
      </div>
    </div>
  );
}
