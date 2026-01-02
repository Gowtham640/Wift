import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Exercise } from '@/lib/db';

export function useExercises(filters?: {
  muscleGroup?: string;
  equipment?: string;
  search?: string;
}) {
  const exercises = useLiveQuery(async () => {
    let query = db.exercises.toCollection();

    if (filters?.muscleGroup) {
      query = db.exercises.where('muscleGroup').equals(filters.muscleGroup);
    }

    let results = await query.toArray();

    if (filters?.equipment) {
      results = results.filter(ex => ex.equipment === filters.equipment);
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      results = results.filter(ex => 
        ex.name.toLowerCase().includes(searchLower)
      );
    }

    return results;
  }, [filters?.muscleGroup, filters?.equipment, filters?.search]);

  const addExercise = async (exercise: Omit<Exercise, 'id'>) => {
    return await db.exercises.add(exercise);
  };

  const updateExercise = async (id: number, updates: Partial<Exercise>) => {
    await db.exercises.update(id, updates);
  };

  const deleteExercise = async (id: number) => {
    // Delete related routine exercises first
    await db.routine_exercises.where('exerciseId').equals(id).delete();
    await db.exercises.delete(id);
  };

  const bulkAddExercises = async (exercises: Omit<Exercise, 'id'>[]) => {
    return await db.exercises.bulkAdd(exercises);
  };

  const deleteAllExercises = async () => {
    // Delete all routine exercises first
    await db.routine_exercises.clear();
    // Delete all exercises
    await db.exercises.clear();
  };

  return {
    exercises,
    addExercise,
    updateExercise,
    deleteExercise,
    bulkAddExercises,
    deleteAllExercises
  };
}

export function useExercise(id: number | null) {
  const exercise = useLiveQuery(() => id ? db.exercises.get(id) : undefined, [id]);
  return {
    exercise,
    loading: exercise === undefined
  };
}

