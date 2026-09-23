import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { ChevronLeft } from "lucide-react";
import { db } from "@/db";
import { chores } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { ChoreForm } from "@/components/chores/chore-form";

export const metadata: Metadata = { title: "Edit chore" };

export default async function EditChorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, chore, userRows] = await Promise.all([
    getCurrentUser(),
    db.query.chores.findFirst({ where: eq(chores.id, id) }),
    db.query.users.findMany({ columns: { id: true, name: true, email: true } }),
  ]);
  if (!chore) notFound();

  const users = userRows.map((u) => ({ id: u.id, name: u.name ?? u.email.split("@")[0] }));

  return (
    <div className="space-y-5">
      <Link
        href="/chores"
        className="-ml-1 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Chores
      </Link>
      <PageHeader title="Edit chore" />
      <ChoreForm
        users={users}
        currentUserId={user.id}
        chore={{
          id: chore.id,
          name: chore.name,
          description: chore.description,
          assigneeId: chore.assigneeId,
          cadence: chore.cadence,
          rotation: chore.rotation,
          scheduledDow: chore.scheduledDow,
          scheduledTime: chore.scheduledTime,
        }}
      />
    </div>
  );
}
