"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { recipes, recipeIngredients } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export type IngredientInput = { name: string; qty?: number | null; unit?: string | null };

type RecipeInput = {
  name: string;
  description?: string;
  servings?: number;
  ingredients: IngredientInput[];
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

export async function createRecipe(input: RecipeInput) {
  const user = await getCurrentUser();
  const name = input.name.trim();
  if (!name) return null;
  const [recipe] = await db
    .insert(recipes)
    .values({
      name,
      description: input.description?.trim() || null,
      servings: input.servings ?? 2,
      createdBy: user.id,
    })
    .returning();
  await writeIngredients(recipe.id, input.ingredients);
  revalidatePath("/recipes");
  revalidatePath("/plan");
  return recipe;
}

export async function updateRecipe(input: RecipeInput & { id: string }) {
  const name = input.name.trim();
  if (!name) return;
  await db
    .update(recipes)
    .set({
      name,
      description: input.description?.trim() || null,
      servings: input.servings ?? 2,
    })
    .where(eq(recipes.id, input.id));
  // Simplest correct approach: replace the ingredient set.
  await db.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, input.id));
  await writeIngredients(input.id, input.ingredients);
  revalidatePath("/recipes");
  revalidatePath(`/recipes/${input.id}`);
  revalidatePath("/plan");
}

export async function deleteRecipe(input: { id: string }) {
  await db.delete(recipes).where(eq(recipes.id, input.id));
  revalidatePath("/recipes");
  revalidatePath("/plan");
  redirect("/recipes");
}
