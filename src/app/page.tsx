'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, User, Ruler, Scale, RefreshCw, X } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useSettings } from '@/hooks/useSettings';
import { useWorkouts } from '@/hooks/useWorkouts';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import CalendarWidget from '@/components/dashboard/CalendarWidget';
import MetricWidget from '@/components/dashboard/MetricWidget';
import LatestWorkoutWidget from '@/components/dashboard/LatestWorkoutWidget';
import { calculateBMI } from '@/lib/utils';

export default function DashboardPage() {
  const { profile, updateProfile, initializeProfile } = useProfile();
  const { initializeSettings } = useSettings();
  const { workouts } = useWorkouts();
  const { user, manualSync, lastSyncAt, syncStatus, isOnline } = useSupabaseAuth();
  const [showSyncReminder, setShowSyncReminder] = useState(true);

  useEffect(() => {
    initializeProfile();
    initializeSettings();
  }, []);

  useEffect(() => {
    setShowSyncReminder(true);
  }, [lastSyncAt, user]);

  const syncReminderThreshold = 7 * 24 * 60 * 60 * 1000;
  const needsSyncReminder =
    !!user &&
    isOnline &&
    !!lastSyncAt &&
    Date.now() - lastSyncAt > syncReminderThreshold &&
    showSyncReminder;

  const workoutDates = workouts?.map((w) => w.date) || [];
  const bmi = profile ? calculateBMI(profile.weightKg, profile.heightCm) : 0;

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto">
      {!user && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80 space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-center justify-center items-center">
            <div className="flex flex-col gap-1 justify-center items-center">
              <p className="text-lg font-medium text-white font-sans">
                Sign in to keep your data backed up
              </p>
              <p className="text-[12px] font-extralight text-white/60 font-sans">
                Signing In will allow you to sync your data across devices.
              </p>
            </div>
            <Link
              href="/auth"
              className="rounded-full bg-blue-500 px-4 py-2 w-1/2 text-xs text-center font-semibold uppercase tracking-wide text-white shadow-lg shadow-blue-500/40 transition hover:opacity-90"
            >
              Sign in
            </Link>
          </div>
        </div>
      )}

      {needsSyncReminder && (
        <div className="rounded-2xl border border-yellow-400/80 bg-yellow-400/10 p-4 text-sm text-yellow-900 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="font-semibold text-yellow-900/80">
              It has been over a week since your last sync. Tap below to refresh your cloud snapshot.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => void manualSync()}
                className="inline-flex items-center gap-2 rounded-full border border-yellow-500/70 bg-yellow-500/80 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-yellow-950 transition hover:bg-yellow-500/90"
              >
                <RefreshCw size={16} />
                Resync now
              </button>
              <span className="text-[11px] uppercase tracking-[0.2em] text-yellow-900/60">
                {syncStatus === 'syncing' ? 'Syncing…' : 'Awaiting update'}
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowSyncReminder(false)}
            className="self-start rounded-full border border-transparent bg-white/10 p-2 text-yellow-900 transition hover:bg-white/20 lg:self-center"
            aria-label="Dismiss sync reminder"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="px-2 md:px-0">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">Dashboard</h1>
        <p className="text-sm md:text-base text-white/60">Welcome back, {profile?.name || 'User'}!</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2">
          <CalendarWidget workoutDates={workoutDates} />
        </div>

        <div className="space-y-4 md:space-y-6">
          <MetricWidget
            widgetId="dashboard-weight"
            title="Weight"
            value={profile?.weightKg || 0}
            unit="kg"
            icon={<Scale size={20} />}
            onUpdate={(value) => updateProfile({ weightKg: value })}
          />

          <MetricWidget
            widgetId="dashboard-height"
            title="Height"
            value={profile?.heightCm || 0}
            unit="cm"
            icon={<Ruler size={20} />}
            onUpdate={(value) => updateProfile({ heightCm: value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <MetricWidget
          widgetId="dashboard-bmi"
          title="BMI"
          value={bmi}
          unit=""
          icon={<Activity size={20} />}
          editable={false}
        />

        <MetricWidget
          widgetId="dashboard-bodyfat"
          title="Body Fat"
          value={profile?.bodyFatPercent || 0}
          unit="%"
          icon={<User size={20} />}
          onUpdate={(value) => updateProfile({ bodyFatPercent: value })}
        />

        <div className="col-span-2 lg:col-span-1">
          <LatestWorkoutWidget />
          {/* Invisible spacer to push content above BottomNav overlay */}
          <div className="h-20 md:hidden" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
