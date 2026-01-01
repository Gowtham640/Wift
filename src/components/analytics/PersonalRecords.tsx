'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import GlassWidget from '@/components/ui/GlassWidget';
import { TimePeriod, getDateRangeForPeriod } from './TimeFilter';
import { Trophy, TrendingUp } from 'lucide-react';
import { getLocalDateString } from '@/lib/utils';

interface PersonalRecord {
  exerciseId: number;
  exerciseName: string;
  muscleGroup: string;
  maxWeight: number;
  maxReps: number;
  totalVolume: number;
  dateAchieved: string;
}

interface PersonalRecordsProps {
  timePeriod: TimePeriod;
}

export default function PersonalRecords({ timePeriod }: PersonalRecordsProps) {
  const personalRecords = useLiveQuery(async () => {
    const { startDate, endDate } = getDateRangeForPeriod(timePeriod);

    const workouts = await db.workouts
      .where('date')
      .between(getLocalDateString(startDate), getLocalDateString(endDate))
      .toArray();

    const workoutIds = workouts.map(w => w.id!);
    const records: PersonalRecord[] = [];

    // Get all exercises that were performed in the selected time period
    const workoutExercises = await db.workout_exercises
      .where('workoutId')
      .anyOf(workoutIds)
      .toArray();

    const exerciseIds = [...new Set(workoutExercises.map(we => we.exerciseId))];

    for (const exerciseId of exerciseIds) {
      const exercise = await db.exercises.get(exerciseId);
      if (!exercise) continue;

      // Get only workout exercises from the selected time period
      const periodWorkoutExercises = workoutExercises.filter(we => we.exerciseId === exerciseId);

      let maxWeight = 0;
      let maxReps = 0;
      let totalVolume = 0;
      let dateAchieved = '';

      for (const workoutExercise of periodWorkoutExercises) {
        const sets = await db.sets
          .where('workoutExerciseId')
          .equals(workoutExercise.id!)
          .and(s => s.completed)
          .toArray();

        for (const set of sets) {
          totalVolume += set.weight * set.reps;

          if (set.weight > maxWeight) {
            maxWeight = set.weight;
            maxReps = set.reps;

            // Get the workout date
            const workout = workouts.find(w => w.id === workoutExercise.workoutId);
            if (workout) {
              dateAchieved = workout.date;
            }
          } else if (set.weight === maxWeight && set.reps > maxReps) {
            maxReps = set.reps;
          }
        }
      }

      if (maxWeight > 0) {
        records.push({
          exerciseId: exercise.id!,
          exerciseName: exercise.name,
          muscleGroup: exercise.muscleGroup,
          maxWeight,
          maxReps,
          totalVolume,
          dateAchieved
        });
      }
    }

    // Sort by max weight descending
    return records.sort((a, b) => b.maxWeight - a.maxWeight).slice(0, 10);
  }, [timePeriod]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <GlassWidget widgetId="analytics-personal-records" showGlow allowColorChange className="p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4 md:mb-6">
        <Trophy className="text-yellow-400" size={24} />
        <h2 className="text-lg md:text-xl font-bold text-white">Personal Records</h2>
      </div>

      {!personalRecords || personalRecords.length === 0 ? (
        <div className="text-center py-8">
          <Trophy size={48} className="text-white/20 mx-auto mb-4" />
          <p className="text-white/40 mb-2">No personal records yet</p>
          <p className="text-white/60 text-sm">Complete some workouts to see your PRs!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {personalRecords.map((record, index) => (
            <div
              key={record.exerciseId}
              className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-400 font-bold text-sm">
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-white font-semibold">{record.exerciseName}</h3>
                  <p className="text-sm text-white/60">{record.muscleGroup}</p>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-1 text-yellow-400">
                  <TrendingUp size={16} />
                  <span className="font-bold text-lg">{record.maxWeight}kg</span>
                  <span className="text-sm text-white/60">×{record.maxReps}</span>
                </div>
                <p className="text-xs text-white/40">
                  {formatDate(record.dateAchieved)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassWidget>
  );
}
