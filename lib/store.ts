import { promises as fs } from "fs";
import path from "path";

// Submission counter persisted to a JSON file on disk.
// All writes are serialized through an in-process promise chain so
// simultaneous POSTs never interleave their read-modify-write cycles.
//
// The queue and the change-listener set live on globalThis: Next.js bundles
// each route handler separately, so a plain module-level variable would give
// every route its own copy and SSE subscribers would never hear about
// increments made through the submit route.

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "submissions.json");

interface Store {
  count: number;
  updatedAt: string;
}

type Listener = (count: number) => void;

interface SharedState {
  queue: Promise<unknown>;
  listeners: Set<Listener>;
}

const globalRef = globalThis as typeof globalThis & {
  __pledgeStore?: SharedState;
};

const shared: SharedState =
  globalRef.__pledgeStore ??
  (globalRef.__pledgeStore = {
    queue: Promise.resolve(),
    listeners: new Set(),
  });

async function readStore(): Promise<Store> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<Store>;
    if (typeof parsed.count === "number" && Number.isFinite(parsed.count)) {
      return { count: parsed.count, updatedAt: parsed.updatedAt ?? "" };
    }
  } catch {
    // missing or unreadable file counts as zero
  }
  return { count: 0, updatedAt: "" };
}

async function writeStore(store: Store): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const json = JSON.stringify(store);
  const tmp = FILE + ".tmp";
  try {
    await fs.writeFile(tmp, json, "utf8");
    await fs.rename(tmp, FILE);
  } catch {
    // Windows can throw EPERM on rename-over-existing (AV scanners);
    // a direct write is acceptable given writes are already serialized.
    await fs.writeFile(FILE, json, "utf8");
  }
}

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = shared.queue.then(task, task);
  shared.queue = run.catch(() => {});
  return run;
}

function notify(count: number): void {
  for (const listener of shared.listeners) {
    try {
      listener(count);
    } catch {
      // one broken subscriber must not break the rest
    }
  }
}

/** Subscribe to count changes; returns an unsubscribe function. */
export function subscribe(listener: Listener): () => void {
  shared.listeners.add(listener);
  return () => shared.listeners.delete(listener);
}

export function readCount(): Promise<number> {
  return enqueue(async () => (await readStore()).count);
}

export function increment(): Promise<number> {
  return enqueue(async () => {
    const store = await readStore();
    const next: Store = {
      count: store.count + 1,
      updatedAt: new Date().toISOString(),
    };
    await writeStore(next);
    notify(next.count);
    return next.count;
  });
}

/** Admin reset: sets the counter back to zero. */
export function reset(): Promise<number> {
  return enqueue(async () => {
    const next: Store = { count: 0, updatedAt: new Date().toISOString() };
    await writeStore(next);
    notify(0);
    return 0;
  });
}
