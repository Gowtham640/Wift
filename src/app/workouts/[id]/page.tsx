'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useWorkout, useWorkouts } from '@/hooks/useWorkouts';
import { useRoutines, useRoutine } from '@/hooks/useRoutines';
import { ArrowLeft, Check, Clock, Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import ExerciseCard from '@/components/workout/ExerciseCard';
import GlassWidget from '@/components/ui/GlassWidget';
import Modal from '@/components/ui/Modal';
import { formatDuration } from '@/lib/utils';
import { db } from '@/lib/db';

export default function WorkoutPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routineId = searchParams.get('routineId');

  const workoutId = useMemo(() => {
    const id = pathname.split('/').pop();
    return id === 'new' ? null : id ? parseInt(id) : null;
  }, [pathname]);

  const { createWorkout } = useWorkouts();
  const { updateRoutine } = useRoutines();
  const [currentWorkoutId, setCurrentWorkoutId] = useState<number | null>(workoutId);
  const { workout, loading, completeWorkout, addExerciseToWorkout } = useWorkout(currentWorkoutId);
  const { addExerciseToRoutine } = useRoutine(workout?.workout.routineId || null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showUpdateRoutineModal, setShowUpdateRoutineModal] = useState(false);

  useEffect(() => {
    if (workoutId === null) {
      const initWorkout = async () => {
        try {
          const id = await createWorkout(routineId ? parseInt(routineId) : undefined);

          // Wait for workout to be fully created and queryable
          await new Promise(resolve => setTimeout(resolve, 100));

          setCurrentWorkoutId(Number(id));
          router.replace(`/workouts/${id}`);
        } catch (error) {
          console.error('Failed to create workout:', error);
          // Fallback to dashboard on error
          router.push('/');
        }
      };
      initWorkout();
    }
  }, [workoutId, routineId, createWorkout, router]);

  useEffect(() => {
    if (!workout?.workout.endTime) {
      const interval = setInterval(() => {
        if (workout?.workout.startTime) {
          setElapsedTime(Date.now() - workout.workout.startTime);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [workout]);

  const handleComplete = async () => {
    if (!currentWorkoutId || !workout) return;

    // Check if there are changes that should update the routine
    const hasChanges = await checkForRoutineChanges();

    if (hasChanges) {
      setShowUpdateRoutineModal(true);
    } else {
      await completeWorkout(currentWorkoutId);
      router.push('/');
    }
  };

  const checkForRoutineChanges = async (): Promise<boolean> => {
    if (!workout?.workout.routineId || !workout.exercises) return false;

    // Get original routine exercises
    const originalExercises = await db.routine_exercises
      .where('routineId')
      .equals(workout.workout.routineId)
      .sortBy('order');

    // Check if we have more exercises than the original routine
    if (workout.exercises.length > originalExercises.length) {
      return true;
    }

    // Check if any exercise has more sets than originally planned
    // This is a simplified check - in a real app, you'd track original set counts
    for (const exercise of workout.exercises) {
      if (exercise.sets.length > 3) { // Assume original routines had max 3 sets
        return true;
      }
    }

    return false;
  };

  const handleUpdateRoutine = async () => {
    if (!currentWorkoutId || !workout?.workout.routineId) return;

    try {
      // Add new exercises to routine
      const originalExercises = await db.routine_exercises
        .where('routineId')
        .equals(workout.workout.routineId)
        .toArray();

      const originalExerciseIds = originalExercises.map(re => re.exerciseId);

      for (const exercise of workout.exercises) {
        if (!originalExerciseIds.includes(exercise.exercise.id!)) {
          // Add new exercise to routine
          await addExerciseToRoutine(workout.workout.routineId, exercise.exercise.id!);
        }
      }

      // Complete the workout
      await completeWorkout(currentWorkoutId);
      router.push('/');
    } catch (error) {
      console.error('Failed to update routine:', error);
    }
  };

  const handleCompleteWithoutUpdate = async () => {
    if (currentWorkoutId) {
      await completeWorkout(currentWorkoutId);
      router.push('/');
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Loading overlay - non-blocking */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg">
            <p className="text-white">Loading workout...</p>
          </div>
        </div>
      )}

      {/* Not found state - only when !workout && !loading */}
      {!workout && !loading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-2">Workout Not Found</h2>
            <p className="text-white/60 mb-4">This workout doesn't exist or has been deleted.</p>
            <Button onClick={() => router.push('/')} variant="primary">
              Go to Dashboard
            </Button>
          </div>
        </div>
      )}

      {/* Workout content - only when workout exists */}
      {workout && (() => {
        const isCompleted = !!workout.workout.endTime;
        return (
          <>
            <GlassWidget className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0 sm:justify-between">
                <div className="flex items-center gap-3 md:gap-4 flex-1 w-full">
                  <Button variant="secondary" onClick={() => router.push('/routines')} className="p-2 md:p-3">
                    <ArrowLeft size={18} />
                  </Button>
                  <div className="flex-1">
                    <h1 className="text-xl md:text-2xl font-bold text-white">
                      {workout.routine?.name || 'Free Workout'}
                    </h1>
                    <div className="flex items-center gap-2 text-white/60 text-xs md:text-sm mt-1">
                      <Clock size={14} />
                      <span>{formatDuration(elapsedTime)}</span>
                    </div>
                  </div>
                </div>

                {!isCompleted && (
                  <Button onClick={handleComplete} className="w-full sm:w-auto text-sm md:text-base py-2 md:py-3">
                    <Check size={18} />
                    Complete
                  </Button>
                )}
              </div>

              {workout.totalVolume > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex justify-between">
                    <span className="text-white/60">Total Volume:</span>
                    <span className="text-white font-bold text-lg">
                      {workout.totalVolume.toFixed(0)} kg
                    </span>
                  </div>
                </div>
              )}
            </GlassWidget>

            <div className="space-y-4">
              {workout.exercises.length === 0 ? (
                <GlassWidget className="p-12 text-center">
                  <p className="text-white/40 mb-4">
                    No exercises in this workout. Add exercises to get started!
                  </p>
                  <Button onClick={() => router.push('/routines')}>
                    Go to Routines
                  </Button>
                </GlassWidget>
              ) : (
                workout.exercises.map((workoutExercise) => (
                  <ExerciseCard
                    key={workoutExercise.workoutExercise.id}
                    workoutExerciseId={workoutExercise.workoutExercise.id!}
                    exercise={workoutExercise.exercise}
                    previousBest={workoutExercise.previousBest}
                    previousVolume={0}
                  />
                ))
              )}
            </div>
          </>
        );
      })()}

      <Modal
        isOpen={showUpdateRoutineModal}
        onClose={() => setShowUpdateRoutineModal(false)}
        title="Update Routine?"
      >
        <div className="space-y-4">
          <p className="text-white/80">
            You have added exercises or sets to this workout. Would you like to update the routine to include these changes?
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => {
                setShowUpdateRoutineModal(false);
                handleUpdateRoutine();
              }}
              className="flex-1"
            >
              Yes, Update Routine
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setShowUpdateRoutineModal(false);
                handleCompleteWithoutUpdate();
              }}
              className="flex-1"
            >
              No, Just Complete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

