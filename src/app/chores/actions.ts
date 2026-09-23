"use server";

import { revalidatePath } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { chores, choreCompletions, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { computeNextDue } from "@/lib/schedule";

type ChoreInput = {
  name: string;
  description?: string;
  assigneeId?: string | null;
  cadence: string;
  rotation?: boolean;
  scheduledDow?: number | null;
  scheduledTime?: string | null;
};

/**
 * The user whose turn is next in a rotation — the person after `currentId` in a
 * stable, creation-ordered ring of all users (wraps around). Falls back to the
 * first user when there's no current assignee.
 */
async function nextRotationAssignee(currentId: string | null): Promise<string | null> {
  const roster = await db.query.users.findMany({
    orderBy: [asc(users.createdAt)],
    columns: { id: true },
  });
  if (roster.length === 0) return currentId;
  const i = roster.findIndex((u) => u.id === currentId);
  return roster[(i + 1) % roster.length].id;
}

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
      rotation: input.rotation ?? false,
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
      rotation: input.rotation ?? false,
      scheduledDow: input.scheduledDow ?? null,
      scheduledTime: input.scheduledTime || null,
      nextDueAt: nextDue ? new Date(nextDue * 1000) : null,
      // Schedule changed — start the nag clock fresh for the new cycle.
      lastRemindedAt: null,
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
  // Rotating chores hand off to the next roommate for the coming cycle.
  const nextAssignee = chore.rotation
    ? await nextRotationAssignee(chore.assigneeId)
    : chore.assigneeId;
  await db
    .update(chores)
    .set({
      lastDoneAt: new Date(),
      nextDueAt: nextDue ? new Date(nextDue * 1000) : null,
      assigneeId: nextAssignee,
      lastRemindedAt: null, // clear the nag throttle for the next cycle
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
