import { NextResponse } from "next/server";
import { AUDIO_SLOTS, listEntries } from "@/lib/audioStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Manifest of the managed sound-effect slots — used by the admin manager UI
// to show what is currently uploaded. Each slot carries its metadata (or null)
// plus the stable playback URL the LED show points its <audio> element at.
export async function GET() {
  const entries = await listEntries();
  const slots = AUDIO_SLOTS.map((slot) => ({
    slot,
    url: `/api/audio/${slot}`,
    entry: entries[slot],
  }));
  return NextResponse.json({ slots }, { headers: { "Cache-Control": "no-store" } });
}
