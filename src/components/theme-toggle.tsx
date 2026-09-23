"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function apply(next: boolean) {
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("apty-theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <div className="inline-flex rounded-lg border border-border bg-muted p-0.5">
      {[
        { label: "Light", value: false, icon: Sun },
        { label: "Dark", value: true, icon: Moon },
      ].map(({ label, value, icon: Icon }) => (
        <button
          key={label}
          type="button"
          onClick={() => apply(value)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            dark === value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="h-4 w-4" /> {label}
        </button>
      ))}
    </div>
  );
}
