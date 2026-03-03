'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { db } from '@/lib/db';
import {
  fetchUserSnapshot,
  signInWithGoogle,
  syncUserSnapshot,
  supabase
} from '@/lib/supabaseClient';

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

type SyncOptions = {
  reason?: 'manual' | 'online' | 'initial' | 'retry';
};

type SyncResult = {
  success: boolean;
  message: string;
};

const SYNC_META_KEY = 'wift:supabase-sync-meta';
const MAX_SYNC_RETRIES = 4;
const BASE_RETRY_DELAY_MS = 2000;

const trackedTables = [
  'profiles',
  'exercises',
  'routines',
  'routine_exercises',
  'workouts',
  'workout_exercises',
  'sets',
  'weight_entries',
  'widget_settings',
  'settings'
] as const;

type TrackedTableName = (typeof trackedTables)[number];

type SyncMetaStorage = {
  lastSyncAt?: number;
  lastStatus?: SyncStatus;
  lastSyncedVersion?: number | null;
};

function readSyncMetaFromStorage(): SyncMetaStorage | null {
  if (typeof window === 'undefined') return null;
  const stored = window.localStorage.getItem(SYNC_META_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error('Unable to parse sync metadata', error);
    return null;
  }
}

type SupabaseAuthContextValue = {
  user: User | null;
  isLoading: boolean;
  isOnline: boolean;
  syncStatus: SyncStatus;
  lastSyncAt: number | null;
  lastSyncedVersion: number | null;
  lastSyncError: string | null;
  signIn: () => Promise<void>;
  manualSync: () => Promise<SyncResult>;
  triggerSync: (options?: SyncOptions) => Promise<SyncResult>;
  signOut: () => Promise<void>;
};

const SupabaseAuthContext = createContext<SupabaseAuthContextValue | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const value = useProvideSupabaseAuth();
  return <SupabaseAuthContext.Provider value={value}>{children}</SupabaseAuthContext.Provider>;
}

export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within SupabaseAuthProvider');
  }
  return context;
}

