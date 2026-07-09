import { NextResponse } from "next/server";
import {
  deleteAudio,
  isAudioSlot,
  readAudio,
  saveAudio,
} from "@/lib/audioStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Per-slot sound effect: GET serves the raw audio bytes at a stable URL
// (so files can be swapped with no code changes), PUT uploads/replaces the
// file, DELETE removes it. Slots are limited to the two managed effects.

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB is plenty for a short SFX

// GET the audio bytes for playback. 404 when nothing has been uploaded yet —
// the client treats a missing effect as silence.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slot: string }> }
) {
  const { slot } = await params;
  if (!isAudioSlot(slot)) {
    return NextResponse.json({ error: "Unknown slot" }, { status: 404 });
  }

  const found = await readAudio(slot);
  if (!found) {
    return NextResponse.json({ error: "No audio uploaded" }, { status: 404 });
  }

  return new Response(new Uint8Array(found.data), {
    status: 200,
    headers: {
      "Content-Type": found.entry.contentType || "application/octet-stream",
      "Content-Length": String(found.data.length),
      // Always fetch fresh so a replaced file is picked up immediately.
      "Cache-Control": "no-store",
    },
  });
}

// PUT uploads (or replaces) the slot's file. Expects multipart form-data with
// a single "file" field.
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slot: string }> }
) {
  const { slot } = await params;
  if (!isAudioSlot(slot)) {
    return NextResponse.json({ error: "Unknown slot" }, { status: 404 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart form-data" },
      { status: 400 }
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Missing 'file' field" },
      { status: 400 }
    );
  }
  if (!file.type.startsWith("audio/")) {
    return NextResponse.json(
      { error: "File must be an audio type" },
      { status: 415 }
    );
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "File is empty" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File exceeds the 25 MB limit" },
      { status: 413 }
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const entry = await saveAudio(slot, bytes, file.type, file.name);
  return NextResponse.json({ ok: true, entry });
}

// DELETE removes the slot's file, reverting it to silence.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slot: string }> }
) {
  const { slot } = await params;
  if (!isAudioSlot(slot)) {
    return NextResponse.json({ error: "Unknown slot" }, { status: 404 });
  }
  await deleteAudio(slot);
  return NextResponse.json({ ok: true });
}
