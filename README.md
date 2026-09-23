# apty 🏠

A self-hosted PWA for the apartment — **chores, lists, and meal prep** for you and
your cooking partner. Runs in Docker on your own server, reachable on and off campus
through a Cloudflare Tunnel (no open ports).

## Stack

- **Next.js 16** (App Router, React 19) — one full-stack app, one container
- **SQLite** via **Drizzle** + `@libsql/client` — a single file, trivial backups
- **Tailwind v4** + hand-built UI primitives — the warm "kitchen" design system
- **Web Push** (VAPID) for chore reminders
- **Cloudflare Access** for auth (identity comes from the authenticated email)

## What's built

- **Lists** — create named lists (e.g. `C&A Groceries`), quick-add items, check them
  off, per-item **Walmart search deep links**, clear/delete. ✅
- **Home** — greeting + quick actions + your due chores + your lists at a glance ✅
- **Cook (Recipes)** — create / edit / delete recipes with quantity + unit
  ingredient rows and a detail view. ✅
- **Meal planner** — pick the meals you're cooking → ingredients merge (same
  name + unit are summed) → tap anything you already have → push the rest to a
  grocery list (existing or new). ✅
- **Chores** — one per roommate, self-scheduled (pick your own day + time), and
  either **fixed** (always the same person) or **rotating** (hands off to the next
  roommate each time it's done). Reminders push when a chore is due and keep
  **nagging while it's overdue** (throttled, with overnight quiet hours); marking
  it done advances the cycle. ✅
- **Settings** — light/dark, push-notification enrollment ✅

## Local development

```bash
cp .env.example .env.local        # fill in DEV_USER_EMAIL (any email)
npm install
npm run dev                       # http://localhost:3000
```

Migrations run automatically on server boot (`src/instrumentation.ts`). To add a
schema change: edit `src/db/schema.ts`, then `npm run db:generate`.

### Push notifications (optional, for chore reminders)

```bash
npm run generate:vapid            # prints a keypair
# paste NEXT_PUBLIC_VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY into your env
```

Then enable them from **Settings**. On iPhone you must **Add to Home Screen** first
(iOS only allows web push for installed PWAs).

## Deploy to your Ubuntu server

### 1. First-time setup on the server

```bash
git clone <your-repo> apty && cd apty
cp .env.example .env              # fill in the values below
```

Fill `.env`:
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` — from `npm run generate:vapid`
- `VAPID_SUBJECT` — `mailto:you@example.com`
- `CLOUDFLARE_TUNNEL_TOKEN` — from step 2

### 2. Create the Cloudflare Tunnel (one-time, ~5 min)

1. In the **Cloudflare Zero Trust** dashboard → **Networks → Tunnels → Create a
   tunnel** (choose *Cloudflared*). Copy the **tunnel token** into `.env`.
2. Add a **Public Hostname**: your domain (e.g. `apty.yourdomain.com`) → Service
   `HTTP` → `app:3000`. (The `cloudflared` container reaches the app over the compose
   network.)
3. Lock it down: **Access → Applications → Add** → self-hosted → your hostname →
   policy that **allows only your two emails**. Now only you two can reach it, from
   anywhere, over HTTPS.

### 3. Run it

```bash
docker compose up -d --build
```

Updates later:

```bash
git pull && docker compose up -d --build
```

The database lives in the `apty-data` Docker volume. Back it up with:

```bash
docker compose cp app:/app/data/apty.db ./apty-backup-$(date +%F).db
```

### 4. Chore reminders (cron on the host)

Run the reminder worker every ~15 minutes. It pushes each chore when it comes due
and re-nags overdue, unfinished ones every `REMINDER_NAG_HOURS` (default 6),
staying silent between `REMINDER_QUIET_START` and `REMINDER_QUIET_END`
(default 22:00–08:00 local):

```cron
*/15 * * * * cd /path/to/apty && docker compose exec -T app npm run reminders
```

## Notes on access

- **HTTPS is required** for the PWA (service worker, install, push). Cloudflare
  provides it — plain `http://` on the LAN will not fully work.
- The tunnel is **outbound-only**, so it works around the school network's NAT and
  needs no port forwarding. You can remove the `ports:` mapping in
  `docker-compose.yml` once the tunnel is up, if you don't want LAN exposure.
- Auth is enforced at the edge by Cloudflare Access; the app trusts the
  `Cf-Access-Authenticated-User-Email` header. To harden further, verify the Access
  JWT (see `src/lib/auth.ts`).

## Project layout

```
src/
  app/            routes (App Router) + server actions + API routes
  components/     ui/ primitives, feature components, app shell
  db/             drizzle schema, client, migrate-on-boot
  lib/            auth (Cloudflare Access), push, utils
drizzle/          generated SQL migrations
scripts/          generate-vapid, send-reminders
.claude/agents/   ui-designer subagent (design system enforcement)
```
