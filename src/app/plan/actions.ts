"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { lists, listItems } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { formatQty } from "@/lib/ingredients";

type PlanItem = { name: string; qty?: number | null; unit?: string | null };

/**
 * Adds the "need to buy" items from a meal plan to a grocery list (existing or
 * new). Returns the list id so the client can navigate to it.
 */
export async function commitPlan(input: {
  targetListId?: string;
  newListName?: string;
  items: PlanItem[];
}) {
  const user = await getCurrentUser();

  let listId = input.targetListId;
  if (!listId) {
    const [list] = await db
      .insert(lists)
      .values({
        name: input.newListName?.trim() || "Groceries",
        emoji: "🛒",
        kind: "grocery",
        createdBy: user.id,
      })
      .returning();
    listId = list.id;
  }

  const rows = input.items
    .filter((i) => i.name.trim())
    .map((i, idx) => ({
      listId: listId!,
      name: i.name.trim(),
      qty: formatQty(i.qty, i.unit),
      addedBy: user.id,
      source: "recipe",
      sortOrder: idx,
    }));
  if (rows.length) await db.insert(listItems).values(rows);

  revalidatePath("/lists");
  revalidatePath(`/lists/${listId}`);
  revalidatePath("/");
  return { listId };
}
