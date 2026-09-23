"use client";

import { useEffect } from "react";

/** Registers the PWA service worker once, on the client, in production-like envs. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // Register after load so it never competes with first paint.
    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* offline / unsupported — non-fatal */
      });
    };
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
