"use client";

import { useEffect, useState } from "react";
import { BellOff, BellRing, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

type State = "loading" | "unsupported" | "unconfigured" | "off" | "on" | "denied";

export function NotificationsToggle() {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!VAPID_PUBLIC_KEY) return setState("unconfigured");
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        return setState("unsupported");
      }
      if (Notification.permission === "denied") return setState("denied");
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setState(sub ? "on" : "off");
    })().catch(() => setState("unsupported"));
  }, []);

  async function enable() {
    setBusy(true);
    setMsg(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(sub),
      });
      setState("on");
    } catch {
      setMsg("Couldn't enable notifications. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setMsg(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("off");
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      const data = await res.json();
      setMsg(data.sent ? "Sent — check your device." : "No devices reached.");
    } finally {
      setBusy(false);
    }
  }

  if (state === "loading") {
    return <p className="text-sm text-muted-foreground">Checking…</p>;
  }
  if (state === "unconfigured") {
    return (
      <p className="text-sm text-muted-foreground">
        Not set up yet. Run <code className="rounded bg-muted px-1.5 py-0.5">npm run generate:vapid</code>{" "}
        and add the keys to your environment.
      </p>
    );
  }
  if (state === "unsupported") {
    return (
      <p className="text-sm text-muted-foreground">
        This browser can&apos;t do push notifications. On iPhone, add apty to your home screen first.
      </p>
    );
  }
  if (state === "denied") {
    return (
      <p className="text-sm text-muted-foreground">
        Notifications are blocked. Re-enable them for this site in your browser settings.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {state === "on" ? (
          <>
            <Button variant="secondary" onClick={disable} disabled={busy}>
              <BellOff /> Turn off
            </Button>
            <Button variant="outline" onClick={test} disabled={busy}>
              <Send /> Send test
            </Button>
          </>
        ) : (
          <Button onClick={enable} disabled={busy}>
            <BellRing /> Enable reminders
          </Button>
        )}
      </div>
      {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
    </div>
  );
}
