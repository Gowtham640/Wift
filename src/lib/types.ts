import type {
  Profile,
  Exercise,
  Routine,
  RoutineExercise,
  Workout,
  WorkoutExercise,
  Set,
  WidgetSettings
} from './db';

export type {
  Profile,
  Exercise,
  Routine,
  RoutineExercise,
  Workout,
  WorkoutExercise,
  Set,
  WidgetSettings
};

export interface ExerciseWithDetails extends Exercise {
  sets?: Set[];
  volume?: number;
  volumeIncrease?: number;
}

export interface WorkoutExerciseWithDetails {
  workoutExercise: WorkoutExercise;
  exercise: Exercise;
  sets: Set[];
  previousSets: Set[];
}

export interface RoutineWithExercises {
  routine: Routine;
  exercises: Exercise[];
  routineExercises: RoutineExercise[];
  exerciseCount: number;
}

export interface WorkoutWithDetails {
  workout: Workout;
  routine?: Routine;
  exercises: WorkoutExerciseWithDetails[];
  totalVolume: number;
  duration?: number;
}

export interface MuscleGroupVolume {
  muscleGroup: string;
  volume: number;
  percentage: number;
}

export interface ExerciseHistory {
  date: string;
  sets: Set[];
  totalVolume: number;
  maxWeight: number;
  routineName: string;
}

export const MUSCLE_GROUPS = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Legs',
  'Core',
  'Glutes',
  'Calves',
  'Forearms'
] as const;

export const EQUIPMENT_TYPES = [
  'Barbell',
  'Dumbbell',
  'Machine',
  'Cable',
  'Bodyweight',
  'Resistance Band',
  'Other'
] as const;

export const DEFAULT_GLOW_COLORS = [
  { name: 'White', value: '#ffffff' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Cyan', value: '#06b6d4' }
] as const;

