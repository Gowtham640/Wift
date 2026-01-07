"use client";

import { useEffect } from "react";
import Sidebar from "@/components/navigation/Sidebar";
import BottomNav from "@/components/navigation/BottomNav";
import WorkoutResumeBanner from "@/components/navigation/WorkoutResumeBanner";
import NetworkStatus from "@/components/NetworkStatus";
import UpdatePrompt from "@/components/UpdatePrompt";
import { TrackVisitedRoutes } from "@/components/TrackVisitedRoutes";
import { ToastContainer } from "@/components/ui/Toast";
import { runDataMigrations } from "@/lib/migrations";
import { initializeDefaultExercises } from "@/lib/defaultExercises";

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Run data migrations on app startup
    runDataMigrations();

    // Initialize default exercises if needed (deferred to avoid blocking hydration)
    setTimeout(() => {
      initializeDefaultExercises();
    }, 1000);
  }, []);

  return (
    <>
      <TrackVisitedRoutes />
      <NetworkStatus />
      <UpdatePrompt />
      <ToastContainer />
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 min-h-screen p-1 md:p-8 md:ml-64">
          {children}
        </main>
      </div>
      <div className="md:hidden">
        <WorkoutResumeBanner />
        <BottomNav />
      </div>
    </>
  );
}