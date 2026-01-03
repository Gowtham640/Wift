'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import GlassWidget from '@/components/ui/GlassWidget';
import TimeFilter, { TimePeriod, getDateRangeForPeriod } from './TimeFilter';
import { useState } from 'react';
import { TrendingUp, Award } from 'lucide-react';
import { getLocalDateString } from '@/lib/utils';

interface TopExercise {
  exerciseId: number;
  exerciseName: string;
  muscleGroup: string;
  totalSets: number;
  totalReps: number;
  totalVolume: number;
  workoutCount: number;
}

interface TopExercisesProps {
  timePeriod: TimePeriod;
}

export default function TopExercises({ timePeriod }: TopExercisesProps) {
  // Track workouts to force re-renders when workouts are added/completed/deleted
  const deletionTracker = useLiveQuery(async () => {
    return await db.workouts.count(); // Changes when workouts are added/deleted
  });

  const topExercises = useLiveQuery(async () => {
    const { startDate, endDate } = getDateRangeForPeriod(timePeriod);

    const allWorkouts = await db.workouts
      .where('date')
      .between(getLocalDateString(startDate), getLocalDateString(endDate))
      .toArray();

    const workouts = allWorkouts.filter(workout => workout.endTime !== undefined);

    const exerciseStats: { [key: number]: TopExercise } = {};

    for (const workout of workouts) {
      const workoutExercises = await db.workout_exercises
        .where('workoutId')
        .equals(workout.id!)
        .toArray();

      for (const workoutExercise of workoutExercises) {
        const exercise = await db.exercises.get(workoutExercise.exerciseId);
        if (!exercise) continue;

        const sets = await db.sets
          .where('workoutExerciseId')
          .equals(workoutExercise.id!)
          .and(s => s.completed)
          .toArray();

        if (!exerciseStats[exercise.id!]) {
          exerciseStats[exercise.id!] = {
            exerciseId: exercise.id!,
            exerciseName: exercise.name,
            muscleGroup: exercise.muscleGroup,
            totalSets: 0,
            totalReps: 0,
            totalVolume: 0,
            workoutCount: 0
          };
        }

        exerciseStats[exercise.id!].totalSets += sets.length;
        exerciseStats[exercise.id!].totalReps += sets.reduce((sum, s) => sum + s.reps, 0);
        exerciseStats[exercise.id!].totalVolume += sets.reduce((sum, s) => sum + (s.weight * s.reps), 0);
        exerciseStats[exercise.id!].workoutCount += 1;
      }
    }

    return Object.values(exerciseStats)
      .sort((a, b) => b.totalVolume - a.totalVolume)
      .slice(0, 8);
  }, [timePeriod, deletionTracker]);

  return (
    <GlassWidget widgetId="analytics-top-exercises" showGlow allowColorChange className="p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Award className="text-green-400" size={20} />
        <h2 className="text-lg md:text-xl font-bold text-white">Top Exercises</h2>
      </div>

      {!topExercises || topExercises.length === 0 ? (
        <div className="text-center py-8">
          <Award size={48} className="text-white/20 mx-auto mb-4" />
          <p className="text-white/40 mb-2">No exercise data</p>
          <p className="text-white/60 text-sm">Complete workouts to see your top exercises</p>
        </div>
      ) : (
        <div className="space-y-3">
          {topExercises.map((exercise, index) => (
            <div key={exercise.exerciseId} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20 text-green-400 font-bold text-sm">
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-white font-medium">{exercise.exerciseName}</h3>
                  <p className="text-sm text-white/60">
                    {exercise.muscleGroup} • {exercise.workoutCount} workouts
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-1 text-green-400">
                  <TrendingUp size={14} />
                  <span className="font-bold text-lg">{exercise.totalVolume.toFixed(0)}</span>
                  <span className="text-sm text-white/60">kg</span>
                </div>
                <p className="text-xs text-white/40">
                  {exercise.totalSets} sets • {exercise.totalReps} reps
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassWidget>
  );
}
