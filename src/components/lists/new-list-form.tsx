"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createList } from "@/app/lists/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const EMOJIS = ["🛒", "🥦", "🍝", "🧻", "🍺", "🏠", "📝", "🧊"];

export function NewListForm() {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🛒");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    const trimmed = name.trim();
    if (!trimmed || pending) return;
    startTransition(async () => {
      const list = await createList({ name: trimmed, emoji });
      setName("");
      setEmoji("🛒");
      setOpen(false);
      if (list) router.push(`/lists/${list.id}`);
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Pick an emoji"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted text-xl transition-colors hover:bg-accent"
        >
          {emoji}
        </button>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="New list — e.g. C&A Groceries"
          className="border-0 bg-transparent shadow-none focus-visible:ring-0"
          aria-label="List name"
        />
        <Button
          size="icon"
          onClick={submit}
          disabled={!name.trim() || pending}
          aria-label="Create list"
        >
          <Plus />
        </Button>
      </div>

      {open ? (
        <div className="mt-2 flex flex-wrap gap-1.5 border-t border-border pt-2.5">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => {
                setEmoji(e);
                setOpen(false);
              }}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg text-lg transition-colors hover:bg-accent",
                emoji === e && "bg-primary/12 ring-1 ring-primary/40",
              )}
            >
              {e}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
