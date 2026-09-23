"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Check, Clock, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { markChoreDone, deleteChore } from "@/app/chores/actions";
import { describeSchedule } from "@/lib/schedule";
import { cn } from "@/lib/utils";

type Props = {
  chore: {
    id: string;
    name: string;
    cadence: string;
    scheduledDow: number | null;
    scheduledTime: string | null;
  };
  assignee: { name: string | null; color: string } | null;
  doneThisCycle: boolean;
  showAssignee?: boolean;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ChoreCard({ chore, assignee, doneThisCycle, showAssignee }: Props) {
  const [done, setDone] = useState(doneThisCycle);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggleDone() {
    if (done) return;
    setDone(true); // optimistic
    startTransition(() => markChoreDone({ id: chore.id }));
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors",
        done ? "border-border/60" : "border-border",
      )}
    >
      <button
        type="button"
        onClick={toggleDone}
        disabled={done || pending}
        aria-label={done ? "Done this cycle" : "Mark done"}
        aria-pressed={done}
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          done
            ? "border-olive bg-olive text-olive-foreground"
            : "border-border text-transparent hover:border-olive",
        )}
      >
        <Check className="h-5 w-5" strokeWidth={3} />
      </button>

      <div className="min-w-0 flex-1">
        <p className={cn("truncate font-medium", done && "text-muted-foreground line-through")}>
          {chore.name}
        </p>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {describeSchedule(chore.cadence, chore.scheduledDow, chore.scheduledTime)}
          </span>
        </div>
      </div>

      {showAssignee && assignee ? (
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[0.6rem] font-semibold text-white"
          style={{ backgroundColor: assignee.color }}
          title={assignee.name ?? ""}
        >
          {initials(assignee.name ?? "?")}
        </span>
      ) : null}

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Chore options"
          aria-expanded={open}
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <MoreVertical className="h-5 w-5" />
        </button>
        {open ? (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
            <div className="absolute right-0 top-10 z-20 w-40 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-lg">
              <Link
                href={`/chores/${chore.id}/edit`}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-accent"
                onClick={() => setOpen(false)}
              >
                <Pencil className="h-4 w-4" /> Edit
              </Link>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (!confirm("Delete this chore?")) return;
                  startTransition(() => deleteChore({ id: chore.id }));
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
