import { NextResponse } from "next/server";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const sub = await req.json().catch(() => null);

  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return NextResponse.json({ error: "invalid subscription" }, { status: 400 });
  }

  await db
    .insert(pushSubscriptions)
    .values({
      userId: user.id,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    })
    .onConflictDoNothing();

  return NextResponse.json({ ok: true });
}
