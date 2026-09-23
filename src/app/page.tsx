import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { ShoppingBasket, ChefHat, CalendarCheck, ArrowRight } from "lucide-react";
import { db } from "@/db";
import { lists } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { Card } from "@/components/ui/card";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const QUICK = [
  { href: "/lists", label: "Lists", hint: "Groceries & to-dos", icon: ShoppingBasket, tone: "primary" },
  { href: "/recipes", label: "Cook", hint: "Recipes & meal prep", icon: ChefHat, tone: "olive" },
  { href: "/chores", label: "Chores", hint: "Who's got what", icon: CalendarCheck, tone: "honey" },
] as const;

export default async function HomePage() {
  const user = await getCurrentUser();
  const rows = await db.query.lists.findMany({
    where: eq(lists.archived, false),
    with: { items: { columns: { id: true, checked: true } } },
    orderBy: [desc(lists.createdAt)],
    limit: 4,
  });

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-7">
      <header className="space-y-1 pt-1">
        <p className="text-sm text-muted-foreground">{today}</p>
        <h1 className="font-display text-[2rem] font-semibold leading-tight tracking-tight">
          {greeting()}, {user.name?.split(" ")[0] ?? "friend"}.
        </h1>
      </header>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        {QUICK.map(({ href, label, hint, icon: Icon, tone }) => (
          <Link key={href} href={href} className="group">
            <Card className="flex h-full flex-col justify-between gap-6 p-4 transition-colors group-hover:border-primary/40 group-active:scale-[.98]">
              <span
                className={
                  "flex h-10 w-10 items-center justify-center rounded-full " +
                  (tone === "primary"
                    ? "bg-primary/12 text-primary"
                    : tone === "olive"
                      ? "bg-olive/15 text-olive"
                      : "bg-honey/20 text-honey")
                }
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="space-y-0.5">
                <p className="font-display text-sm font-semibold">{label}</p>
                <p className="text-[0.7rem] leading-tight text-muted-foreground">{hint}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Active lists */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Your lists</h2>
          <Link
            href="/lists"
            className="flex items-center gap-0.5 text-sm font-medium text-primary hover:underline"
          >
            All lists <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {rows.length === 0 ? (
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">
              No lists yet.{" "}
              <Link href="/lists" className="font-medium text-primary hover:underline">
                Make your first one
              </Link>{" "}
              — like <span className="font-medium text-foreground">C&amp;A Groceries</span>.
            </p>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {rows.map((l) => {
              const total = l.items.length;
              const done = l.items.filter((i) => i.checked).length;
              const remaining = total - done;
              return (
                <Link key={l.id} href={`/lists/${l.id}`}>
                  <Card className="flex items-center gap-3.5 p-4 transition-colors hover:border-primary/40 active:scale-[.99]">
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
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
