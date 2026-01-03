'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import GlassWidget from '@/components/ui/GlassWidget';
import SearchInput from '@/components/ui/SearchInput';
import WorkoutFrequencyChart from '@/components/analytics/WorkoutFrequencyChart';
import MuscleDistributionChart from '@/components/analytics/MuscleDistributionChart';
import WeightChart from '@/components/analytics/WeightChart';
import PersonalRecords from '@/components/analytics/PersonalRecords';
import WorkoutCalendar from '@/components/analytics/WorkoutCalendar';
import MuscleGroupsBySets from '@/components/analytics/MuscleGroupsBySets';
import TopExercises from '@/components/analytics/TopExercises';
import TimeFilter, { TimePeriod } from '@/components/analytics/TimeFilter';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function AnalyticsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [isExercisePerformanceCollapsed, setIsExercisePerformanceCollapsed] = useState(false);
  const [globalTimePeriod, setGlobalTimePeriod] = useState<TimePeriod>('month');



  const exercises = useLiveQuery(async () => {
    let allExercises = await db.exercises.toArray();

    if (search) {
      const searchLower = search.toLowerCase();
      allExercises = allExercises.filter(ex =>
        ex.name.toLowerCase().includes(searchLower)
      );
    }

    // Get workout count for each exercise
    const exercisesWithStats = await Promise.all(
      allExercises.map(async (exercise) => {
        const workoutExercises = await db.workout_exercises
          .where('exerciseId')
          .equals(exercise.id!)
          .toArray();

        const totalSets = await Promise.all(
          workoutExercises.map(we =>
            db.sets
              .where('workoutExerciseId')
              .equals(we.id!)
              .and(s => s.completed)
              .count()
          )
        );

        return {
          ...exercise,
          workoutCount: workoutExercises.length,
          totalSets: totalSets.reduce((sum, count) => sum + count, 0)
        };
      })
    );

    return exercisesWithStats.sort((a, b) => b.workoutCount - a.workoutCount);
  }, [search]);

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto">
      <div className="px-2 md:px-0">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">Analytics</h1>
        <p className="text-sm md:text-base text-white/60">Track your progress and performance</p>
      </div>

      <GlassWidget className="p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">Time Period</h3>
            <p className="text-sm text-white/60">Filter all analytics by time period</p>
          </div>
          <TimeFilter selectedPeriod={globalTimePeriod} onPeriodChange={setGlobalTimePeriod} />
        </div>
      </GlassWidget>

      {/* Top Row - Overview Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <WorkoutFrequencyChart timePeriod={globalTimePeriod} />

        <MuscleDistributionChart timePeriod={globalTimePeriod} />

        <WeightChart timePeriod={globalTimePeriod} />
      </div>

      {/* Second Row - Calendar and PRs */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        <WorkoutCalendar />
        <PersonalRecords timePeriod={globalTimePeriod} />
      </div>

      {/* Third Row - Detailed Analytics */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        <MuscleGroupsBySets timePeriod={globalTimePeriod} />
        <TopExercises timePeriod={globalTimePeriod} />
      </div>

      <GlassWidget className="p-6">
        <div
          className="flex items-center justify-between cursor-pointer mb-4"
          onClick={() => setIsExercisePerformanceCollapsed(!isExercisePerformanceCollapsed)}
        >
          <h2 className="text-xl font-bold text-white">Exercise Performance</h2>
          {isExercisePerformanceCollapsed ? (
            <ChevronDown size={20} className="text-white/60" />
          ) : (
            <ChevronUp size={20} className="text-white/60" />
          )}
        </div>

        {!isExercisePerformanceCollapsed && (
          <>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search exercises..."
              className="mb-4"
            />

            {exercises && exercises.length === 0 ? (
              <p className="text-center text-white/40 py-8">
                No exercises found. Add exercises in the Admin page.
              </p>
            ) : (
              <div className="space-y-2">
                {exercises?.map((exercise) => (
                  <div
                    key={exercise.id}
                    onClick={() => router.push(`/exercises/${exercise.id}`)}
                    className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/8 transition-colors cursor-pointer"
                  >
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{exercise.name}</h3>
                      <p className="text-sm text-white/60">
                        {exercise.muscleGroup}
                        {exercise.equipment && ` • ${exercise.equipment}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-right">
                        <p className="text-white/40">Workouts</p>
                        <p className="text-white font-semibold">{exercise.workoutCount}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/40">Sets</p>
                        <p className="text-white font-semibold">{exercise.totalSets}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </GlassWidget>

      {/* Invisible spacer to push content above BottomNav overlay */}
      <div className="h-20 md:hidden" aria-hidden="true" />
    </div>
  );
}

