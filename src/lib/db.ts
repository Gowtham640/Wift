import Dexie, { type EntityTable } from 'dexie';

export interface Profile {
  id: number;
  name: string;
  heightCm: number;
  weightKg: number;
  bodyFatPercent?: number;
  birthYear?: number;
  sex?: 'M' | 'F';
  updatedAt: number;
}

export interface Exercise {
  id?: number;
  name: string;
  muscleGroup: string;
  subMuscleGroup?: string;
  equipment?: string;
  aliases?: string[];
  isCustom: boolean;
}

export interface Routine {
  id?: number;
  name: string;
  notes?: string;
  createdAt: number;
}

export interface RoutineExercise {
  id?: number;
  routineId: number;
  exerciseId: number;
  order: number;
  targetSets?: number;
  targetReps?: number;
}

export interface Workout {
  id?: number;
  routineId?: number;
  date: string;
  startTime: number;
  endTime?: number;
  notes?: string;
}

export interface WorkoutExercise {
  id?: number;
  workoutId: number;
  exerciseId: number;
  order: number;
}

export interface Set {
  id?: number;
  workoutExerciseId: number;
  reps: number;
  weight: number;
  rir?: number;
  completed: boolean;
}

export interface WeightEntry {
  id?: number;
  weight: number;
  date: string; // IST date string
  createdAt: number; // IST timestamp
}

export interface WidgetSettings {
  id: string;
  glowColor: string;
  updatedAt: number;
}

const db = new Dexie('GymTrackerDB') as Dexie & {
  profiles: EntityTable<Profile, 'id'>;
  exercises: EntityTable<Exercise, 'id'>;
  routines: EntityTable<Routine, 'id'>;
  routine_exercises: EntityTable<RoutineExercise, 'id'>;
  workouts: EntityTable<Workout, 'id'>;
  workout_exercises: EntityTable<WorkoutExercise, 'id'>;
  sets: EntityTable<Set, 'id'>;
  weight_entries: EntityTable<WeightEntry, 'id'>;
  widget_settings: EntityTable<WidgetSettings, 'id'>;
};

db.version(1).stores({
  profiles: '++id, name, updatedAt',
  exercises: '++id, name, muscleGroup, equipment, isCustom',
  routines: '++id, name, createdAt',
  routine_exercises: '++id, routineId, exerciseId, order',
  workouts: '++id, routineId, date, startTime',
  workout_exercises: '++id, workoutId, exerciseId, order',
  sets: '++id, workoutExerciseId, completed',
  widget_settings: 'id, updatedAt'
});

db.version(2).stores({
  profiles: '++id, name, updatedAt',
  exercises: '++id, name, muscleGroup, equipment, isCustom',
  routines: '++id, name, createdAt',
  routine_exercises: '++id, routineId, exerciseId, order, targetSets, targetReps',
  workouts: '++id, routineId, date, startTime',
  workout_exercises: '++id, workoutId, exerciseId, order',
  sets: '++id, workoutExerciseId, completed',
  widget_settings: 'id, updatedAt'
}).upgrade(async (tx) => {
  // Add default values for existing routine exercises
  await tx.table('routine_exercises').toCollection().modify((routineExercise: any) => {
    if (routineExercise.targetSets === undefined) {
      routineExercise.targetSets = 1; // Default to 1 set
    }
    if (routineExercise.targetReps === undefined) {
      routineExercise.targetReps = 8; // Default to 8 reps
    }
  });
});

db.version(3).stores({
  profiles: '++id, name, updatedAt',
  exercises: '++id, name, muscleGroup, equipment, isCustom',
  routines: '++id, name, createdAt',
  routine_exercises: '++id, routineId, exerciseId, order, targetSets, targetReps',
  workouts: '++id, routineId, date, startTime',
  workout_exercises: '++id, workoutId, exerciseId, order',
  sets: '++id, workoutExerciseId, completed',
  weight_entries: '++id, date, weight, createdAt',
  widget_settings: 'id, updatedAt'
});

export { db };


