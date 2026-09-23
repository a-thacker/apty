"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { lists, listItems } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function createList(input: { name: string; emoji?: string; kind?: string }) {
  const user = await getCurrentUser();
  const name = input.name.trim();
  if (!name) return null;
  const [row] = await db
    .insert(lists)
    .values({
      name,
      emoji: input.emoji?.trim() || null,
      kind: input.kind ?? "grocery",
      createdBy: user.id,
    })
    .returning();
  revalidatePath("/lists");
  revalidatePath("/");
  return row;
}

export async function addItem(input: { listId: string; name: string; qty?: string }) {
  const user = await getCurrentUser();
  const name = input.name.trim();
  if (!name) return;
  await db.insert(listItems).values({
    listId: input.listId,
    name,
    qty: input.qty?.trim() || null,
    addedBy: user.id,
  });
  revalidatePath(`/lists/${input.listId}`);
  revalidatePath("/lists");
  revalidatePath("/");
}

export async function toggleItem(input: { id: string; checked: boolean; listId: string }) {
  await db.update(listItems).set({ checked: input.checked }).where(eq(listItems.id, input.id));
  revalidatePath(`/lists/${input.listId}`);
  revalidatePath("/lists");
}

export async function deleteItem(input: { id: string; listId: string }) {
  await db.delete(listItems).where(eq(listItems.id, input.id));
  revalidatePath(`/lists/${input.listId}`);
  revalidatePath("/lists");
}

export async function clearChecked(input: { listId: string }) {
  await db
    .delete(listItems)
    .where(and(eq(listItems.listId, input.listId), eq(listItems.checked, true)));
  revalidatePath(`/lists/${input.listId}`);
  revalidatePath("/lists");
}

export async function deleteList(input: { id: string }) {
  await db.delete(lists).where(eq(lists.id, input.id));
  revalidatePath("/lists");
  revalidatePath("/");
  redirect("/lists");
}
