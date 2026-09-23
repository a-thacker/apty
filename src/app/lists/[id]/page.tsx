import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { asc, desc, eq } from "drizzle-orm";
import { ChevronLeft } from "lucide-react";
import { db } from "@/db";
import { lists, listItems } from "@/db/schema";
import { QuickAdd } from "@/components/lists/quick-add";
import { ListItemRow } from "@/components/lists/list-item-row";
import { ListMenu } from "@/components/lists/list-menu";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const l = await db.query.lists.findFirst({ where: eq(lists.id, id), columns: { name: true } });
  return { title: l?.name ?? "List" };
}

export default async function ListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const list = await db.query.lists.findFirst({
    where: eq(lists.id, id),
    with: { items: { orderBy: [asc(listItems.sortOrder), desc(listItems.createdAt)] } },
  });
  if (!list) notFound();

  const active = list.items.filter((i) => !i.checked);
  const done = list.items.filter((i) => i.checked);

  return (
    <div className="space-y-5">
      <Link
        href="/lists"
        className="-ml-1 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Lists
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-2xl">
            {list.emoji ?? "🛒"}
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold leading-tight tracking-tight">
              {list.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {active.length} to get{done.length ? ` · ${done.length} in cart` : ""}
            </p>
          </div>
        </div>
        <ListMenu listId={list.id} hasChecked={done.length > 0} />
      </div>

      <QuickAdd listId={list.id} />

      {list.items.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Nothing here yet — add your first item above.
        </p>
      ) : (
        <div className="space-y-5">
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {active.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                Everything&apos;s in the cart 🎉
              </li>
            ) : (
              active.map((item) => <ListItemRow key={item.id} item={item} />)
            )}
          </ul>

          {done.length > 0 ? (
            <div className="space-y-2">
              <p className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                In cart · {done.length}
              </p>
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card/60">
                {done.map((item) => (
                  <ListItemRow key={item.id} item={item} />
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
