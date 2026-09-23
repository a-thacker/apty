#!/usr/bin/env node
/**
 * Chore reminder + nag worker. Run on a schedule (host cron), e.g. every 15 min:
 *
 *   *\/15 * * * * cd /path/to/apty && docker compose exec -T app npm run reminders
 *
 * For every active, assigned chore it drives off `next_due_at` (kept current by
 * the app when a chore is created, edited, or marked done):
 *   - sends a "chore time" push once the chore comes due,
 *   - keeps nagging every REMINDER_NAG_HOURS while it stays overdue and undone,
 *   - goes quiet once it's completed (markChoreDone clears last_reminded_at and
 *     advances next_due_at), and during REMINDER_QUIET_START..QUIET_END hours.
 *
 * Cadence-agnostic: daily / weekly / biweekly / monthly all work because the due
 * moment lives in next_due_at rather than being re-derived from the day of week.
 */
import { createClient } from "@libsql/client";
import webpush from "web-push";

const NAG_HOURS = Number(process.env.REMINDER_NAG_HOURS ?? 6);
const QUIET_START = Number(process.env.REMINDER_QUIET_START ?? 22); // 10pm
const QUIET_END = Number(process.env.REMINDER_QUIET_END ?? 8); //  8am
const url = process.env.DATABASE_URL ?? "file:./data/apty.db";
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT ?? "mailto:apty@localhost";

if (!publicKey || !privateKey) {
  console.error("VAPID keys missing — run `npm run generate:vapid`.");
  process.exit(1);
}
webpush.setVapidDetails(subject, publicKey, privateKey);

// Respect quiet hours — no overnight pushes. Handles windows that wrap midnight.
const hour = new Date().getHours();
const inQuiet =
  QUIET_START <= QUIET_END
    ? hour >= QUIET_START && hour < QUIET_END
    : hour >= QUIET_START || hour < QUIET_END;
if (inQuiet) {
  console.log(`reminders: quiet hours (${QUIET_START}:00–${QUIET_END}:00), skipping.`);
  process.exit(0);
}

const DAY = 86_400;
const nowSec = Math.floor(Date.now() / 1000);
const nagSec = NAG_HOURS * 3600;
// Cycle length used to tell whether a chore is already done for this period.
const cycleDays = { daily: 1, weekly: 7, biweekly: 14, monthly: 28 };

const db = createClient({ url });

const { rows: chores } = await db.execute({
  sql: `SELECT id, name, cadence, assignee_id, next_due_at, last_done_at, last_reminded_at
        FROM chores
        WHERE archived = 0 AND assignee_id IS NOT NULL AND next_due_at IS NOT NULL`,
  args: [],
});

let sent = 0;
let due = 0;
for (const chore of chores) {
  const nextDue = Number(chore.next_due_at);
  if (nowSec < nextDue) continue; // not due yet

  // Already completed for the current cycle?
  const windowDays = cycleDays[chore.cadence] ?? 7;
  if (chore.last_done_at && nowSec - Number(chore.last_done_at) < windowDays * DAY) continue;

  due += 1;

  // Throttle: at most one push per NAG_HOURS per chore.
  const last = chore.last_reminded_at ? Number(chore.last_reminded_at) : 0;
  if (last && nowSec - last < nagSec) continue;

  const overdueDays = Math.floor((nowSec - nextDue) / DAY);
  const title = last ? "Still not done 🧹" : "Chore time 🧹";
  const body = !last
    ? chore.name
    : overdueDays >= 1
      ? `${chore.name} — ${overdueDays} day${overdueDays === 1 ? "" : "s"} overdue`
      : `${chore.name} — overdue`;

  const { rows: subs } = await db.execute({
    sql: `SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?`,
    args: [chore.assignee_id],
  });

  let delivered = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title, body, url: "/chores", tag: `chore-${chore.id}` }),
      );
      sent += 1;
      delivered += 1;
    } catch (err) {
      const status = err?.statusCode;
      if (status === 404 || status === 410) {
        await db.execute({ sql: `DELETE FROM push_subscriptions WHERE id = ?`, args: [sub.id] });
      } else {
        console.error("push failed:", err?.message ?? err);
      }
    }
  }

  // Only start the nag clock once we've actually reached a device, so a chore
  // whose owner hasn't enrolled yet still gets pinged the moment they do.
  if (delivered > 0) {
    await db.execute({
      sql: `UPDATE chores SET last_reminded_at = ? WHERE id = ?`,
      args: [nowSec, chore.id],
    });
  }
}

console.log(`reminders: ${sent} push(es) sent across ${due} due chore(s).`);
