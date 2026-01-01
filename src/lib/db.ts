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
  equipment?: string;
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

export { db };

