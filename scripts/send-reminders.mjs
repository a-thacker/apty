#!/usr/bin/env node
/**
 * Chore reminder worker. Run on a schedule (cron) — the cadence should match
 * REMINDER_WINDOW_MIN so each due chore is reminded exactly once.
 *
 *   node --env-file=.env scripts/send-reminders.mjs
 *
 * In Docker, run it against the app container, e.g. via host cron:
 *   *\/15 * * * * docker compose exec -T app npm run reminders
 *
 * Semantics: a chore is "due" when today matches its scheduled_dow and the
 * current time falls within the last REMINDER_WINDOW_MIN of its scheduled_time,
 * and it hasn't been completed yet today.
 */
import { createClient } from "@libsql/client";
import webpush from "web-push";

const WINDOW_MIN = Number(process.env.REMINDER_WINDOW_MIN ?? 15);
const url = process.env.DATABASE_URL ?? "file:./data/apty.db";
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT ?? "mailto:apty@localhost";

if (!publicKey || !privateKey) {
  console.error("VAPID keys missing — run `npm run generate:vapid`.");
  process.exit(1);
}
webpush.setVapidDetails(subject, publicKey, privateKey);

const db = createClient({ url });
const now = new Date();
const dow = now.getDay(); // 0=Sun … 6=Sat
const minutesNow = now.getHours() * 60 + now.getMinutes();
const startOfDay = Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000);

function toMinutes(hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

const { rows: chores } = await db.execute({
  sql: `SELECT id, name, assignee_id, scheduled_time, last_done_at
        FROM chores
        WHERE archived = 0 AND assignee_id IS NOT NULL AND scheduled_dow = ?`,
  args: [dow],
});

let sent = 0;
for (const chore of chores) {
  const due = toMinutes(chore.scheduled_time);
  if (due === null) continue;
  // Fire only within the window ending at the scheduled time.
  if (!(minutesNow >= due && minutesNow < due + WINDOW_MIN)) continue;
  // Skip if already done today.
  if (chore.last_done_at && Number(chore.last_done_at) >= startOfDay) continue;

  const { rows: subs } = await db.execute({
    sql: `SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?`,
    args: [chore.assignee_id],
  });

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title: "Chore time 🧹", body: chore.name, url: "/chores", tag: `chore-${chore.id}` }),
      );
      sent += 1;
    } catch (err) {
      const status = err?.statusCode;
      if (status === 404 || status === 410) {
        await db.execute({ sql: `DELETE FROM push_subscriptions WHERE id = ?`, args: [sub.id] });
      } else {
        console.error("push failed:", err?.message ?? err);
      }
    }
  }
}

console.log(`reminders: ${sent} notification(s) sent for ${chores.length} scheduled chore(s).`);
