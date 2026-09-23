"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { deleteRecipe } from "@/app/recipes/actions";

export function RecipeMenu({ recipeId }: { recipeId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Recipe options"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 top-11 z-20 w-44 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-lg">
            <Link
              href={`/recipes/${recipeId}/edit`}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-accent"
              onClick={() => setOpen(false)}
            >
              <Pencil className="h-4 w-4" /> Edit
            </Link>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (!confirm("Delete this recipe?")) return;
                startTransition(() => deleteRecipe({ id: recipeId }));
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
