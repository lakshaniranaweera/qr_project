import { NextResponse } from "next/server";
import { readCount, increment, reset } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const count = await readCount();
  return NextResponse.json(
    { count },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST() {
  const count = await increment();
  return NextResponse.json({ count });
}

// Admin reset — sets the counter back to zero.
export async function DELETE() {
  const count = await reset();
  return NextResponse.json({ count });
}
