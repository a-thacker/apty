import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationsToggle } from "@/components/notifications-toggle";

export const metadata: Metadata = { title: "Settings" };

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const name = user.name ?? "You";

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" />

      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold text-white shadow-sm"
            style={{ backgroundColor: user.color }}
          >
            {initials(name)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-semibold">{name}</p>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose how apty looks on this device.</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" /> Chore reminders
          </CardTitle>
          <CardDescription>
            Get a push notification when a chore you scheduled is due. On iPhone, add apty to your
            home screen first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationsToggle />
        </CardContent>
      </Card>

      <p className="px-1 text-center text-xs text-muted-foreground">
        apty · self-hosted in your apartment 🏠
      </p>
    </div>
  );
}
