"use client";

import { useEffect } from "react";

export default function AppMonitor() {
  useEffect(() => {
    console.log("🟢 App Mounted At:", new Date().toISOString());

    const handleBeforeUnload = () => {
      console.log("🔁 Page is unloading...");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return null;
}