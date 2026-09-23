"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ShoppingBasket, ChevronLeft, Plus } from "lucide-react";
import { commitPlan } from "@/app/plan/actions";
import { mergeIngredients, formatQty } from "@/lib/ingredients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, Label } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Recipe = {
  id: string;
  name: string;
  servings: number | null;
  ingredients: { name: string; qty: number | null; unit: string | null }[];
};
type ListOpt = { id: string; name: string; emoji: string | null };

export function Planner({
  recipes,
  lists,
  preselect,
}: {
  recipes: Recipe[];
  lists: ListOpt[];
  preselect: string[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<"select" | "review">("select");
  const [selected, setSelected] = useState<Set<string>>(new Set(preselect));
  const [have, setHave] = useState<Set<string>>(new Set());
  const [target, setTarget] = useState<string>(lists[0]?.id ?? "new");
  const [newName, setNewName] = useState("Groceries");
  const [pending, startTransition] = useTransition();

  const merged = useMemo(() => {
    const ings = recipes.filter((r) => selected.has(r.id)).flatMap((r) => r.ingredients);
    return mergeIngredients(ings);
  }, [recipes, selected]);

  const toBuy = merged.filter((m) => !have.has(m.key));

  const toggleRecipe = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const toggleHave = (key: string) =>
    setHave((prev) => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });

  function commit() {
    if (!toBuy.length || pending) return;
    startTransition(async () => {
      const res = await commitPlan({
        targetListId: target === "new" ? undefined : target,
        newListName: target === "new" ? newName : undefined,
        items: toBuy.map((m) => ({ name: m.name, qty: m.qty, unit: m.unit })),
      });
      router.push(`/lists/${res.listId}`);
    });
  }

  if (recipes.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="font-display text-lg font-medium">No recipes to plan with</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a recipe or two first, then come back to build a grocery list.
        </p>
        <Link href="/recipes/new" className="mt-4 inline-block">
          <Button>
            <Plus /> Add a recipe
          </Button>
        </Link>
      </Card>
    );
  }

  // ── Step 1: choose meals ────────────────────────────────────────────────
  if (step === "select") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Which meals are you making? We&apos;ll combine everything you need.
        </p>
        <div className="space-y-2.5">
          {recipes.map((r) => {
            const on = selected.has(r.id);
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => toggleRecipe(r.id)}
                className={cn(
                  "flex w-full items-center gap-3.5 rounded-xl border bg-card p-4 text-left transition-colors active:scale-[.99]",
                  on ? "border-primary ring-1 ring-primary/40" : "border-border hover:border-primary/40",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    on ? "border-primary bg-primary text-primary-foreground" : "border-border text-transparent",
                  )}
                >
                  <Check className="h-4 w-4" strokeWidth={3} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{r.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {r.ingredients.length} ingredient{r.ingredients.length === 1 ? "" : "s"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 border-t border-border pt-4">
          <p className="flex-1 text-sm text-muted-foreground">
            {selected.size} meal{selected.size === 1 ? "" : "s"} · {merged.length} ingredient
            {merged.length === 1 ? "" : "s"}
          </p>
          <Button onClick={() => setStep("review")} disabled={selected.size === 0}>
            Review list
          </Button>
        </div>
      </div>
    );
  }

  // ── Step 2: review + "already have it?" ─────────────────────────────────
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setStep("select")}
        className="-ml-1 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Meals
      </button>

      <div className="flex items-center gap-2">
        <Badge variant="default">{toBuy.length} to buy</Badge>
        {have.size > 0 ? <Badge variant="muted">{have.size} you have</Badge> : null}
      </div>
      <p className="text-sm text-muted-foreground">
        Tap anything you already have — it&apos;ll be left off the list.
      </p>

      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {merged.map((m) => {
          const haveIt = have.has(m.key);
          const q = formatQty(m.qty, m.unit);
          return (
            <li key={m.key}>
              <button
                type="button"
                onClick={() => toggleHave(m.key)}
                className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-accent/50"
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    haveIt ? "border-olive bg-olive text-olive-foreground" : "border-border text-transparent",
                  )}
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
                <span className={cn("flex-1", haveIt && "text-muted-foreground line-through")}>
                  {m.name}
                </span>
                {q ? (
                  <span className={cn("text-sm", haveIt ? "text-muted-foreground" : "text-primary")}>
                    {q}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>

      {/* Commit */}
      <div className="border-t border-border pt-4">
        <div className="space-y-3">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label htmlFor="target">Add to</Label>
              <Select id="target" value={target} onChange={(e) => setTarget(e.target.value)}>
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {(l.emoji ?? "🛒") + " " + l.name}
                  </option>
                ))}
                <option value="new">＋ New list…</option>
              </Select>
            </div>
            {target === "new" ? (
              <div className="flex-1">
                <Label htmlFor="newname">List name</Label>
                <Input
                  id="newname"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Groceries"
                />
              </div>
            ) : null}
          </div>
          <Button onClick={commit} disabled={!toBuy.length || pending} className="w-full">
            <ShoppingBasket /> Add {toBuy.length} item{toBuy.length === 1 ? "" : "s"} to list
          </Button>
        </div>
      </div>
    </div>
  );
}
