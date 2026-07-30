"use client";

import { useEffect } from "react";

export function HydrationSignal() {
  useEffect(() => {
    document.documentElement.dataset.hydrated = "true";
  }, []);

  return null;
}
