"use client";

import { useState, useTransition } from "react";
import { MoreVertical, Eraser, Trash2 } from "lucide-react";
import { clearChecked, deleteList } from "@/app/lists/actions";
import { cn } from "@/lib/utils";

export function ListMenu({ listId, hasChecked }: { listId: string; hasChecked: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="List options"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 top-11 z-20 w-48 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-lg">
            <button
              type="button"
              disabled={!hasChecked || pending}
              onClick={() => {
                setOpen(false);
                startTransition(() => clearChecked({ listId }));
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-accent disabled:opacity-40",
              )}
            >
              <Eraser className="h-4 w-4" /> Clear in-cart items
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (!confirm("Delete this whole list?")) return;
                startTransition(() => deleteList({ id: listId }));
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" /> Delete list
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
