import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { ChevronLeft } from "lucide-react";
import { db } from "@/db";
import { recipes, recipeIngredients, recipeComponents } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { RecipeForm } from "@/components/recipes/recipe-form";

export const metadata: Metadata = { title: "Edit recipe" };

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipe = await db.query.recipes.findFirst({
    where: eq(recipes.id, id),
    with: { ingredients: { orderBy: [asc(recipeIngredients.sortOrder)] } },
  });
  if (!recipe) notFound();
  const kind = recipe.kind === "component" ? "component" : "meal";

  const [links, availableComponents] = await Promise.all([
    kind === "meal"
      ? db
          .select({ componentId: recipeComponents.componentId })
          .from(recipeComponents)
          .where(eq(recipeComponents.recipeId, id))
      : Promise.resolve([] as { componentId: string }[]),
    kind === "meal"
      ? db.query.recipes.findMany({
          where: eq(recipes.kind, "component"),
          orderBy: [asc(recipes.name)],
          columns: { id: true, name: true },
        })
      : Promise.resolve([] as { id: string; name: string }[]),
  ]);

  return (
    <div className="space-y-5">
      <Link
        href={`/recipes/${recipe.id}`}
        className="-ml-1 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> {recipe.name}
      </Link>
      <PageHeader title={kind === "component" ? "Edit component" : "Edit recipe"} />
      <RecipeForm
        kind={kind}
        availableComponents={availableComponents}
        recipe={{
          id: recipe.id,
          name: recipe.name,
          description: recipe.description,
          servings: recipe.servings,
          ingredients: recipe.ingredients.map((i) => ({
            name: i.name,
            qty: i.qty,
            unit: i.unit,
          })),
          componentIds: links.map((l) => l.componentId),
        }}
      />
    </div>
  );
}
