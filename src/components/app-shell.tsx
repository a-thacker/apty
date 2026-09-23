"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBasket, ChefHat, CalendarCheck, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: React.ElementType };

const NAV: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/lists", label: "Lists", icon: ShoppingBasket },
  { href: "/recipes", label: "Cook", icon: ChefHat },
  { href: "/chores", label: "Chores", icon: CalendarCheck },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AppShell({
  user,
  children,
}: {
  user: { name: string; email: string; color: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-5 py-3.5">
          <Link href="/" className="group flex items-baseline gap-0.5">
            <span className="font-display text-2xl font-semibold tracking-tight">apty</span>
            <span className="h-1.5 w-1.5 translate-y-[-2px] rounded-full bg-primary transition-transform group-active:scale-125" />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              aria-label="Settings"
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                isActive(pathname, "/settings") && "bg-accent text-foreground",
              )}
            >
              <Settings className="h-[18px] w-[18px]" />
            </Link>
            <Link
              href="/settings"
              aria-label={`Signed in as ${user.email}`}
              className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white shadow-sm ring-2 ring-background"
              style={{ backgroundColor: user.color }}
            >
              {initials(user.name)}
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-5 pb-28 pt-5">{children}</main>

      {/* Bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-card/90 backdrop-blur-md">
        <div
          className="mx-auto flex max-w-2xl items-stretch justify-around px-2 pt-1.5"
          style={{ paddingBottom: "calc(0.375rem + var(--safe-bottom))" }}
        >
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[0.68rem] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-14 items-center justify-center rounded-full transition-colors",
                    active && "bg-primary/12",
                  )}
                >
                  <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.4 : 2} />
                </span>
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
