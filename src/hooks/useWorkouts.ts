import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Workout, type WorkoutExercise, type Set } from '@/lib/db';
import type { WorkoutWithDetails, WorkoutExerciseWithDetails } from '@/lib/types';
import { calculateTotalVolume, getTodayString } from '@/lib/utils';
import { useSettings } from './useSettings';

const cleanupIncompleteWorkouts = async () => {
  try {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000); // More aggressive cleanup - 7 days

    const allWorkouts = await db.workouts.toArray();
    const oldIncompleteWorkouts = allWorkouts.filter(workout =>
      workout.endTime === undefined && workout.startTime < oneWeekAgo
    );

    if (oldIncompleteWorkouts.length > 0) {
      console.log(`🧹 Cleaning up ${oldIncompleteWorkouts.length} old incomplete workouts`);

      for (const workout of oldIncompleteWorkouts) {
        // Delete associated data first
        const workoutExercises = await db.workout_exercises
          .where('workoutId').equals(workout.id!)
          .toArray();

        await Promise.all(
          workoutExercises.map(async (we) => {
            await db.sets.where('workoutExerciseId').equals(we.id!).delete();
            await db.workout_exercises.delete(we.id!);
          })
        );

        await db.workouts.delete(workout.id!);
      }
    }
  } catch (error) {
    console.error('Failed to cleanup incomplete workouts:', error);
  }
};

