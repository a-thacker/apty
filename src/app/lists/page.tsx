import Link from "next/link";
import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { ShoppingBasket } from "lucide-react";
import { db } from "@/db";
import { lists } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { NewListForm } from "@/components/lists/new-list-form";

export const metadata: Metadata = { title: "Lists" };

export default async function ListsPage() {
  const rows = await db.query.lists.findMany({
    where: eq(lists.archived, false),
    with: { items: { columns: { id: true, checked: true } } },
    orderBy: [desc(lists.createdAt)],
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Lists" description="Groceries, to-dos, whatever you need." />

      <NewListForm />

      {rows.length === 0 ? (
        <Card className="p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ShoppingBasket className="h-6 w-6" />
          </div>
          <p className="font-display text-lg font-medium">No lists yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create one above — try <span className="font-medium text-foreground">C&amp;A Groceries</span>.
          </p>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {rows.map((l) => {
            const total = l.items.length;
            const done = l.items.filter((i) => i.checked).length;
            const remaining = total - done;
            const pct = total === 0 ? 0 : Math.round((done / total) * 100);
            return (
              <Link key={l.id} href={`/lists/${l.id}`}>
                <Card className="overflow-hidden transition-colors hover:border-primary/40 active:scale-[.99]">
                  <div className="flex items-center gap-3.5 p-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-xl">
                      {l.emoji ?? "🛒"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{l.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {total === 0
                          ? "Empty"
                          : remaining === 0
                            ? "All done 🎉"
                            : `${remaining} to get${done ? ` · ${done} in cart` : ""}`}
                      </p>
                    </div>
                  </div>
                  {total > 0 ? (
                    <div className="h-1 w-full bg-muted">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  ) : null}
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
