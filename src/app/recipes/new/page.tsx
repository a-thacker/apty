import Link from "next/link";
import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { ChevronLeft } from "lucide-react";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { RecipeForm } from "@/components/recipes/recipe-form";

export const metadata: Metadata = { title: "New recipe" };

export default async function NewRecipePage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const { kind: kindParam } = await searchParams;
  const kind = kindParam === "component" ? "component" : "meal";

  const availableComponents =
    kind === "meal"
      ? await db.query.recipes.findMany({
          where: eq(recipes.kind, "component"),
          orderBy: [asc(recipes.name)],
          columns: { id: true, name: true },
        })
      : [];

  return (
    <div className="space-y-5">
      <Link
        href="/recipes"
        className="-ml-1 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Cook
      </Link>
      <PageHeader title={kind === "component" ? "New component" : "New recipe"} />
      <RecipeForm kind={kind} availableComponents={availableComponents} />
    </div>
  );
}
