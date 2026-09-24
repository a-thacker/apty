import Link from "next/link";
import type { Metadata } from "next";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { ChevronLeft } from "lucide-react";
import { db } from "@/db";
import { recipes, recipeIngredients, recipeComponents, lists } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { Planner } from "@/components/plan/planner";

export const metadata: Metadata = { title: "Plan a meal" };

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ add?: string }>;
}) {
  const { add } = await searchParams;

  // Meals (not components) with their own ingredients, plus grocery lists.
  const [mealRows, listRows] = await Promise.all([
    db.query.recipes.findMany({
      where: eq(recipes.kind, "meal"),
      with: { ingredients: { orderBy: [asc(recipeIngredients.sortOrder)] } },
      orderBy: [desc(recipes.createdAt)],
    }),
    db.query.lists.findMany({
      where: and(eq(lists.archived, false), eq(lists.kind, "grocery")),
      orderBy: [desc(lists.createdAt)],
      columns: { id: true, name: true, emoji: true },
    }),
  ]);

  // Fold each meal's shared components into its ingredient list so a component
  // shared by two meals is listed once after the merge.
  const mealIds = mealRows.map((m) => m.id);
  const links = mealIds.length
    ? await db
        .select({ recipeId: recipeComponents.recipeId, componentId: recipeComponents.componentId })
        .from(recipeComponents)
        .where(inArray(recipeComponents.recipeId, mealIds))
    : [];
  const componentIds = [...new Set(links.map((l) => l.componentId))];
  const componentRows = componentIds.length
    ? await db.query.recipes.findMany({
        where: inArray(recipes.id, componentIds),
        with: { ingredients: { orderBy: [asc(recipeIngredients.sortOrder)] } },
        columns: { id: true, name: true },
      })
    : [];
  const compById = new Map(componentRows.map((c) => [c.id, c]));

  const plannerRecipes = mealRows.map((m) => {
    const comps = links
      .filter((l) => l.recipeId === m.id)
      .map((l) => compById.get(l.componentId))
      .filter((c): c is NonNullable<typeof c> => Boolean(c));
    const own = m.ingredients.map((i) => ({ name: i.name, qty: i.qty, unit: i.unit }));
    const fromComponents = comps.flatMap((c) =>
      c.ingredients.map((i) => ({ name: i.name, qty: i.qty, unit: i.unit })),
    );
    return {
      id: m.id,
      name: m.name,
      servings: m.servings,
      ingredients: [...own, ...fromComponents],
      components: comps.map((c) => c.name),
    };
  });

  return (
    <div className="space-y-5">
      <Link
        href="/recipes"
        className="-ml-1 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Cook
      </Link>
      <PageHeader title="Plan a meal" />
      <Planner recipes={plannerRecipes} lists={listRows} preselect={add ? [add] : []} />
    </div>
  );
}
