"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, Check } from "lucide-react";
import { createRecipe, updateRecipe } from "@/app/recipes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Row = { name: string; qty: string; unit: string };
type Kind = "meal" | "component";

type Props = {
  kind?: Kind;
  availableComponents?: { id: string; name: string }[];
  recipe?: {
    id: string;
    name: string;
    description: string | null;
    servings: number | null;
    ingredients: { name: string; qty: number | null; unit: string | null }[];
    componentIds?: string[];
  };
};

export function RecipeForm({ kind = "meal", availableComponents = [], recipe }: Props) {
  const router = useRouter();
  const isComponent = kind === "component";
  const noun = isComponent ? "component" : "recipe";

  const [name, setName] = useState(recipe?.name ?? "");
  const [description, setDescription] = useState(recipe?.description ?? "");
  const [servings, setServings] = useState(String(recipe?.servings ?? 2));
  const [componentIds, setComponentIds] = useState<string[]>(recipe?.componentIds ?? []);
  const [rows, setRows] = useState<Row[]>(
    recipe?.ingredients.length
      ? recipe.ingredients.map((i) => ({
          name: i.name,
          qty: i.qty != null ? String(i.qty) : "",
          unit: i.unit ?? "",
        }))
      : [{ name: "", qty: "", unit: "" }],
  );
  const [pending, startTransition] = useTransition();

  const setRow = (idx: number, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const addRow = () => setRows((prev) => [...prev, { name: "", qty: "", unit: "" }]);
  const removeRow = (idx: number) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  const toggleComponent = (id: string) =>
    setComponentIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  function submit() {
    if (!name.trim() || pending) return;
    const payload = {
      name: name.trim(),
      description,
      servings: Number(servings) || undefined,
      kind,
      componentIds: isComponent ? [] : componentIds,
      ingredients: rows
        .filter((r) => r.name.trim())
        .map((r) => ({
          name: r.name,
          qty: r.qty.trim() && !Number.isNaN(Number(r.qty)) ? Number(r.qty) : null,
          unit: r.unit,
        })),
    };
    startTransition(async () => {
      if (recipe) {
        await updateRecipe({ id: recipe.id, ...payload });
        router.push(`/recipes/${recipe.id}`);
      } else {
        const created = await createRecipe(payload);
        if (created) router.push(`/recipes/${created.id}`);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="recipe-name">{isComponent ? "Component name" : "Recipe name"}</Label>
        <Input
          id="recipe-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={isComponent ? "e.g. Cilantro rice" : "e.g. Chicken & rice bowls"}
          autoFocus
        />
      </div>

      <div className="w-32">
        <Label htmlFor="servings">Servings</Label>
        <Input
          id="servings"
          type="number"
          inputMode="numeric"
          min={1}
          value={servings}
          onChange={(e) => setServings(e.target.value)}
        />
      </div>

      <div>
        <Label>Ingredients</Label>
        <div className="space-y-2">
          {rows.map((row, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input
                value={row.qty}
                onChange={(e) => setRow(idx, { qty: e.target.value })}
                placeholder="2"
                inputMode="decimal"
                aria-label="Quantity"
                className="w-16 px-2 text-center"
              />
              <Input
                value={row.unit}
                onChange={(e) => setRow(idx, { unit: e.target.value })}
                placeholder="lbs"
                aria-label="Unit"
                className="w-20 px-2"
              />
              <Input
                value={row.name}
                onChange={(e) => setRow(idx, { name: e.target.value })}
                placeholder="Chicken thighs"
                aria-label="Ingredient name"
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => removeRow(idx)}
                aria-label="Remove ingredient"
                className="shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={addRow} className="mt-2">
          <Plus /> Add ingredient
        </Button>
      </div>

      {/* Shared components — meals only */}
      {!isComponent ? (
        <div>
          <Label>Shared components</Label>
          <p className="mb-2 text-xs text-muted-foreground">
            Reusable parts (like cilantro rice) whose ingredients fold in when you plan.
          </p>
          {availableComponents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              None yet —{" "}
              <Link href="/recipes/new?kind=component" className="font-medium text-olive hover:underline">
                create a component
              </Link>{" "}
              first.
            </p>
          ) : (
            <div className="space-y-2">
              {availableComponents.map((c) => {
                const on = componentIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleComponent(c.id)}
                    aria-pressed={on}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors active:scale-[.99]",
                      on ? "border-olive bg-olive/5 ring-1 ring-olive/40" : "border-border hover:border-olive/40",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        on ? "border-olive bg-olive text-olive-foreground" : "border-border text-transparent",
                      )}
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                    <span className="flex-1">{c.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      <div>
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Steps, tips, links…"
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={submit} disabled={!name.trim() || pending} className="flex-1">
          <Save /> {recipe ? "Save changes" : `Save ${noun}`}
        </Button>
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
