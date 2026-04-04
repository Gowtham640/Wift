import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

/**
 * Workout route navigation that stays client-side when offline.
 * Offline `router.push` can become a document navigation; the SW then serves `/`.
 * `router.replace` keeps it as a client transition so WorkoutPage + Dexie can render.
 */
export function navigateToWorkout(router: AppRouterInstance, id: number) {
  const path = `/workouts/${id}`;
  if (typeof window !== 'undefined' && !navigator.onLine) {
    router.replace(path);
  } else {
    router.push(path);
  }
}
