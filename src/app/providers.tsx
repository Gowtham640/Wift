"use client";

import { useEffect } from "react";
import Sidebar from "@/components/navigation/Sidebar";
import BottomNav from "@/components/navigation/BottomNav";
import NetworkStatus from "@/components/NetworkStatus";
import { runDataMigrations } from "@/lib/migrations";

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register service worker for PWA functionality
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }

    // Run data migrations on app startup
    runDataMigrations();
  }, []);

  return (
    <>
      <NetworkStatus />
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 min-h-screen p-4 md:p-8 md:ml-64">
          {children}
        </main>
      </div>
      <div className="md:hidden">
        <BottomNav />
      </div>
    </>
  );
}
