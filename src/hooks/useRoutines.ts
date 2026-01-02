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
  const routine = useLiveQuery(async () => {
    if (id === null) return null;

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

    return result;
  }, [id]);

  const addExerciseToRoutine = async (routineId: number, exerciseId: number) => {
    const existingCount = await db.routine_exercises
      .where('routineId')
      .equals(routineId)
      .count();

    await db.routine_exercises.add({
      routineId,
      exerciseId,
      order: existingCount
    });
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
    reorderExercises
  };
}