export function useWorkouts() {
  // Clean up incomplete workouts on first load
  useLiveQuery(async () => {
    await cleanupIncompleteWorkouts();
    return null; // This query doesn't return data
  });

  const workouts = useLiveQuery(async () => {
    // Only show completed workouts in history
    const allWorkouts = await db.workouts.toArray();
    return allWorkouts
      .filter(workout => workout.endTime !== undefined)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  const createWorkout = async (routineId?: number, customDate?: string) => {
    const workoutDate = customDate || getTodayString();

    // FIRST: Check for ANY incomplete workout (not just same routine/date)
    const allWorkouts = await db.workouts.toArray();
    const incompleteWorkouts = allWorkouts.filter(workout => workout.endTime === undefined);

    if (incompleteWorkouts.length > 0) {
      console.log('⚠️ Found', incompleteWorkouts.length, 'incomplete workout(s). Discarding them to ensure only one active workout.');

      // Delete all incomplete workouts and their associated data
      for (const workout of incompleteWorkouts) {
        console.log('🗑️ Discarding incomplete workout:', workout.id);

        // Delete associated workout exercises and sets
        const workoutExercises = await db.workout_exercises
          .where('workoutId')
          .equals(workout.id!)
          .toArray();

        await Promise.all(
          workoutExercises.map(async (we) => {
            await db.sets.where('workoutExerciseId').equals(we.id!).delete();
          })
        );

        await db.workout_exercises
          .where('workoutId')
          .equals(workout.id!)
          .delete();

        await db.workouts.delete(workout.id!);
      }

      console.log('✅ All incomplete workouts discarded. Proceeding with new workout creation.');
    }

    // Continue with normal workout creation...

    const workoutId = await db.workouts.add({
      routineId,
      date: workoutDate,
      startTime: Date.now()
    });

    if (routineId) {
      console.log('🏗️ WORKOUT CREATION: Creating workout from routine ID:', routineId);

      const routineExercises = await db.routine_exercises
        .where('routineId')
        .equals(routineId)
        .sortBy('order');

      console.log('🏗️ WORKOUT CREATION: Found', routineExercises.length, 'exercises in routine');

      // Create workout exercises and initial sets based on routine targets
      await Promise.all(
        routineExercises.map(async (re) => {
          console.log(`🏗️ WORKOUT CREATION: Creating workout exercise for routine exercise ID ${re.id} (${re.targetSets || 1} sets)`);

          const workoutExerciseId = await db.workout_exercises.add({
            workoutId: Number(workoutId),
            exerciseId: re.exerciseId,
            order: re.order
          });

          // Create the target number of sets for this exercise
          const targetSets = re.targetSets || 1;
          console.log(`🏗️ WORKOUT CREATION: Creating ${targetSets} initial sets for workout exercise ${workoutExerciseId}`);

          await Promise.all(
            Array.from({ length: targetSets }, () =>
              db.sets.add({
                workoutExerciseId: Number(workoutExerciseId),
                weight: 0,
                reps: 0,
                completed: false
              })
            )
          );

          console.log(`✅ WORKOUT CREATION: Created ${targetSets} sets for workout exercise ${workoutExerciseId}`);
        })
      );

      console.log('✅ WORKOUT CREATION: Routine workout created successfully');
    }

    return workoutId;
  };

  const updateWorkout = async (id: number, updates: Partial<Workout>) => {
    await db.workouts.update(id, updates);
    // Force reactivity for live queries
    await db.workouts.count();
  };

  const deleteWorkout = async (id: number) => {
    const workoutExercises = await db.workout_exercises
      .where('workoutId')
      .equals(id)
      .toArray();

    await Promise.all(
      workoutExercises.map(async (we) => {
        await db.sets.where('workoutExerciseId').equals(we.id!).delete();
      })
    );

    await db.workout_exercises.where('workoutId').equals(id).delete();
    await db.workouts.delete(id);

    // Force analytics reactivity
    await db.workouts.count(); // Trigger live query updates

    console.log('🗑️ Workout deleted, analytics should update');
  };

  return {
    workouts,
    createWorkout,
    updateWorkout,
    deleteWorkout
  };
}

export function useWorkout(id: number | null) {
  const { settings } = useSettings();

  const workout = useLiveQuery(async () => {
    if (id === null) return null;

    // Add retry logic for race conditions
    let attempts = 0;
    let workout = null;

    while (attempts < 5 && !workout) {
      workout = await db.workouts.get(id);
      if (!workout) {
        // Wait and retry
        await new Promise(resolve => setTimeout(resolve, 50));
        attempts++;
      }
    }

    if (!workout) return null;

    const routine = workout.routineId
      ? await db.routines.get(workout.routineId)
      : undefined;

    const workoutExercises = await db.workout_exercises
      .where('workoutId')
      .equals(id)
      .sortBy('order');

    const exercisesWithDetails: WorkoutExerciseWithDetails[] = await Promise.all(
      workoutExercises.map(async (we) => {
        const exercise = await db.exercises.get(we.exerciseId);
        const sets = await db.sets
          .where('workoutExerciseId')
          .equals(we.id!)
          .toArray();

        // Get previous sets based on settings
        let previousSets: Set[] = [];
        const previousDataType = settings?.previousDataType || 'routine_best';

        if (previousDataType === 'routine_last' || previousDataType === 'routine_best') {
          // Routine-specific logic
          const routineWorkouts = await db.workouts
            .where('date')
            .below(workout.date)
            .and(w => w.routineId === workout.routineId)
            .reverse()
            .toArray();

          if (previousDataType === 'routine_last') {
            // Find the most recent workout with this exercise
            for (const prevWorkout of routineWorkouts) {
              const prevWe = await db.workout_exercises
                .where('workoutId')
                .equals(prevWorkout.id!)
                .and(wex => wex.exerciseId === we.exerciseId)
                .first();

              if (prevWe) {
                const prevSetsData = await db.sets
                  .where('workoutExerciseId')
                  .equals(prevWe.id!)
                  .and(s => s.completed)
                  .toArray();

                if (prevSetsData.length > 0) {
                  previousSets = prevSetsData;
                  break; // Found the most recent workout with this exercise
                }
              }
            }
          } else {
            // routine_best: Find the workout with the highest total volume for this exercise
            let bestVolume = 0;
            let bestSets: Set[] = [];

            for (const prevWorkout of routineWorkouts) {
              const prevWe = await db.workout_exercises
                .where('workoutId')
                .equals(prevWorkout.id!)
                .and(wex => wex.exerciseId === we.exerciseId)
                .first();

              if (prevWe) {
                const prevSetsData = await db.sets
                  .where('workoutExerciseId')
                  .equals(prevWe.id!)
                  .and(s => s.completed)
                  .toArray();

                if (prevSetsData.length > 0) {
                  const totalVolume = prevSetsData.reduce((sum, set) => sum + (set.weight * set.reps), 0);
                  if (totalVolume > bestVolume) {
                    bestVolume = totalVolume;
                    bestSets = prevSetsData;
                  }
                }
              }
            }
            previousSets = bestSets;
          }
        } else {
          // Exercise-wide logic (across all routines)
          const allPreviousWorkouts = await db.workouts
            .where('date')
            .below(workout.date)
            .reverse()
            .sortBy('date');

          if (previousDataType === 'exercise_last') {
            // Find the most recent workout with this exercise
            for (const prevWorkout of allPreviousWorkouts) {
              const prevWe = await db.workout_exercises
                .where('workoutId')
                .equals(prevWorkout.id!)
                .and(wex => wex.exerciseId === we.exerciseId)
                .first();

              if (prevWe) {
                const prevSetsData = await db.sets
                  .where('workoutExerciseId')
                  .equals(prevWe.id!)
                  .and(s => s.completed)
                  .toArray();

                if (prevSetsData.length > 0) {
                  previousSets = prevSetsData;
                  break; // Found the most recent workout with this exercise
                }
              }
            }
          } else {
            // exercise_best: Find the workout with the highest total volume for this exercise
            let bestVolume = 0;
            let bestSets: Set[] = [];

            for (const prevWorkout of allPreviousWorkouts) {
              const prevWe = await db.workout_exercises
                .where('workoutId')
                .equals(prevWorkout.id!)
                .and(wex => wex.exerciseId === we.exerciseId)
                .first();

              if (prevWe) {
                const prevSetsData = await db.sets
                  .where('workoutExerciseId')
                  .equals(prevWe.id!)
                  .and(s => s.completed)
                  .toArray();

                if (prevSetsData.length > 0) {
                  const totalVolume = prevSetsData.reduce((sum, set) => sum + (set.weight * set.reps), 0);
                  if (totalVolume > bestVolume) {
                    bestVolume = totalVolume;
                    bestSets = prevSetsData;
                  }
                }
              }
            }
            previousSets = bestSets;
          }
        }

        return {
          workoutExercise: we,
          exercise: exercise!,
          sets,
          previousSets
        };
      })
    );

    const totalVolume = exercisesWithDetails.reduce(
      (sum, ex) => sum + calculateTotalVolume(ex.sets),
      0
    );

    const result: WorkoutWithDetails = {
      workout,
      routine,
      exercises: exercisesWithDetails,
      totalVolume,
      duration: workout.endTime ? workout.endTime - workout.startTime : undefined
    };

    return result;
  }, [id]);

  const addExerciseToWorkout = async (workoutId: number, exerciseId: number, defaultSets: number = 3) => {
    const existingCount = await db.workout_exercises
      .where('workoutId')
      .equals(workoutId)
      .count();

    const workoutExerciseId = await db.workout_exercises.add({
      workoutId,
      exerciseId,
      order: existingCount
    });

    // Create default sets for the new exercise
    console.log(`🏗️ ADDING EXERCISE: Creating ${defaultSets} sets for workout exercise ${workoutExerciseId}`);

    await Promise.all(
      Array.from({ length: defaultSets }, () =>
        db.sets.add({
          workoutExerciseId: Number(workoutExerciseId),
          weight: 0,
          reps: 0,
          completed: false
        })
      )
    );

    console.log(`✅ ADDING EXERCISE: Created ${defaultSets} sets for workout exercise ${workoutExerciseId}`);
  };

  const completeWorkout = async (workoutId: number) => {
    await db.workouts.update(workoutId, {
      endTime: Date.now()
    });
  };

  return {
    workout,
    loading: workout === undefined,
    addExerciseToWorkout,
    completeWorkout
  };
}

export function useSets(workoutExerciseId: number) {
  const sets = useLiveQuery(
    () => db.sets.where('workoutExerciseId').equals(workoutExerciseId).toArray(),
    [workoutExerciseId]
  );

  const addSet = async (workoutExerciseId: number, defaultValues?: { weight: number; reps: number }) => {
    await db.sets.add({
      workoutExerciseId,
      weight: defaultValues?.weight || 0,
      reps: defaultValues?.reps || 0,
      completed: false
    });
  };

  const updateSet = async (id: number, updates: Partial<Set>) => {
    await db.sets.update(id, updates);
  };

  const deleteSet = async (id: number) => {
    await db.sets.delete(id);
  };

  return {
    sets,
    addSet,
    updateSet,
    deleteSet
  };
}

