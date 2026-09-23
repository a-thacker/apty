# apty — notes for Claude

Self-hosted PWA (Next.js 16 / React 19) for two roommates: chores, lists, meal prep.
Runs in Docker behind a Cloudflare Tunnel + Access.

## Conventions

- **Design:** warm "kitchen" system. Use tokens from `src/app/globals.css` via
  Tailwind utilities (`bg-primary`, `bg-olive`, `text-muted-foreground`, `rounded-xl`,
  `.font-display`). Never hardcode hex. Headings use the display serif (Fraunces).
  For any UI work, follow — or delegate to — the `ui-designer` subagent.
- **Data:** Drizzle + `@libsql/client`, one SQLite file. Schema in `src/db/schema.ts`.
  After editing schema run `npm run db:generate`; migrations apply on boot via
  `src/instrumentation.ts` (do not add a manual migrate step to request paths).
- **Mutations:** prefer **server actions** (colocated `actions.ts`) that
  `revalidatePath`, called from small client components with `useTransition` and
  optimistic local state. See `src/app/lists/` as the reference pattern.
- **Auth:** `getCurrentUser()` in `src/lib/auth.ts` resolves identity from the
  Cloudflare Access email header (falls back to `DEV_USER_EMAIL` locally). Server
  components/actions call it; there is no login UI.
- **PWA:** `public/manifest.webmanifest` + hand-rolled `public/sw.js` (no framework).
  Push via `web-push`/VAPID; keys from `npm run generate:vapid`.

## Commands

- `npm run dev` — local dev (migrations auto-run on boot)
- `npm run build` / `npm run typecheck` — validate
- `npm run db:generate` — regenerate SQL migrations after schema edits
- `npm run generate:vapid` — Web Push keypair
- `docker compose up -d --build` — deploy

## Roadmap / status

Built: Lists (full), Home, Settings (theme + push).
Next: Recipes CRUD → Meal planner (merge ingredients → pantry "already have?" →
grocery list) → Chores (self-scheduled + `scripts/send-reminders.mjs` wired to push).
Schema for all of the above already exists in `src/db/schema.ts`.

## Don't

- Don't hardcode colors or set headings in the sans font.
- Don't reintroduce `output: standalone` without also bundling the libsql native
  binary into the runner image (why it was removed).
- Don't commit `.env` or `data/` (SQLite file).
