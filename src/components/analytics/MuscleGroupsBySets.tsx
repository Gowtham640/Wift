'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import GlassWidget from '@/components/ui/GlassWidget';
import TimeFilter, { TimePeriod, getDateRangeForPeriod } from './TimeFilter';
import { useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { getLocalDateString } from '@/lib/utils';

interface MuscleGroupSets {
  muscleGroup: string;
  totalSets: number;
  percentage: number;
}

interface MuscleGroupsBySetsProps {
  timePeriod: TimePeriod;
}

export default function MuscleGroupsBySets({ timePeriod }: MuscleGroupsBySetsProps) {

  const muscleGroupData = useLiveQuery(async () => {
    const { startDate, endDate } = getDateRangeForPeriod(timePeriod);

    const workouts = await db.workouts
      .where('date')
      .between(getLocalDateString(startDate), getLocalDateString(endDate))
      .toArray();

    const muscleGroupSets: { [key: string]: number } = {};

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
          .count();

        if (!muscleGroupSets[exercise.muscleGroup]) {
          muscleGroupSets[exercise.muscleGroup] = 0;
        }
        muscleGroupSets[exercise.muscleGroup] += sets;
      }
    }

    const totalSets = Object.values(muscleGroupSets).reduce((sum, sets) => sum + sets, 0);

    const data: MuscleGroupSets[] = Object.entries(muscleGroupSets)
      .map(([muscleGroup, sets]) => ({
        muscleGroup,
        totalSets: sets,
        percentage: totalSets > 0 ? (sets / totalSets) * 100 : 0
      }))
      .sort((a, b) => b.totalSets - a.totalSets);

    return data;
  }, [timePeriod]);

  return (
    <GlassWidget widgetId="analytics-muscle-groups-sets" showGlow allowColorChange className="p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Dumbbell className="text-purple-400" size={20} />
        <h2 className="text-lg md:text-xl font-bold text-white">Sets by Muscle Group</h2>
      </div>

      {!muscleGroupData || muscleGroupData.length === 0 ? (
        <div className="text-center py-8">
          <Dumbbell size={48} className="text-white/20 mx-auto mb-4" />
          <p className="text-white/40 mb-2">No workout data</p>
          <p className="text-white/60 text-sm">Complete workouts to see your muscle group breakdown</p>
        </div>
      ) : (
        <div className="space-y-3">
          {muscleGroupData.map((group, index) => (
            <div key={group.muscleGroup} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 font-bold text-sm">
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-white font-medium">{group.muscleGroup}</h3>
                  <p className="text-sm text-white/60">{group.percentage.toFixed(1)}% of total sets</p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold text-purple-400">
                  {group.totalSets}
                </div>
                <p className="text-xs text-white/40">sets</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassWidget>
  );
}
