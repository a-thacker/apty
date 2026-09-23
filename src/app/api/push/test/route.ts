import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { sendToSubscription, pushConfigured } from "@/lib/push";

/** Sends a test notification to all of the current user's devices. */
export async function POST() {
  if (!pushConfigured) {
    return NextResponse.json({ error: "push not configured" }, { status: 503 });
  }
  const user = await getCurrentUser();
  const subs = await db.query.pushSubscriptions.findMany({
    where: eq(pushSubscriptions.userId, user.id),
  });

  let sent = 0;
  for (const sub of subs) {
    const ok = await sendToSubscription(sub, {
      title: "apty",
      body: "Reminders are working 🎉",
      url: "/chores",
      tag: "apty-test",
    });
    if (ok) sent += 1;
    else await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
  }

  return NextResponse.json({ ok: true, sent });
}
