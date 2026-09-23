import type { Metadata } from "next";
import { CalendarCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Chores" };

export default function ChoresPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Chores" description="Claim a chore, pick your day, get reminded." />
      <EmptyState
        icon={CalendarCheck}
        title="Chores are next"
        description="Each roommate picks when they'll do their chore and apty sends a weekly reminder. Turn on notifications in Settings first."
      />
    </div>
  );
}
