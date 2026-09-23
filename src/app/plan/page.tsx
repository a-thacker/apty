import Link from "next/link";
import type { Metadata } from "next";
import { and, asc, desc, eq } from "drizzle-orm";
import { ChevronLeft } from "lucide-react";
import { db } from "@/db";
import { recipes, recipeIngredients, lists } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { Planner } from "@/components/plan/planner";

export const metadata: Metadata = { title: "Plan a meal" };

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ add?: string }>;
}) {
  const { add } = await searchParams;

  const [recipeRows, listRows] = await Promise.all([
    db.query.recipes.findMany({
      with: { ingredients: { orderBy: [asc(recipeIngredients.sortOrder)] } },
      orderBy: [desc(recipes.createdAt)],
    }),
    db.query.lists.findMany({
      where: and(eq(lists.archived, false), eq(lists.kind, "grocery")),
      orderBy: [desc(lists.createdAt)],
      columns: { id: true, name: true, emoji: true },
    }),
  ]);

  return (
    <div className="space-y-5">
      <Link
        href="/recipes"
        className="-ml-1 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Cook
      </Link>
      <PageHeader title="Plan a meal" />
      <Planner
        recipes={recipeRows.map((r) => ({
          id: r.id,
          name: r.name,
          servings: r.servings,
          ingredients: r.ingredients.map((i) => ({ name: i.name, qty: i.qty, unit: i.unit })),
        }))}
        lists={listRows}
        preselect={add ? [add] : []}
      />
    </div>
  );
}
