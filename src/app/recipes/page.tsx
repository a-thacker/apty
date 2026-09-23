import type { Metadata } from "next";
import { ChefHat } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Cook" };

export default function RecipesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Cook" description="Recipes and meal prep for you & your cooking partner." />
      <EmptyState
        icon={ChefHat}
        title="Recipes are next"
        description="Save recipes with ingredient quantities, then plan meals: apty merges everything, you tick off what's already in the pantry, and the rest lands on a grocery list."
      />
    </div>
  );
}
