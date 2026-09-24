import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { ChevronLeft, Sparkles, Blocks } from "lucide-react";
import { db } from "@/db";
import { recipes, recipeIngredients, recipeComponents } from "@/db/schema";
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
  const isComponent = recipe.kind === "component";

  const included = isComponent
    ? []
    : await db
        .select({ id: recipes.id, name: recipes.name })
        .from(recipeComponents)
        .innerJoin(recipes, eq(recipeComponents.componentId, recipes.id))
        .where(eq(recipeComponents.recipeId, id));

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
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {isComponent ? (
              <Badge variant="olive">
                <Blocks className="mr-1 h-3 w-3" /> Component
              </Badge>
            ) : null}
            {recipe.servings ? <Badge variant="muted">serves {recipe.servings}</Badge> : null}
          </div>
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

      {included.length > 0 ? (
        <Card>
          <div className="border-b border-border px-5 py-3">
            <p className="font-display font-semibold">Includes</p>
          </div>
          <ul className="divide-y divide-border">
            {included.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/recipes/${c.id}`}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-accent/50"
                >
                  <Blocks className="h-4 w-4 shrink-0 text-olive" />
                  <span className="flex-1">{c.name}</span>
                  <ChevronLeft className="h-4 w-4 shrink-0 rotate-180 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {recipe.description ? (
        <Card className="p-5">
          <p className="mb-1 font-display font-semibold">Notes</p>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{recipe.description}</p>
        </Card>
      ) : null}

      {isComponent ? (
        <Link href={`/recipes/${recipe.id}/edit`} className="block">
          <Button variant="outline" className="w-full">
            Edit component
          </Button>
        </Link>
      ) : (
        <Link href={`/plan?add=${recipe.id}`} className="block">
          <Button variant="olive" className="w-full">
            <Sparkles /> Plan a meal with this
          </Button>
        </Link>
      )}
    </div>
  );
}
