"use client";

import { useEffect } from "react";

// Registers the custom /sw.js service worker. Lives in a client component so
// the useEffect runs only in the browser — `serviceWorker` is not available
// during SSR and throws if accessed there. Failure is silent: a 404 on
// /sw.js (or an old browser) just means no offline mode, no break.
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!navigator.serviceWorker?.register) return;
    void navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch(() => {});
  }, []);
  return null;
}
