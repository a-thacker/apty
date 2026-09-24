"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { recipes, recipeIngredients, recipeComponents } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export type IngredientInput = { name: string; qty?: number | null; unit?: string | null };

type RecipeInput = {
  name: string;
  description?: string;
  servings?: number;
  kind?: "meal" | "component";
  ingredients: IngredientInput[];
  componentIds?: string[]; // reusable components this meal includes (meals only)
};

async function writeIngredients(recipeId: string, ingredients: IngredientInput[]) {
  const rows = ingredients
    .filter((i) => i.name.trim())
    .map((i, idx) => ({
      recipeId,
      name: i.name.trim(),
      qty: i.qty ?? null,
      unit: i.unit?.trim() || null,
      sortOrder: idx,
    }));
  if (rows.length) await db.insert(recipeIngredients).values(rows);
}

async function writeComponents(recipeId: string, componentIds: string[] | undefined) {
  const rows = (componentIds ?? [])
    .filter((cid) => cid && cid !== recipeId) // never link a meal to itself
    .map((componentId) => ({ recipeId, componentId }));
  if (rows.length) await db.insert(recipeComponents).values(rows);
}

export async function createRecipe(input: RecipeInput) {
  const user = await getCurrentUser();
  const name = input.name.trim();
  if (!name) return null;
  const kind = input.kind === "component" ? "component" : "meal";
  const [recipe] = await db
    .insert(recipes)
    .values({
      name,
      description: input.description?.trim() || null,
      servings: input.servings ?? 2,
      kind,
      createdBy: user.id,
    })
    .returning();
  await writeIngredients(recipe.id, input.ingredients);
  if (kind === "meal") await writeComponents(recipe.id, input.componentIds);
  revalidatePath("/recipes");
  revalidatePath("/plan");
  return recipe;
}

export async function updateRecipe(input: RecipeInput & { id: string }) {
  const name = input.name.trim();
  if (!name) return;
  const kind = input.kind === "component" ? "component" : "meal";
  await db
    .update(recipes)
    .set({
      name,
      description: input.description?.trim() || null,
      servings: input.servings ?? 2,
      kind,
    })
    .where(eq(recipes.id, input.id));
  // Simplest correct approach: replace the ingredient + component sets.
  await db.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, input.id));
  await writeIngredients(input.id, input.ingredients);
  await db.delete(recipeComponents).where(eq(recipeComponents.recipeId, input.id));
  if (kind === "meal") await writeComponents(input.id, input.componentIds);
  revalidatePath("/recipes");
  revalidatePath(`/recipes/${input.id}`);
  revalidatePath("/plan");
}

export async function deleteRecipe(input: { id: string }) {
  // FK cascade also clears any recipe_components rows on either side.
  await db.delete(recipes).where(eq(recipes.id, input.id));
  revalidatePath("/recipes");
  revalidatePath("/plan");
  redirect("/recipes");
}
