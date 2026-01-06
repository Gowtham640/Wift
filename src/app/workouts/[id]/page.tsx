'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useWorkout, useWorkouts } from '@/hooks/useWorkouts';
import { useRoutines, useRoutine } from '@/hooks/useRoutines';
import { useExercises } from '@/hooks/useExercises';
import { ArrowLeft, Check, Clock, Plus, Calendar } from 'lucide-react';
import Button from '@/components/ui/Button';
import ExerciseCard from '@/components/workout/ExerciseCard';
import GlassWidget from '@/components/ui/GlassWidget';
import Modal from '@/components/ui/Modal';
import { showToast } from '@/components/ui/Toast';
import { formatDuration, getTodayString } from '@/lib/utils';
import { db, type Workout } from '@/lib/db';

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
  // Note: We don't need refreshRoutine here since the workout page doesn't display routine data
  const [currentWorkoutId, setCurrentWorkoutId] = useState<number | null>(workoutId);
  const { workout, loading, completeWorkout, addExerciseToWorkout } = useWorkout(currentWorkoutId);
  const { addExerciseToRoutine } = useRoutine(workout?.workout.routineId || null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showUpdateRoutineModal, setShowUpdateRoutineModal] = useState(false);
  const [showDateSelectionModal, setShowDateSelectionModal] = useState(false);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [showAddExerciseToWorkoutModal, setShowAddExerciseToWorkoutModal] = useState(false);
  const [showEditWorkoutModal, setShowEditWorkoutModal] = useState(false);
  const [editWorkoutDate, setEditWorkoutDate] = useState('');
  const [editWorkoutDuration, setEditWorkoutDuration] = useState('');
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const { exercises: allExercises } = useExercises({ search: exerciseSearch });

  useEffect(() => {
    if (workoutId === null) {
      // Show date selection modal for new workouts
      setShowDateSelectionModal(true);
    }
  }, [workoutId]);

  const handleDateSelected = async () => {
    try {
      setShowDateSelectionModal(false);
      const id = await createWorkout(routineId ? parseInt(routineId) : undefined, selectedDate);

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
    console.log('🏁 WORKOUT COMPLETION: Starting workout completion process');
    console.log('🏁 WORKOUT COMPLETION: Current workout ID:', currentWorkoutId);
    console.log('🏁 WORKOUT COMPLETION: Workout data:', workout);

    if (!currentWorkoutId || !workout) {
      console.log('❌ WORKOUT COMPLETION: Missing workout data, aborting');
      return;
    }

    console.log('🔍 WORKOUT COMPLETION: Checking for routine changes...');
    // Check if there are changes that should update the routine
    const hasChanges = await checkForRoutineChanges();

    console.log('🔍 WORKOUT COMPLETION: Changes detected:', hasChanges);

    if (hasChanges) {
      console.log('💬 WORKOUT COMPLETION: Showing update routine modal');
      setShowUpdateRoutineModal(true);
    } else {
      console.log('✅ WORKOUT COMPLETION: No changes detected, completing workout normally');
      await completeWorkout(currentWorkoutId);
      console.log('✅ WORKOUT COMPLETION: Workout completed successfully, redirecting to dashboard');
      router.push('/');
    }
  };

  const checkForRoutineChanges = async (): Promise<boolean> => {
    console.log('🔍 ROUTINE CHECK: Starting routine change detection');

    if (!workout?.workout.routineId || !workout.exercises) {
      console.log('❌ ROUTINE CHECK: No routine ID or exercises found');
      return false;
    }

    console.log('📊 ROUTINE CHECK: Workout routine ID:', workout.workout.routineId);
    console.log('📊 ROUTINE CHECK: Workout has', workout.exercises.length, 'exercises');

    // Get original routine exercises
    console.log('🔍 ROUTINE CHECK: Fetching original routine exercises from database...');
    const originalExercises = await db.routine_exercises
      .where('routineId')
      .equals(workout.workout.routineId)
      .toArray();

    console.log('📊 ROUTINE CHECK: Found', originalExercises.length, 'routine exercises in database');

    // Check if the actual number of sets performed differs from stored targets
    console.log('🔍 ROUTINE CHECK: Comparing actual sets vs stored targets...');
    for (const workoutExercise of workout.exercises) {
      const routineExercise = originalExercises.find(re => re.exerciseId === workoutExercise.exercise.id);
      if (routineExercise) {
        const storedSets = routineExercise.targetSets || 1;
        const actualSets = workoutExercise.sets.length;
        console.log(`🔍 ROUTINE CHECK: Exercise "${workoutExercise.exercise.name}": Stored=${storedSets}, Actual=${actualSets}`);

        if (actualSets !== storedSets) {
          console.log(`✅ ROUTINE CHECK: Change detected for "${workoutExercise.exercise.name}": ${storedSets} → ${actualSets} sets`);
          return true; // Number of sets performed differs from stored target
        }
      } else {
        console.log(`⚠️ ROUTINE CHECK: Exercise "${workoutExercise.exercise.name}" not found in routine`);
      }
    }

    console.log('✅ ROUTINE CHECK: No changes detected');
    return false;
  };

  const handleUpdateRoutine = async () => {
    console.log('🔄 ROUTINE UPDATE: Starting routine update process');
    console.log('🔄 ROUTINE UPDATE: Current workout ID:', currentWorkoutId);
    console.log('🔄 ROUTINE UPDATE: Routine ID:', workout?.workout.routineId);

    if (!currentWorkoutId || !workout?.workout.routineId) {
      console.log('❌ ROUTINE UPDATE: Missing required data, aborting');
      showToast('Failed to update routine - missing data', 'error');
      return;
    }

    try {
      console.log('🔍 ROUTINE UPDATE: Fetching original routine exercises...');
      // Get original routine exercises
      const originalExercises = await db.routine_exercises
        .where('routineId')
        .equals(workout.workout.routineId)
        .toArray();

      console.log('📊 ROUTINE UPDATE: Found', originalExercises.length, 'routine exercises');
      console.log('📝 ROUTINE UPDATE: Processing', workout.exercises.length, 'workout exercises');

      // Update stored set counts to match what was actually performed
      let updatedCount = 0;
      for (const workoutExercise of workout.exercises) {
        const routineExercise = originalExercises.find(re => re.exerciseId === workoutExercise.exercise.id);
        if (routineExercise) {
          const actualSetsPerformed = workoutExercise.sets.length;
          const oldSets = routineExercise.targetSets || 1;

          console.log(`🔄 ROUTINE UPDATE: Preparing to update "${workoutExercise.exercise.name}": ${oldSets} → ${actualSetsPerformed} sets`);
          console.log(`🔄 ROUTINE UPDATE: Routine exercise ID: ${routineExercise.id}, Exercise ID: ${routineExercise.exerciseId}`);

          try {
            console.log(`🔄 ROUTINE UPDATE: Routine exercise ID type:`, typeof routineExercise.id, `value:`, routineExercise.id);

            // Verify the record exists before updating
            const existingRecord = await db.routine_exercises.get(routineExercise.id!);
            console.log(`🔄 ROUTINE UPDATE: Found existing record:`, existingRecord);

            if (existingRecord) {
              console.log(`🔄 ROUTINE UPDATE: About to call update with ID: ${routineExercise.id}, targetSets: ${actualSetsPerformed}`);
              const updateResult = await db.routine_exercises.update(routineExercise.id!, {
                targetSets: actualSetsPerformed
              });
              console.log(`🔄 ROUTINE UPDATE: Update result for ${routineExercise.id}:`, updateResult, `(should be 1 if successful)`);

              // If update didn't work, try put as fallback
              if (updateResult !== 1) {
                console.log(`⚠️ ROUTINE UPDATE: Update returned ${updateResult}, trying put as fallback`);
                const putResult = await db.routine_exercises.put({
                  ...existingRecord,
                  targetSets: actualSetsPerformed
                });
                console.log(`🔄 ROUTINE UPDATE: Put result:`, putResult);
              }

              // Verify the update worked
              const updatedRecord = await db.routine_exercises.get(routineExercise.id!);
              console.log(`🔄 ROUTINE UPDATE: Record after update:`, updatedRecord);

              if (updatedRecord && updatedRecord.targetSets === actualSetsPerformed) {
                console.log(`✅ ROUTINE UPDATE: Successfully updated "${workoutExercise.exercise.name}" to ${actualSetsPerformed} sets`);
                updatedCount++;
              } else {
                console.log(`❌ ROUTINE UPDATE: Update verification failed for "${workoutExercise.exercise.name}"`);
              }
            } else {
              console.log(`❌ ROUTINE UPDATE: Record not found for update: ${routineExercise.id}`);
            }
          } catch (updateError) {
            console.error(`❌ ROUTINE UPDATE: Error updating "${workoutExercise.exercise.name}":`, updateError);
          }
        } else {
          console.log(`⚠️ ROUTINE UPDATE: Exercise "${workoutExercise.exercise.name}" not found in routine, skipping`);
        }
      }

      console.log(`✅ ROUTINE UPDATE: Successfully updated ${updatedCount} exercises`);

      // Final verification - check all routine exercises after updates
      console.log('🔍 ROUTINE UPDATE: Final verification of all routine exercises...');
      const finalExercises = await db.routine_exercises
        .where('routineId')
        .equals(workout.workout.routineId)
        .toArray();

      finalExercises.forEach(exercise => {
        console.log(`🔍 ROUTINE UPDATE: Final state - Exercise ID ${exercise.exerciseId}: ${exercise.targetSets} sets`);
      });

      console.log('🏁 ROUTINE UPDATE: Completing workout...');

      // Complete the workout
      await completeWorkout(currentWorkoutId);
      console.log('✅ ROUTINE UPDATE: Workout completed, redirecting to dashboard');

      showToast(`Routine updated successfully! Updated ${updatedCount} exercises.`, 'success');
      router.push('/');
    } catch (error) {
      console.error('❌ ROUTINE UPDATE: Failed to update routine:', error);
      showToast('Failed to update routine - check console for details', 'error');
    }
  };

  const handleCompleteWithoutUpdate = async () => {
    console.log('🏁 WORKOUT COMPLETION: User chose not to update routine, completing workout normally');

    if (currentWorkoutId) {
      console.log('🏁 WORKOUT COMPLETION: Completing workout without routine update...');
      await completeWorkout(currentWorkoutId);
      console.log('✅ WORKOUT COMPLETION: Workout completed successfully');
      showToast('Workout completed successfully!', 'success');
      router.push('/');
    } else {
      console.log('❌ WORKOUT COMPLETION: No workout ID found');
      showToast('Failed to complete workout', 'error');
    }
  };

  const handleAddExerciseToRoutine = async (exerciseId: number) => {
    if (!workout?.workout.routineId) {
      showToast('Cannot add exercise - no routine selected', 'error');
      return;
    }

    try {
      await addExerciseToRoutine(workout.workout.routineId, exerciseId, 3, 8); // Default 3 sets, 8 reps
      showToast('Exercise added to routine!', 'success');
      setShowAddExerciseModal(false);
    } catch (error) {
      console.error('Failed to add exercise to routine:', error);
      showToast('Failed to add exercise to routine', 'error');
    }
  };

  const handleAddExerciseToWorkout = async (exerciseId: number) => {
    if (!currentWorkoutId) {
      showToast('Cannot add exercise - no workout selected', 'error');
      return;
    }

    try {
      await addExerciseToWorkout(currentWorkoutId, exerciseId);
      showToast('Exercise added to workout!', 'success');
      setShowAddExerciseToWorkoutModal(false);
    } catch (error) {
      console.error('Failed to add exercise to workout:', error);
      showToast('Failed to add exercise to workout', 'error');
    }
  };

  const handleSaveWorkoutEdits = async () => {
    if (!currentWorkoutId) return;

    try {
      const updates: Partial<Workout> = {};

      // Update date if changed
      if (editWorkoutDate && editWorkoutDate !== workout!.workout.date) {
        updates.date = editWorkoutDate;
      }

      // Update duration if provided
      if (editWorkoutDuration) {
        const durationMs = parseDurationString(editWorkoutDuration);
        updates.endTime = workout!.workout.startTime + durationMs;
      }

      if (Object.keys(updates).length > 0) {
        await db.workouts.update(currentWorkoutId, updates);
        setShowEditWorkoutModal(false);
        showToast('Workout updated!', 'success');
        // Force a page refresh to show updated data
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to update workout:', error);
      showToast('Failed to update workout', 'error');
    }
  };

  const parseDurationString = (durationStr: string): number => {
    // Simple parser for formats like "45m", "1h 30m", "90"
    const hours = durationStr.match(/(\d+)h/);
    const minutes = durationStr.match(/(\d+)m/);
    const plainMinutes = durationStr.match(/^(\d+)$/);

    let totalMs = 0;

    if (hours) totalMs += parseInt(hours[1]) * 60 * 60 * 1000;
    if (minutes) totalMs += parseInt(minutes[1]) * 60 * 1000;
    if (plainMinutes && !hours && !minutes) totalMs += parseInt(plainMinutes[1]) * 60 * 1000;

    return totalMs;
  };

  return (
    <div className="space-y-4 md:space-y-6 w-full">
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
                      <span
                        className={isCompleted ? 'cursor-pointer hover:text-white/80' : ''}
                        onClick={() => {
                          if (isCompleted) {
                            setEditWorkoutDate(workout.workout.date);
                            setEditWorkoutDuration('45m');
                            setShowEditWorkoutModal(true);
                          }
                        }}
                      >
                        {formatDuration(workout.duration || elapsedTime)}
                        {isCompleted && <span className="ml-1 text-xs">✏️</span>}
                      </span>
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

              {/* Add Exercise to Workout (for completed workouts) */}
              {isCompleted && (
                <GlassWidget className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">Add Exercise</h3>
                      <p className="text-sm text-white/60">Add exercises to this completed workout</p>
                    </div>
                    <Button onClick={() => setShowAddExerciseToWorkoutModal(true)} className="px-4 py-2">
                      <Plus size={16} />
                      Add Exercise
                    </Button>
                  </div>
                </GlassWidget>
              )}

              {/* Add Exercise to Routine */}
              {workout.routine && (
                <GlassWidget className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">Add to Routine</h3>
                      <p className="text-sm text-white/60">Add exercises to your routine permanently</p>
                    </div>
                    <Button onClick={() => setShowAddExerciseModal(true)} className="px-4 py-2">
                      <Plus size={16} />
                      Add Exercise
                    </Button>
                  </div>
                </GlassWidget>
              )}
            </div>
          </>
        );
      })()}

      <Modal
        isOpen={showUpdateRoutineModal}
        onClose={() => {
          console.log('💬 MODAL: User closed update routine modal without action');
          setShowUpdateRoutineModal(false);
        }}
        title="Update Routine?"
      >
        <div className="space-y-4">
          <p className="text-white/80">
            You have added exercises or sets to this workout. Would you like to update the routine to include these changes?
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => {
                console.log('💬 MODAL: User clicked "Yes, Update Routine"');
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
                console.log('💬 MODAL: User clicked "No, Just Complete"');
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

      {/* Edit Workout Modal */}
      <Modal
        isOpen={showEditWorkoutModal}
        onClose={() => setShowEditWorkoutModal(false)}
        title="Edit Workout"
      >
        <div className="space-y-6">
          <div className="text-center">
            <Calendar className="mx-auto mb-4 text-blue-400" size={48} />
            <p className="text-white/80 mb-4">
              Modify workout date and duration
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Workout Date
              </label>
              <input
                type="date"
                value={editWorkoutDate}
                onChange={(e) => setEditWorkoutDate(e.target.value)}
                max={getTodayString()}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Duration (e.g., 45m, 1h 30m)
              </label>
              <input
                type="text"
                value={editWorkoutDuration}
                onChange={(e) => setEditWorkoutDuration(e.target.value)}
                placeholder="45m"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => setShowEditWorkoutModal(false)}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveWorkoutEdits}
              className="flex-1"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Date Selection Modal */}
      <Modal
        isOpen={showDateSelectionModal}
        onClose={() => router.push('/')}
        title="Select Workout Date"
      >
        <div className="space-y-6">
          <div className="text-center">
            <Calendar className="mx-auto mb-4 text-blue-400" size={48} />
            <p className="text-white/80 mb-4">
              When did you perform this workout?
            </p>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-white/80">
              Workout Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={getTodayString()} // Don't allow future dates
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => router.push('/')}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDateSelected}
              className="flex-1"
            >
              Start Workout
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Exercise to Workout Modal */}
      <Modal
        isOpen={showAddExerciseToWorkoutModal}
        onClose={() => {
          setShowAddExerciseToWorkoutModal(false);
          setExerciseSearch('');
        }}
        title="Add Exercise to Workout"
      >
        <div className="space-y-4">
          <p className="text-white/80 mb-4">
            Select an exercise to add to this workout.
          </p>

          <input
            type="text"
            value={exerciseSearch}
            onChange={(e) => setExerciseSearch(e.target.value)}
            placeholder="Search exercises..."
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <div className="max-h-96 overflow-y-auto space-y-2">
            {allExercises?.map((exercise) => (
              <button
                key={exercise.id}
                onClick={() => handleAddExerciseToWorkout(exercise.id!)}
                className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-lg text-left transition-colors"
              >
                <div className="font-medium text-white">{exercise.name}</div>
                <div className="text-sm text-white/60">{exercise.muscleGroup}</div>
              </button>
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => {
                setShowAddExerciseToWorkoutModal(false);
                setExerciseSearch('');
              }}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Exercise to Routine Modal */}
      <Modal
        isOpen={showAddExerciseModal}
        onClose={() => {
          setShowAddExerciseModal(false);
          setExerciseSearch('');
        }}
        title="Add Exercise to Routine"
      >
        <div className="space-y-4">
          <p className="text-white/80 mb-4">
            Select an exercise to add to your routine permanently.
          </p>

          <input
            type="text"
            value={exerciseSearch}
            onChange={(e) => setExerciseSearch(e.target.value)}
            placeholder="Search exercises..."
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <div className="max-h-96 overflow-y-auto space-y-2">
            {allExercises?.map((exercise) => (
              <button
                key={exercise.id}
                onClick={() => handleAddExerciseToRoutine(exercise.id!)}
                className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-lg text-left transition-colors"
              >
                <div className="font-medium text-white">{exercise.name}</div>
                <div className="text-sm text-white/60">{exercise.muscleGroup}</div>
              </button>
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => {
                setShowAddExerciseModal(false);
                setExerciseSearch('');
              }}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Invisible spacer to push content above BottomNav overlay */}
      <div className="h-20 md:hidden" aria-hidden="true" />
    </div>
  );
}

