import Link from "next/link";
import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { CalendarCheck, Plus, Bell } from "lucide-react";
import { db } from "@/db";
import { chores, type Chore } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChoreCard } from "@/components/chores/chore-card";
import { isDoneThisCycle } from "@/lib/schedule";

export const metadata: Metadata = { title: "Chores" };

type Row = Chore & { assignee: { name: string | null; color: string } | null };

function renderCard(c: Row, showAssignee: boolean) {
  const done = isDoneThisCycle(c.cadence, c.lastDoneAt);
  const overdue = !done && c.nextDueAt != null && c.nextDueAt.getTime() <= Date.now();
  return (
    <ChoreCard
      key={c.id}
      chore={{
        id: c.id,
        name: c.name,
        cadence: c.cadence,
        scheduledDow: c.scheduledDow,
        scheduledTime: c.scheduledTime,
      }}
      assignee={c.assignee}
      doneThisCycle={done}
      overdue={overdue}
      rotates={c.rotation}
      showAssignee={showAssignee}
    />
  );
}

export default async function ChoresPage() {
  const user = await getCurrentUser();
  const rows = (await db.query.chores.findMany({
    where: eq(chores.archived, false),
    with: { assignee: { columns: { name: true, color: true } } },
    orderBy: [asc(chores.nextDueAt)],
  })) as Row[];

  const mine = rows.filter((c) => c.assigneeId === user.id);
  const others = rows.filter((c) => c.assigneeId !== user.id);

  return (
    <div className="space-y-6">
      <PageHeader title="Chores" description="Claim it, pick your day, get reminded.">
        <Link href="/chores/new">
          <Button size="sm">
            <Plus /> New
          </Button>
        </Link>
      </PageHeader>

      {rows.length === 0 ? (
        <Card className="p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <CalendarCheck className="h-6 w-6" />
          </div>
          <p className="font-display text-lg font-medium">No chores yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add a chore, pick who does it and when — apty reminds them.
          </p>
          <Link href="/chores/new" className="mt-4 inline-block">
            <Button>
              <Plus /> Add a chore
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-6">
          {mine.length ? (
            <section className="space-y-2.5">
              <h2 className="font-display text-lg font-semibold">Yours</h2>
              {mine.map((c) => renderCard(c, false))}
            </section>
          ) : null}
          {others.length ? (
            <section className="space-y-2.5">
              <h2 className="font-display text-lg font-semibold">Roommates</h2>
              {others.map((c) => renderCard(c, true))}
            </section>
          ) : null}
        </div>
      )}

      <Link href="/settings" className="block">
        <Card className="flex items-center gap-3 border-honey/30 bg-honey/10 p-4 transition-colors hover:border-honey/50">
          <Bell className="h-5 w-5 shrink-0 text-honey" />
          <p className="text-sm text-muted-foreground">
            Turn on notifications in <span className="font-medium text-foreground">Settings</span> to
            get reminders when your chores are due.
          </p>
        </Card>
      </Link>
    </div>
  );
}
