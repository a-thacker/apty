"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { chores, choreCompletions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { computeNextDue } from "@/lib/schedule";

type ChoreInput = {
  name: string;
  description?: string;
  assigneeId?: string | null;
  cadence: string;
  scheduledDow?: number | null;
  scheduledTime?: string | null;
};

export async function createChore(input: ChoreInput) {
  const user = await getCurrentUser();
  const name = input.name.trim();
  if (!name) return null;
  const nextDue = computeNextDue(input.cadence, input.scheduledDow, input.scheduledTime);
  const [chore] = await db
    .insert(chores)
    .values({
      name,
      description: input.description?.trim() || null,
      assigneeId: input.assigneeId || null,
      cadence: input.cadence,
      scheduledDow: input.scheduledDow ?? null,
      scheduledTime: input.scheduledTime || null,
      nextDueAt: nextDue ? new Date(nextDue * 1000) : null,
      createdBy: user.id,
    })
    .returning();
  revalidatePath("/chores");
  revalidatePath("/");
  return chore;
}

export async function updateChore(input: ChoreInput & { id: string }) {
  const name = input.name.trim();
  if (!name) return;
  const nextDue = computeNextDue(input.cadence, input.scheduledDow, input.scheduledTime);
  await db
    .update(chores)
    .set({
      name,
      description: input.description?.trim() || null,
      assigneeId: input.assigneeId || null,
      cadence: input.cadence,
      scheduledDow: input.scheduledDow ?? null,
      scheduledTime: input.scheduledTime || null,
      nextDueAt: nextDue ? new Date(nextDue * 1000) : null,
    })
    .where(eq(chores.id, input.id));
  revalidatePath("/chores");
  revalidatePath("/");
}

export async function markChoreDone(input: { id: string }) {
  const user = await getCurrentUser();
  const chore = await db.query.chores.findFirst({ where: eq(chores.id, input.id) });
  if (!chore) return;

  await db.insert(choreCompletions).values({ choreId: chore.id, userId: user.id });
  const nextDue = computeNextDue(chore.cadence, chore.scheduledDow, chore.scheduledTime);
  await db
    .update(chores)
    .set({
      lastDoneAt: new Date(),
      nextDueAt: nextDue ? new Date(nextDue * 1000) : null,
    })
    .where(eq(chores.id, chore.id));
  revalidatePath("/chores");
  revalidatePath("/");
}

export async function deleteChore(input: { id: string }) {
  await db.delete(chores).where(eq(chores.id, input.id));
  revalidatePath("/chores");
  revalidatePath("/");
}
