'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { Play, X, Dumbbell, AlertTriangle } from 'lucide-react';
import { db } from '@/lib/db';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { showToast } from '@/components/ui/Toast';

export default function WorkoutResumeBanner() {
  const router = useRouter();
  const pathname = usePathname();
  const [showDiscardModal, setShowDiscardModal] = React.useState(false);

  // Check if we're on a workout page
  const isOnWorkoutPage = pathname.startsWith('/workouts/');

  // Check for incomplete workouts
  const incompleteWorkout = useLiveQuery(async () => {
    if (isOnWorkoutPage) return null; // Don't show on workout pages

    const allWorkouts = await db.workouts.toArray();
    const incompleteWorkouts = allWorkouts.filter(workout => workout.endTime === undefined);

    if (incompleteWorkouts.length === 0) return null;

    // Since we ensure only one active workout, there should only be one
    const workout = incompleteWorkouts[0];
    console.log('📱 Found incomplete workout:', workout.id, 'started at:', new Date(workout.startTime || 0).toLocaleString());

    // Get routine name if it exists
    let routineName = 'Free Workout';
    if (workout.routineId) {
      const routine = await db.routines.get(workout.routineId);
      if (routine) {
        routineName = routine.name;
      }
    }

    // Get exercise count
    const exerciseCount = await db.workout_exercises
      .where('workoutId')
      .equals(workout.id!)
      .count();

    return {
      id: workout.id,
      routineName,
      exerciseCount,
      startTime: workout.startTime
    };
  }, [isOnWorkoutPage]);

  if (!incompleteWorkout || isOnWorkoutPage) {
    return null;
  }

  const handleResume = () => {
    router.push(`/workouts/${incompleteWorkout.id}`);
  };

  const handleDiscardClick = () => {
    setShowDiscardModal(true);
  };

  const handleDiscardConfirm = async () => {
    setShowDiscardModal(false);
    try {
      console.log('🗑️ Starting workout discard process for workout:', incompleteWorkout.id);

      // Delete the workout and all associated data
      const workoutExercises = await db.workout_exercises
        .where('workoutId')
        .equals(incompleteWorkout!.id!)
        .toArray();

      console.log('🗑️ Found', workoutExercises.length, 'workout exercises to delete');

      // Delete all sets for this workout
      await Promise.all(
        workoutExercises.map(async (we) => {
          await db.sets.where('workoutExerciseId').equals(we.id!).delete();
        })
      );

      // Delete workout exercises
      await db.workout_exercises
        .where('workoutId')
        .equals(incompleteWorkout!.id!)
        .delete();

      // Delete the workout
      await db.workouts.delete(incompleteWorkout!.id!);

      console.log('🗑️ Workout and all associated data deleted');

      // Verify deletion
      const remainingIncomplete = await db.workouts.filter(w => w.endTime === undefined).count();
      console.log('🗑️ Remaining incomplete workouts:', remainingIncomplete);

      // Show success message
      showToast('Workout discarded successfully!', 'success');

      console.log('🗑️ Workout discarded successfully - banner should disappear automatically');

    } catch (error) {
      console.error('❌ Failed to discard workout:', error);
      showToast('Failed to discard workout. Please try again.', 'error');
    }
  };

  const handleDiscardCancel = () => {
    setShowDiscardModal(false);
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
              onClick={handleDiscardClick}
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

      {/* Discard Confirmation Modal */}
      <Modal
        isOpen={showDiscardModal}
        onClose={handleDiscardCancel}
        title="Discard Workout?"
        size="sm"
      >
        <div className="space-y-6">
          <div className="text-center">
            <AlertTriangle className="mx-auto mb-4 text-red-400" size={48} />
            <p className="text-white/80 mb-2">
              Are you sure you want to discard this workout?
            </p>
            <p className="text-white/60 text-sm">
              This will permanently delete all progress for <strong className="text-white">{incompleteWorkout?.routineName}</strong>.
              This action cannot be undone.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleDiscardCancel}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDiscardConfirm}
              variant="danger"
              className="flex-1"
            >
              Discard Workout
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
