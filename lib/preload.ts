// Warm the browser cache with every heavy asset the LED show plays, so the
// experience runs without first-play stutter. Media is loaded through real
// <video>/<audio>/<img> elements (not just fetch) so the browser's media
// cache — the one the runtime elements reuse — is primed and "ready to play".

type AssetKind = "image" | "video" | "audio";

interface Asset {
  url: string;
  kind: AssetKind;
}

// Everything the show references at runtime by a raw URL.
export const SHOW_ASSETS: Asset[] = [
  { url: "/firecountdown.mp4", kind: "video" },
  { url: "/fillingvideo.mp4", kind: "video" },
  { url: "/LEDbackground.png", kind: "image" },
  { url: "/logo.png", kind: "image" },
  { url: "/Agree.png", kind: "image" },
  { url: "/scroll.mp3", kind: "audio" },
  { url: "/message.mp3", kind: "audio" },
];

// A single asset that stalls (slow network, missing file) must never hang the
// whole show — resolve anyway after this long.
const PER_ASSET_TIMEOUT_MS = 25000;

function loadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    const done = () => resolve();
    img.onload = done;
    img.onerror = done;
    img.src = url;
  });
}

function loadMedia(url: string, tag: "video" | "audio"): Promise<void> {
  return new Promise((resolve) => {
    const el = document.createElement(tag) as HTMLMediaElement;
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve();
    };
    el.preload = "auto";
    el.muted = true;
    // Buffered enough to play through without pausing → good to go.
    el.addEventListener("canplaythrough", finish, { once: true });
    el.addEventListener("error", finish, { once: true });
    const timer = setTimeout(finish, PER_ASSET_TIMEOUT_MS);
    el.src = url;
    el.load();
  });
}

function loadOne(asset: Asset): Promise<void> {
  if (asset.kind === "image") return loadImage(asset.url);
  return loadMedia(asset.url, asset.kind);
}

// Loads every asset in parallel, reporting progress as each finishes. Resolves
// once all are done (or individually timed out).
export async function preloadShowAssets(
  onProgress?: (loaded: number, total: number) => void
): Promise<void> {
  if (typeof window === "undefined") return;
  const total = SHOW_ASSETS.length;
  let loaded = 0;
  onProgress?.(0, total);
  await Promise.all(
    SHOW_ASSETS.map(async (asset) => {
      await loadOne(asset);
      loaded += 1;
      onProgress?.(loaded, total);
    })
  );
}
