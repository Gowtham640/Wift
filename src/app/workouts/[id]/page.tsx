'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useWorkout, useWorkouts } from '@/hooks/useWorkouts';
import { ArrowLeft, Check, Clock, Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import ExerciseCard from '@/components/workout/ExerciseCard';
import GlassWidget from '@/components/ui/GlassWidget';
import { formatDuration } from '@/lib/utils';

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
  const [currentWorkoutId, setCurrentWorkoutId] = useState<number | null>(workoutId);
  const { workout, loading, completeWorkout, addExerciseToWorkout } = useWorkout(currentWorkoutId);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (workoutId === null) {
      const initWorkout = async () => {
        const id = await createWorkout(routineId ? parseInt(routineId) : undefined);
        setCurrentWorkoutId(Number(id));
        router.replace(`/workouts/${id}`);
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
    if (currentWorkoutId && confirm('Complete this workout?')) {
      await completeWorkout(currentWorkoutId);
      router.push('/');
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 max-w-4xl mx-auto">
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
    </div>
  );
}

