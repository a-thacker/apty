"use client";

import { useRef, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { addItem } from "@/app/lists/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function QuickAdd({ listId }: { listId: string }) {
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    // Optimistic clear + keep focus so you can rattle off items fast.
    setName("");
    inputRef.current?.focus();
    startTransition(async () => {
      await addItem({ listId, name: trimmed });
    });
  }

  return (
    <div className="sticky top-[3.75rem] z-10 flex items-center gap-2 rounded-xl border border-border bg-card/95 p-2 shadow-sm backdrop-blur">
      <Input
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Add an item…"
        className="border-0 bg-transparent shadow-none focus-visible:ring-0"
        aria-label="Add item"
        enterKeyHint="done"
        autoComplete="off"
      />
      <Button size="icon" onClick={submit} disabled={!name.trim() || pending} aria-label="Add item">
        <Plus />
      </Button>
    </div>
  );
}
