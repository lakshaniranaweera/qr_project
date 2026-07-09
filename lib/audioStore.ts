import { promises as fs } from "fs";
import path from "path";

// Uploaded sound-effect files, persisted to disk under data/audio/.
// The managed slots "scrolling" (played while the counter reels spin) and
// "celebration" (played at the counter finale) each hold at most one file;
// uploading replaces whatever was there. A manifest.json maps each slot to
// its stored filename and metadata. (The countdown's sound comes from the fire
// countdown video's own audio track, not from an uploaded file.)
//
// Like the submission store, all writes are serialized through an in-process
// promise chain (kept on globalThis so every route handler shares it) so
// concurrent uploads never interleave their read-modify-write of the manifest.

const AUDIO_DIR = path.join(process.cwd(), "data", "audio");
const MANIFEST = path.join(AUDIO_DIR, "manifest.json");

export const AUDIO_SLOTS = ["scrolling", "celebration"] as const;
export type AudioSlot = (typeof AUDIO_SLOTS)[number];

export function isAudioSlot(value: string): value is AudioSlot {
  return (AUDIO_SLOTS as readonly string[]).includes(value);
}

export interface AudioEntry {
  file: string; // stored filename on disk, e.g. "celebration.mp3"
  contentType: string;
  originalName: string;
  size: number;
  updatedAt: string;
}

type Manifest = Partial<Record<AudioSlot, AudioEntry>>;

interface SharedState {
  queue: Promise<unknown>;
}

const globalRef = globalThis as typeof globalThis & {
  __audioStore?: SharedState;
};

const shared: SharedState =
  globalRef.__audioStore ??
  (globalRef.__audioStore = { queue: Promise.resolve() });

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = shared.queue.then(task, task);
  shared.queue = run.catch(() => {});
  return run;
}

async function readManifestRaw(): Promise<Manifest> {
  try {
    const raw = await fs.readFile(MANIFEST, "utf8");
    const parsed = JSON.parse(raw) as Manifest;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    // missing or unreadable manifest counts as "nothing uploaded"
    return {};
  }
}

async function writeManifestRaw(manifest: Manifest): Promise<void> {
  await fs.mkdir(AUDIO_DIR, { recursive: true });
  const json = JSON.stringify(manifest, null, 2);
  const tmp = MANIFEST + ".tmp";
  try {
    await fs.writeFile(tmp, json, "utf8");
    await fs.rename(tmp, MANIFEST);
  } catch {
    // Windows can throw EPERM on rename-over-existing (AV scanners);
    // a direct write is acceptable given writes are already serialized.
    await fs.writeFile(MANIFEST, json, "utf8");
  }
}

const EXT_BY_TYPE: Record<string, string> = {
  "audio/mpeg": ".mp3",
  "audio/mp3": ".mp3",
  "audio/wav": ".wav",
  "audio/x-wav": ".wav",
  "audio/wave": ".wav",
  "audio/ogg": ".ogg",
  "audio/webm": ".webm",
  "audio/aac": ".aac",
  "audio/mp4": ".m4a",
  "audio/x-m4a": ".m4a",
  "audio/flac": ".flac",
};

function extensionFor(contentType: string, originalName: string): string {
  const byType = EXT_BY_TYPE[contentType.toLowerCase()];
  if (byType) return byType;
  const fromName = path.extname(originalName).toLowerCase();
  if (fromName && /^\.[a-z0-9]{1,5}$/.test(fromName)) return fromName;
  return ".bin";
}

/** Metadata for a single slot, or null when nothing is uploaded. */
export function getEntry(slot: AudioSlot): Promise<AudioEntry | null> {
  return enqueue(async () => (await readManifestRaw())[slot] ?? null);
}

/** Metadata for both slots, for the admin UI. */
export function listEntries(): Promise<Record<AudioSlot, AudioEntry | null>> {
  return enqueue(async () => {
    const manifest = await readManifestRaw();
    return {
      scrolling: manifest.scrolling ?? null,
      celebration: manifest.celebration ?? null,
    };
  });
}

/** Read the raw bytes for a slot (for serving), or null when absent. */
export function readAudio(
  slot: AudioSlot
): Promise<{ data: Buffer; entry: AudioEntry } | null> {
  return enqueue(async () => {
    const entry = (await readManifestRaw())[slot];
    if (!entry) return null;
    try {
      const data = await fs.readFile(path.join(AUDIO_DIR, entry.file));
      return { data, entry };
    } catch {
      return null;
    }
  });
}

/** Store (or replace) a slot's audio file and return its new metadata. */
export function saveAudio(
  slot: AudioSlot,
  bytes: Buffer,
  contentType: string,
  originalName: string
): Promise<AudioEntry> {
  return enqueue(async () => {
    await fs.mkdir(AUDIO_DIR, { recursive: true });
    const manifest = await readManifestRaw();
    const previous = manifest[slot];

    const file = `${slot}${extensionFor(contentType, originalName)}`;
    await fs.writeFile(path.join(AUDIO_DIR, file), bytes);

    // If the replacement has a different extension, remove the stale file.
    if (previous && previous.file !== file) {
      await fs
        .rm(path.join(AUDIO_DIR, previous.file), { force: true })
        .catch(() => {});
    }

    const entry: AudioEntry = {
      file,
      contentType,
      originalName,
      size: bytes.length,
      updatedAt: new Date().toISOString(),
    };
    manifest[slot] = entry;
    await writeManifestRaw(manifest);
    return entry;
  });
}

/** Remove a slot's audio file. No-op when nothing is uploaded. */
export function deleteAudio(slot: AudioSlot): Promise<void> {
  return enqueue(async () => {
    const manifest = await readManifestRaw();
    const entry = manifest[slot];
    if (!entry) return;
    await fs
      .rm(path.join(AUDIO_DIR, entry.file), { force: true })
      .catch(() => {});
    delete manifest[slot];
    await writeManifestRaw(manifest);
  });
}
