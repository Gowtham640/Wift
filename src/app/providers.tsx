"use client";

import { useEffect } from "react";
import Sidebar from "@/components/navigation/Sidebar";
import BottomNav from "@/components/navigation/BottomNav";
import NetworkStatus from "@/components/NetworkStatus";
import UpdatePrompt from "@/components/UpdatePrompt";
import { runDataMigrations } from "@/lib/migrations";
import { initializeDefaultExercises } from "@/lib/defaultExercises";

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Run data migrations on app startup
    runDataMigrations();

    // Initialize default exercises if needed
    initializeDefaultExercises();
  }, []);

  return (
    <>
      <NetworkStatus />
      <UpdatePrompt />
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