function useProvideSupabaseAuth(): SupabaseAuthContextValue {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [lastSyncedVersion, setLastSyncedVersion] = useState<number | null>(null);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const retryAttemptRef = useRef(0);
  const retryTimeoutRef = useRef<number | null>(null);
  const performSyncRef = useRef<((options?: SyncOptions) => Promise<SyncResult>) | null>(null);

  const hydrateSnapshot = useCallback(async (payload: Record<string, unknown[]>) => {
    if (typeof window === 'undefined') return;

    // Replace every tracked table with the server snapshot so no orphaned rows remain.
    await db.transaction('rw', trackedTables, async () => {
      for (const tableName of trackedTables) {
        const table = db.table(tableName);
        await table.clear();
        const items = Array.isArray(payload[tableName]) ? payload[tableName] : [];
        if (items.length > 0) {
          await table.bulkAdd(items);
        }
      }
    });
  }, []);

  const buildSnapshot = useCallback(async () => {
    const snapshot: Record<string, unknown[]> = {};
    await Promise.all(
      trackedTables.map(async (tableName) => {
        const table = db.table(tableName);
        // Capture whatever the user has stored today (source of truth).
        snapshot[tableName] = await table.toArray();
      })
    );
    return snapshot;
  }, []);

  const isLocalDbEmpty = useCallback(async () => {
    const counts = await Promise.all(
      trackedTables.map((tableName) => db.table(tableName).count())
    );
    return counts.every((count) => count === 0);
  }, []);

  const scheduleRetry = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!navigator.onLine) return;
    if (retryAttemptRef.current >= MAX_SYNC_RETRIES) return;

    const delay = Math.min(
      BASE_RETRY_DELAY_MS * Math.pow(2, retryAttemptRef.current),
      30000
    );
    retryAttemptRef.current += 1;

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    retryTimeoutRef.current = window.setTimeout(() => {
      performSyncRef.current?.({ reason: 'retry' });
    }, delay);
  }, []);

  const performSync = useCallback(
    async (options: SyncOptions = {}): Promise<SyncResult> => {
      if (!user) {
        return { success: false, message: 'Sign in to sync your data' };
      }

      if (typeof window === 'undefined') {
        return { success: false, message: 'Sync requires a browser context' };
      }

      if (!navigator.onLine) {
        const offlineMessage = 'Offline mode – sync will resume when you are back online';
        setSyncStatus('error');
        setLastSyncError(offlineMessage);
        scheduleRetry();
        return { success: false, message: offlineMessage };
      }

      setSyncStatus('syncing');
      setLastSyncError(null);

      try {
        const snapshot = await buildSnapshot();
        const snapshotResult = await fetchUserSnapshot(user.id);
        if (snapshotResult.error) {
          throw snapshotResult.error;
        }

        const nextVersion = (snapshotResult.data?.version ?? 0) + 1;
        const { data, error } = await syncUserSnapshot(user.id, snapshot, nextVersion);
        if (error) {
          throw error;
        }

        const timestamp = Date.now();
        setLastSyncAt(timestamp);
        setSyncStatus('success');
        setLastSyncedVersion(data?.version ?? nextVersion);
        retryAttemptRef.current = 0;
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = null;
        }

        return { success: true, message: 'Your snapshot is up to date' };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to sync with Supabase';
        setLastSyncError(message);
        setSyncStatus('error');
        scheduleRetry();
        return { success: false, message };
      }
    },
    [user, buildSnapshot, scheduleRetry]
  );

  useEffect(() => {
    performSyncRef.current = performSync;
  }, [performSync]);

  const manualSync = useCallback(async () => {
    retryAttemptRef.current = 0;
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    return performSync({ reason: 'manual' });
  }, [performSync]);

  const triggerSync = useCallback(
    (options?: SyncOptions) => performSync(options),
    [performSync]
  );

  const hydrateIfNeeded = useCallback(
    async (userId: string) => {
      try {
        const snapshotResponse = await fetchUserSnapshot(userId);
        const payload = snapshotResponse.data?.data;
        if (!payload) return;

        const hasData = Object.values(payload).some(
          (value) => Array.isArray(value) && value.length > 0
        );
        if (!hasData) return;

        const remoteVersion = snapshotResponse.data?.version ?? 0;
        const storedMeta = readSyncMetaFromStorage();
        const storedVersion = storedMeta?.lastSyncedVersion ?? null;

        let shouldHydrate = false;
        if (storedVersion === null || remoteVersion > (storedVersion ?? 0)) {
          shouldHydrate = true;
        } else {
          const empty = await isLocalDbEmpty();
          shouldHydrate = empty;
        }

        if (!shouldHydrate) return;

        await hydrateSnapshot(payload);
        setLastSyncedVersion(remoteVersion);
        setLastSyncAt(Date.now());
      } catch (error) {
        console.error('Failed to hydrate snapshot', error);
      }
    },
    [hydrateSnapshot, isLocalDbEmpty]
  );

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      setSyncStatus((prev) => (prev === 'idle' ? 'error' : prev));
      setLastSyncError('Supabase configuration missing');
      return;
    }

    let isMounted = true;
    supabase.auth.getSession().then((result) => {
      if (!isMounted) return;
      const currentUser = result.data.session?.user ?? null;
      setUser(currentUser);
      setIsLoading(false);
      if (currentUser) {
        hydrateIfNeeded(currentUser.id).then(() => {
          performSyncRef.current?.({ reason: 'initial' });
        });
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      if (nextUser) {
        hydrateIfNeeded(nextUser.id).then(() => {
          performSyncRef.current?.({ reason: 'initial' });
        });
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [hydrateIfNeeded]);

  useEffect(() => {
    const stored = readSyncMetaFromStorage();
    if (!stored) return;

    if (stored.lastSyncAt !== undefined) {
      setLastSyncAt(stored.lastSyncAt);
    }
    if (stored.lastStatus) {
      setSyncStatus(stored.lastStatus);
    }
    if (stored.lastSyncedVersion !== undefined) {
      setLastSyncedVersion(stored.lastSyncedVersion);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      SYNC_META_KEY,
      JSON.stringify({
        lastSyncAt,
        lastStatus: syncStatus,
        lastSyncedVersion
      })
    );
  }, [lastSyncAt, lastSyncedVersion, syncStatus]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      if (user) {
        performSyncRef.current?.({ reason: 'online' });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  const signIn = useCallback(async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to start Google sign in';
      setLastSyncError(message);
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;

    try {
      await supabase.auth.signOut();
      setSyncStatus('idle');
      setLastSyncError(null);
    } catch (error) {
      console.error('Failed to sign out', error);
      const message = error instanceof Error ? error.message : 'Unable to sign out';
      setLastSyncError(message);
    }
  }, []);

  return {
    user,
    isLoading,
    isOnline,
    syncStatus,
    lastSyncAt,
    lastSyncedVersion,
    lastSyncError,
    signIn,
    manualSync,
    triggerSync,
    signOut
  };
}
