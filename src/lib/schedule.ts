export const DOW = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
export const DOW_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const CADENCES = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every other week" },
  { value: "daily", label: "Daily" },
  { value: "monthly", label: "Monthly" },
] as const;

export function formatTime(hhmm?: string | null): string | null {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h)) return null;
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m ?? 0).padStart(2, "0")} ${ampm}`;
}

/** Human-readable schedule, e.g. "Sundays · 6:00 PM". */
export function describeSchedule(
  cadence: string,
  dow?: number | null,
  time?: string | null,
): string {
  const t = formatTime(time);
  if (cadence === "daily") return t ? `Daily · ${t}` : "Daily";
  if (dow == null || dow < 0) return "Not scheduled";
  const day = DOW[dow];
  const base =
    cadence === "weekly"
      ? `${day}s`
      : cadence === "biweekly"
        ? `Every other ${day}`
        : cadence === "monthly"
          ? `Monthly on ${day}`
          : `${day}s`;
  return t ? `${base} · ${t}` : base;
}

/** Next due timestamp (unix seconds) for display. Biweekly is approximated as weekly. */
export function computeNextDue(
  cadence: string,
  dow: number | null | undefined,
  time: string | null | undefined,
  from = new Date(),
): number | null {
  if (dow == null && cadence !== "daily") return null;
  const [hh, mm] = (time ?? "09:00").split(":").map(Number);
  const next = new Date(from);
  next.setHours(hh || 0, mm || 0, 0, 0);

  if (cadence === "daily") {
    if (next <= from) next.setDate(next.getDate() + 1);
    return Math.floor(next.getTime() / 1000);
  }

  const cur = next.getDay();
  let delta = ((dow as number) - cur + 7) % 7;
  if (delta === 0 && next <= from) delta = 7;
  next.setDate(next.getDate() + delta);
  return Math.floor(next.getTime() / 1000);
}

/** True if a completion timestamp falls in the current cadence window. */
export function isDoneThisCycle(
  cadence: string,
  lastDoneAt?: Date | null,
  now = new Date(),
): boolean {
  if (!lastDoneAt) return false;
  const days = (now.getTime() - lastDoneAt.getTime()) / 86_400_000;
  if (cadence === "daily") return days < 1;
  if (cadence === "weekly") return days < 7;
  if (cadence === "biweekly") return days < 14;
  if (cadence === "monthly") return days < 28;
  return days < 7;
}
