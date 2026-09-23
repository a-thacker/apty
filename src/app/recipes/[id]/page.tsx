import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { ChevronLeft, Sparkles } from "lucide-react";
import { db } from "@/db";
import { recipes, recipeIngredients } from "@/db/schema";
import { RecipeMenu } from "@/components/recipes/recipe-menu";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatQty } from "@/lib/ingredients";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const r = await db.query.recipes.findFirst({ where: eq(recipes.id, id), columns: { name: true } });
  return { title: r?.name ?? "Recipe" };
}

export default async function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipe = await db.query.recipes.findFirst({
    where: eq(recipes.id, id),
    with: { ingredients: { orderBy: [asc(recipeIngredients.sortOrder)] } },
  });
  if (!recipe) notFound();

  return (
    <div className="space-y-5">
      <Link
        href="/recipes"
        className="-ml-1 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Cook
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold leading-tight tracking-tight">
            {recipe.name}
          </h1>
          {recipe.servings ? (
            <Badge variant="muted" className="mt-1.5">
              serves {recipe.servings}
            </Badge>
          ) : null}
        </div>
        <RecipeMenu recipeId={recipe.id} />
      </div>

      <Card>
        <div className="border-b border-border px-5 py-3">
          <p className="font-display font-semibold">Ingredients</p>
        </div>
        {recipe.ingredients.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">No ingredients listed.</p>
        ) : (
          <ul className="divide-y divide-border">
            {recipe.ingredients.map((ing) => {
              const q = formatQty(ing.qty, ing.unit);
              return (
                <li key={ing.id} className="flex items-baseline gap-3 px-5 py-3">
                  {q ? (
                    <span className="min-w-16 shrink-0 text-sm font-medium text-primary">{q}</span>
                  ) : (
                    <span className="min-w-16 shrink-0" />
                  )}
                  <span>{ing.name}</span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {recipe.description ? (
        <Card className="p-5">
          <p className="mb-1 font-display font-semibold">Notes</p>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{recipe.description}</p>
        </Card>
      ) : null}

      <Link href={`/plan?add=${recipe.id}`} className="block">
        <Button variant="olive" className="w-full">
          <Sparkles /> Plan a meal with this
        </Button>
      </Link>
    </div>
  );
}
