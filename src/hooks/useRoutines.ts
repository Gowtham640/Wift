import { useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Routine, type RoutineExercise } from '@/lib/db';
import type { RoutineWithExercises } from '@/lib/types';

export function useRoutines(search?: string) {
  const routines = useLiveQuery(async () => {
    let results = await db.routines.orderBy('createdAt').reverse().toArray();

    if (search) {
      const searchLower = search.toLowerCase();
      results = results.filter(r => r.name.toLowerCase().includes(searchLower));
    }

    // Get exercise counts
    const routinesWithCounts = await Promise.all(
      results.map(async (routine) => {
        const exerciseCount = await db.routine_exercises
          .where('routineId')
          .equals(routine.id!)
          .count();
        
        return {
          ...routine,
          exerciseCount
        };
      })
    );

    return routinesWithCounts;
  }, [search]);

  const addRoutine = async (routine: Omit<Routine, 'id' | 'createdAt'>) => {
    return await db.routines.add({
      ...routine,
      createdAt: Date.now()
    });
  };

  const updateRoutine = async (id: number, updates: Partial<Routine>) => {
    await db.routines.update(id, updates);
  };

  const deleteRoutine = async (id: number) => {
    await db.routine_exercises.where('routineId').equals(id).delete();
    await db.routines.delete(id);
  };

  return {
    routines,
    addRoutine,
    updateRoutine,
    deleteRoutine
  };
}

export function useRoutine(id: number | null) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const routine = useLiveQuery(async () => {
    if (id === null) return null;

    console.log(`🔄 ROUTINE QUERY: Fetching routine ${id} (trigger: ${refreshTrigger})`);

    const routine = await db.routines.get(id);
    if (!routine) return null;

    const routineExercises = await db.routine_exercises
      .where('routineId')
      .equals(id)
      .sortBy('order');

    const exercises = await Promise.all(
      routineExercises.map(re => db.exercises.get(re.exerciseId))
    );

    const result: RoutineWithExercises = {
      routine,
      exercises: exercises.filter(e => e !== undefined),
      routineExercises,
      exerciseCount: exercises.length
    };

    console.log(`✅ ROUTINE QUERY: Loaded ${result.exerciseCount} exercises for routine ${id}`);
    result.routineExercises.forEach((re, index) => {
      console.log(`   - Exercise ${index + 1}: ${result.exercises[index]?.name} → ${re.targetSets} sets`);
    });

    return result;
  }, [id, refreshTrigger]);

  // Function to trigger a refresh of the routine data
  const refreshRoutine = useCallback(() => {
    const newTrigger = refreshTrigger + 1;
    console.log(`🔄 ROUTINE REFRESH: Triggering refresh for routine ${id} (trigger: ${refreshTrigger} → ${newTrigger})`);
    setRefreshTrigger(newTrigger);
  }, [id, refreshTrigger]);

  const addExerciseToRoutine = async (routineId: number, exerciseId: number, targetSets?: number, targetReps?: number) => {
    console.log(`➕ ROUTINE CREATION: Adding exercise ${exerciseId} to routine ${routineId} with ${targetSets || 1} sets`);

    const existingCount = await db.routine_exercises
      .where('routineId')
      .equals(routineId)
      .count();

    console.log(`➕ ROUTINE CREATION: Exercise will be at order position ${existingCount}`);

    await db.routine_exercises.add({
      routineId,
      exerciseId,
      order: existingCount,
      targetSets: targetSets || 1, // Default to 1 set
      targetReps: targetReps || 8  // Default to 8 reps
    });

    console.log(`✅ ROUTINE CREATION: Successfully added exercise ${exerciseId} to routine ${routineId}`);
  };

  const removeExerciseFromRoutine = async (routineExerciseId: number) => {
    await db.routine_exercises.delete(routineExerciseId);
  };

  const reorderExercises = async (routineId: number, exerciseIds: number[]) => {
    const routineExercises = await db.routine_exercises
      .where('routineId')
      .equals(routineId)
      .toArray();

    await Promise.all(
      routineExercises.map((re, index) => {
        const newOrder = exerciseIds.indexOf(re.exerciseId);
        if (newOrder !== -1 && newOrder !== re.order) {
          return db.routine_exercises.update(re.id!, { order: newOrder });
        }
      })
    );
  };

  return {
    routine,
    loading: routine === undefined,
    addExerciseToRoutine,
    removeExerciseFromRoutine,
    reorderExercises,
    refreshRoutine
  };
}

