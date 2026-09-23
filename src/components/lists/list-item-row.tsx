"use client";

import { useState, useTransition } from "react";
import { Check, Trash2 } from "lucide-react";
import { toggleItem, deleteItem } from "@/app/lists/actions";
import { walmartSearchUrl, cn } from "@/lib/utils";
import type { ListItem } from "@/db/schema";

export function ListItemRow({ item }: { item: ListItem }) {
  const [checked, setChecked] = useState(item.checked);
  const [, startTransition] = useTransition();

  function toggle() {
    const next = !checked;
    setChecked(next); // optimistic
    startTransition(async () => {
      await toggleItem({ id: item.id, checked: next, listId: item.listId });
    });
  }

  function remove() {
    startTransition(async () => {
      await deleteItem({ id: item.id, listId: item.listId });
    });
  }

  return (
    <li className="group flex items-center gap-3 px-3 py-2.5">
      <button
        type="button"
        onClick={toggle}
        aria-label={checked ? "Mark as needed" : "Mark as in cart"}
        aria-pressed={checked}
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          checked
            ? "border-olive bg-olive text-olive-foreground"
            : "border-border text-transparent hover:border-primary",
        )}
      >
        <Check className="h-4 w-4" strokeWidth={3} />
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate leading-tight",
            checked && "text-muted-foreground line-through",
          )}
        >
          {item.name}
        </p>
        {item.qty ? (
          <p className="truncate text-xs text-muted-foreground">{item.qty}</p>
        ) : null}
      </div>

      {!checked ? (
        <a
          href={walmartSearchUrl(item.name)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Search ${item.name} on Walmart`}
          className="shrink-0 rounded-md px-2 py-1 text-[0.7rem] font-semibold text-[#0071dc] transition-colors hover:bg-[#0071dc]/10"
        >
          Walmart
        </a>
      ) : null}

      <button
        type="button"
        onClick={remove}
        aria-label={`Delete ${item.name}`}
        className="shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}
