'use client';

import Link from 'next/link';
import { ShieldCheck, WifiOff, Wifi } from 'lucide-react';
import GlassWidget from '@/components/ui/GlassWidget';
import Button from '@/components/ui/Button';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

export default function AuthPage() {
  const {
    user,
    signIn,
    syncStatus,
    lastSyncAt,
    lastSyncError,
    isOnline
  } = useSupabaseAuth();

  const lastSyncText = lastSyncAt ? new Date(lastSyncAt).toLocaleString() : 'Not yet synced';

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
      <GlassWidget className="w-full max-w-3xl p-6 md:p-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white/70 text-sm">
            {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
            <span>{isOnline ? 'Online – ready to sync' : 'Offline – sync will resume soon'}</span>
          </div>

          <h1 className="text-3xl font-semibold text-white">Secure sign in</h1>
          <p className="text-sm text-white/70">
            Sign in with Google to back up all routines, workouts, sets, and weight entries.
            This auth layer keeps your Dexie data in sync with Supabase without touching the rest of
            the app.
          </p>
        </div>

        <div className="mt-6">
          <Button
            onClick={signIn}
            className="w-full justify-center"
            disabled={syncStatus === 'syncing'}
          >
            <ShieldCheck size={18} />
            <span className="ml-2">{user ? 'Already signed in – continue' : 'Sign in with Google'}</span>
          </Button>
          {syncStatus === 'syncing' && (
            <p className="text-xs text-white/60 mt-2 text-center">Syncing your snapshot…</p>
          )}
        </div>

        <div className="mt-6 border-t border-white/10 pt-4 space-y-2 text-sm text-white/80">
          <p>
            Last sync: <span className="font-semibold text-white">{lastSyncText}</span>
          </p>
          {lastSyncError && <p className="text-red-400">Last sync error: {lastSyncError}</p>}
          <p>
            All profile, routine, workout, set, and weight entry data is stored locally in IndexedDB
            and mirrored on Supabase. Logging into a new device will hydrate your database from the
            cloud snapshot automatically.
          </p>
        </div>

        <div className="mt-4 text-center text-xs text-white/60">
          <Link
            href="/"
            className="underline underline-offset-4 text-white/90 font-semibold hover:text-white"
          >
            Back to dashboard
          </Link>
        </div>
      </GlassWidget>
    </div>
  );
}
