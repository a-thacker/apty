import Link from "next/link";
import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { ChefHat, Plus, Sparkles, ArrowRight } from "lucide-react";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Cook" };

export default async function RecipesPage() {
  const rows = await db.query.recipes.findMany({
    with: { ingredients: { columns: { id: true } } },
    orderBy: [desc(recipes.createdAt)],
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Cook" description="Recipes & meal prep.">
        <Link href="/recipes/new">
          <Button size="sm">
            <Plus /> New
          </Button>
        </Link>
      </PageHeader>

      {/* Centerpiece: plan a meal */}
      <Link href="/plan" className="group block">
        <Card className="flex items-center gap-4 border-olive/30 bg-olive/10 p-5 transition-colors group-hover:border-olive/50 group-active:scale-[.99]">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-olive/20 text-olive">
            <Sparkles className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-semibold">Plan a meal</p>
            <p className="text-sm text-muted-foreground">
              Pick recipes → we merge the ingredients → skip what you have → build a list.
            </p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-olive" />
        </Card>
      </Link>

      <div className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Recipes</h2>
        {rows.length === 0 ? (
          <Card className="p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <ChefHat className="h-6 w-6" />
            </div>
            <p className="font-display text-lg font-medium">No recipes yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Save the meals you cook together, with ingredient quantities.
            </p>
            <Link href="/recipes/new" className="mt-4 inline-block">
              <Button>
                <Plus /> Add a recipe
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {rows.map((r) => (
              <Link key={r.id} href={`/recipes/${r.id}`}>
                <Card className="flex items-center gap-3.5 p-4 transition-colors hover:border-primary/40 active:scale-[.99]">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-xl">
                    🍳
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{r.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {r.ingredients.length} ingredient{r.ingredients.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  {r.servings ? <Badge variant="muted">serves {r.servings}</Badge> : null}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
