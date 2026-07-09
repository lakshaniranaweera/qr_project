import { readCount, subscribe } from "@/lib/store";

export const dynamic = "force-dynamic";

// Server-Sent Events stream: pushes the count to every connected client the
// moment it changes (submission or admin reset). Clients auto-reconnect.
export async function GET() {
  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const cleanup = () => {
    unsubscribe?.();
    unsubscribe = undefined;
    if (heartbeat) clearInterval(heartbeat);
    heartbeat = undefined;
  };

  const stream = new ReadableStream({
    async start(controller) {
      const send = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          cleanup(); // client went away mid-write
        }
      };
      send(`data: ${await readCount()}\n\n`);
      unsubscribe = subscribe((count) => send(`data: ${count}\n\n`));
      // comment-only heartbeat keeps proxies/browsers from closing the socket
      heartbeat = setInterval(() => send(": ping\n\n"), 15000);
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store",
      Connection: "keep-alive",
    },
  });
}
