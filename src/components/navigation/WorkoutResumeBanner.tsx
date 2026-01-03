'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { Play, X, Dumbbell } from 'lucide-react';
import { db } from '@/lib/db';
import Button from '@/components/ui/Button';

export default function WorkoutResumeBanner() {
  const router = useRouter();
  const pathname = usePathname();

  // Check if we're on a workout page
  const isOnWorkoutPage = pathname.startsWith('/workouts/');

  // Check for incomplete workouts
  const incompleteWorkout = useLiveQuery(async () => {
    if (isOnWorkoutPage) return null; // Don't show on workout pages

    const allWorkouts = await db.workouts.toArray();
    const workouts = allWorkouts.filter(workout => workout.endTime === undefined);

    if (workouts.length === 0) return null;

    // Get the most recent incomplete workout
    const latestWorkout = workouts.sort((a, b) => (b.startTime || 0) - (a.startTime || 0))[0];

    // Get routine name if it exists
    let routineName = 'Free Workout';
    if (latestWorkout.routineId) {
      const routine = await db.routines.get(latestWorkout.routineId);
      if (routine) {
        routineName = routine.name;
      }
    }

    // Get exercise count
    const exerciseCount = await db.workout_exercises
      .where('workoutId')
      .equals(latestWorkout.id!)
      .count();

    return {
      id: latestWorkout.id,
      routineName,
      exerciseCount,
      startTime: latestWorkout.startTime
    };
  }, [isOnWorkoutPage]);

  if (!incompleteWorkout || isOnWorkoutPage) {
    return null;
  }

  const handleResume = () => {
    router.push(`/workouts/${incompleteWorkout.id}`);
  };

  const handleDiscard = async () => {
    if (confirm('Are you sure you want to discard this workout? This action cannot be undone.')) {
      // Delete the workout and all associated data
      const workoutExercises = await db.workout_exercises
        .where('workoutId')
        .equals(incompleteWorkout.id!)
        .toArray();

      // Delete all sets for this workout
      await Promise.all(
        workoutExercises.map(async (we) => {
          await db.sets.where('workoutExerciseId').equals(we.id!).delete();
        })
      );

      // Delete workout exercises
      await db.workout_exercises
        .where('workoutId')
        .equals(incompleteWorkout.id!)
        .delete();

      // Delete the workout
      await db.workouts.delete(incompleteWorkout.id!);
    }
  };

  return (
    <div className="md:hidden fixed bottom-[72px] left-0 right-0 w-full z-[9998] pointer-events-auto">
      <div className="bg-blue-600/95 backdrop-blur-sm fixed bottom-[72px] left-0 right-0 w-full border-t border-white/10 pb-safe">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
              <Dumbbell size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {incompleteWorkout.routineName}
              </p>
              <p className="text-white/80 text-xs">
                {incompleteWorkout.exerciseCount} exercises in progress
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleDiscard}
              variant="secondary"
              className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 border-white/20"
            >
              <X size={14} />
              Discard
            </Button>
            <Button
              onClick={handleResume}
              className="px-3 py-1.5 text-xs bg-white hover:bg-white/90 text-blue-600"
            >
              <Play size={14} />
              Resume
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
