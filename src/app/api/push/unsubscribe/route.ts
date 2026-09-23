import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";

export async function POST(req: Request) {
  const { endpoint } = (await req.json().catch(() => ({}))) as { endpoint?: string };
  if (endpoint) {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  }
  return NextResponse.json({ ok: true });
}
