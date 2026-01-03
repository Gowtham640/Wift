import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Workout, type WorkoutExercise, type Set } from '@/lib/db';
import type { WorkoutWithDetails, WorkoutExerciseWithDetails } from '@/lib/types';
import { calculateTotalVolume, getTodayString } from '@/lib/utils';

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

    // Check if there's already an incomplete workout for this routine on the selected date
    if (routineId) {
      const allWorkouts = await db.workouts.toArray();
      const existingWorkout = allWorkouts.find(workout =>
        workout.routineId === routineId &&
        workout.date === workoutDate &&
        workout.endTime === undefined
      );

      if (existingWorkout) {
        console.log('🔄 Found existing incomplete workout, reusing:', existingWorkout.id);
        return existingWorkout.id!;
      }
    }

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

        // Get previous best from last workout
        const previousWorkouts = await db.workouts
          .where('date')
          .below(workout.date)
          .reverse()
          .toArray();

        let previousBest = undefined;
        for (const prevWorkout of previousWorkouts) {
          const prevWe = await db.workout_exercises
            .where('workoutId')
            .equals(prevWorkout.id!)
            .and(wex => wex.exerciseId === we.exerciseId)
            .first();

          if (prevWe) {
            const prevSets = await db.sets
              .where('workoutExerciseId')
              .equals(prevWe.id!)
              .and(s => s.completed)
              .toArray();

            if (prevSets.length > 0) {
              const maxWeightSet = prevSets.reduce((max, set) =>
                set.weight > max.weight ? set : max
              );
              previousBest = {
                weight: maxWeightSet.weight,
                reps: maxWeightSet.reps
              };
              break;
            }
          }
        }

        return {
          workoutExercise: we,
          exercise: exercise!,
          sets,
          previousBest
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

  const addExerciseToWorkout = async (workoutId: number, exerciseId: number) => {
    const existingCount = await db.workout_exercises
      .where('workoutId')
      .equals(workoutId)
      .count();

    await db.workout_exercises.add({
      workoutId,
      exerciseId,
      order: existingCount
    });
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

