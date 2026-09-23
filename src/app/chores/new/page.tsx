import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import { db } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { ChoreForm } from "@/components/chores/chore-form";

export const metadata: Metadata = { title: "New chore" };

export default async function NewChorePage() {
  const user = await getCurrentUser();
  const userRows = await db.query.users.findMany({
    columns: { id: true, name: true, email: true },
  });
  const users = userRows.map((u) => ({ id: u.id, name: u.name ?? u.email.split("@")[0] }));

  return (
    <div className="space-y-5">
      <Link
        href="/chores"
        className="-ml-1 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Chores
      </Link>
      <PageHeader title="New chore" />
      <ChoreForm users={users} currentUserId={user.id} />
    </div>
  );
}
