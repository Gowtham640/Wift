'use client';

import { useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useExercise } from '@/hooks/useExercises';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { ArrowLeft, TrendingUp, Award, Calendar, Activity } from 'lucide-react';
import GlassWidget from '@/components/ui/GlassWidget';
import Button from '@/components/ui/Button';
import { formatDate, getLocalDateString } from '@/lib/utils';
import TimeFilter, { TimePeriod, getDateRangeForPeriod } from '@/components/analytics/TimeFilter';
import type { ExerciseHistory } from '@/lib/types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement
);

export default function ExerciseDetailPage() {
  const router = useRouter();
  const pathname = usePathname();

  const exerciseId = useMemo(() => {
    const id = pathname.split('/').pop();
    return id ? parseInt(id) : null;
  }, [pathname]);
  const { exercise, loading } = useExercise(exerciseId);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>('month');

  const history = useLiveQuery(async () => {
    if (!exercise) return [];

    const { startDate, endDate } = getDateRangeForPeriod(selectedTimePeriod);

    // Get workouts within the selected time period
    const workoutsInPeriod = await db.workouts
      .where('date')
      .between(getLocalDateString(startDate), getLocalDateString(endDate))
      .toArray();

    const workoutIds = workoutsInPeriod.map(w => w.id!);

    // Get workout exercises for this exercise within the time period
    const workoutExercises = await db.workout_exercises
      .where('workoutId')
      .anyOf(workoutIds)
      .and(we => we.exerciseId === exerciseId)
      .toArray();

    // Get history data
    const historyData: ExerciseHistory[] = await Promise.all(
      workoutExercises.map(async (we) => {
        const workout = workoutsInPeriod.find(w => w.id === we.workoutId);
        const sets = await db.sets
          .where('workoutExerciseId')
          .equals(we.id!)
          .and(s => s.completed)
          .toArray();

        const totalVolume = sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
        const maxWeight = sets.length > 0 ? Math.max(...sets.map(s => s.weight)) : 0;

        return {
          date: workout?.date || '',
          sets,
          totalVolume,
          maxWeight
        };
      })
    );

    return historyData
      .filter(h => h.sets.length > 0)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [exerciseId, exercise, selectedTimePeriod]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-white/40">Loading exercise...</p>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Exercise Not Found</h2>
          <p className="text-white/60 mb-4">This exercise doesn't exist or has been deleted.</p>
          <Button onClick={() => router.push('/exercises')} variant="primary">
            Go to Exercises
          </Button>
        </div>
      </div>
    );
  }

  const totalSets = history?.reduce((sum, h) => sum + h.sets.length, 0) || 0;
  const totalVolume = history?.reduce((sum, h) => sum + h.totalVolume, 0) || 0;
  const maxWeight = history && history.length > 0
    ? Math.max(...history.map(h => h.maxWeight))
    : 0;
  const totalWorkouts = history?.length || 0;
  const avgVolume = totalWorkouts > 0 ? totalVolume / totalWorkouts : 0;
  const bestSet = history && history.length > 0
    ? Math.max(...history.flatMap(h => h.sets.map(s => s.weight * s.reps)))
    : 0;

  // Prepare chart data
  const volumeChartData = {
    labels: history?.map(h => formatDate(h.date)).reverse() || [],
    datasets: [
      {
        label: 'Volume (kg)',
        data: history?.map(h => h.totalVolume).reverse() || [],
        borderColor: 'rgba(255, 255, 255, 1)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(255, 255, 255, 1)',
        pointBorderColor: 'rgba(255, 255, 255, 0.8)',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  const weightChartData = {
    labels: history?.map(h => formatDate(h.date)).reverse() || [],
    datasets: [
      {
        label: 'Max Weight (kg)',
        data: history?.map(h => h.maxWeight).reverse() || [],
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(16, 185, 129, 1)',
        pointBorderColor: 'rgba(255, 255, 255, 0.8)',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  const setsChartData = {
    labels: history?.map(h => formatDate(h.date)).reverse() || [],
    datasets: [
      {
        label: 'Sets per Workout',
        data: history?.map(h => h.sets.length).reverse() || [],
        backgroundColor: 'rgba(168, 85, 247, 0.8)',
        borderColor: 'rgba(168, 85, 247, 1)',
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'rgba(255, 255, 255, 1)',
        bodyColor: 'rgba(255, 255, 255, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          maxTicksLimit: 7
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 md:gap-4 px-2 md:px-0">
        <Button variant="secondary" onClick={() => router.push('/exercises')} className="p-2 md:p-3">
          <ArrowLeft size={18} />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-white">{exercise.name}</h1>
          <p className="text-sm md:text-base text-white/60">
            {exercise.muscleGroup}
            {exercise.equipment && ` • ${exercise.equipment}`}
          </p>
        </div>
      </div>

      <GlassWidget className="p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">Time Period</h3>
            <p className="text-sm text-white/60">Filter exercise analytics by time period</p>
          </div>
          <TimeFilter selectedPeriod={selectedTimePeriod} onPeriodChange={setSelectedTimePeriod} />
        </div>
      </GlassWidget>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6">
        <GlassWidget className="p-4 md:p-6" showGlow glowColor="#3b82f6">
          <div className="flex items-center gap-2 md:gap-3 mb-2">
            <Calendar size={18} className="text-white" />
            <h3 className="text-xs md:text-sm font-medium text-white/60">Workouts</h3>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-white">{totalWorkouts}</p>
        </GlassWidget>

        <GlassWidget className="p-4 md:p-6" showGlow glowColor="#10b981">
          <div className="flex items-center gap-2 md:gap-3 mb-2">
            <TrendingUp size={18} className="text-emerald-400" />
            <h3 className="text-xs md:text-sm font-medium text-white/60">Total Sets</h3>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-white">{totalSets}</p>
        </GlassWidget>

        <GlassWidget className="p-4 md:p-6" showGlow glowColor="#f59e0b">
          <div className="flex items-center gap-2 md:gap-3 mb-2">
            <Award size={18} className="text-amber-400" />
            <h3 className="text-xs md:text-sm font-medium text-white/60">Max Weight</h3>
          </div>
          <p className="text-xl md:text-2xl font-bold text-white">{maxWeight} kg</p>
        </GlassWidget>

        <GlassWidget className="p-4 md:p-6" showGlow glowColor="#a855f7">
          <div className="flex items-center gap-2 md:gap-3 mb-2">
            <TrendingUp size={18} className="text-purple-400" />
            <h3 className="text-xs md:text-sm font-medium text-white/60">Avg Volume</h3>
          </div>
          <p className="text-xl md:text-2xl font-bold text-white">{avgVolume.toFixed(0)} kg</p>
        </GlassWidget>

        <GlassWidget className="p-4 md:p-6" showGlow glowColor="#ef4444">
          <div className="flex items-center gap-2 md:gap-3 mb-2">
            <Award size={18} className="text-red-400" />
            <h3 className="text-xs md:text-sm font-medium text-white/60">Best Set</h3>
          </div>
          <p className="text-xl md:text-2xl font-bold text-white">{bestSet} kg</p>
        </GlassWidget>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        <GlassWidget widgetId={`exercise-${exerciseId}-volume`} showGlow allowColorChange className="p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">Volume Progress</h2>
          <div className="h-[300px]">
            {history && history.length > 0 ? (
              <Line data={volumeChartData} options={chartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp size={48} className="text-white/20 mx-auto mb-4" />
                  <p className="text-white/40">No volume data available</p>
                </div>
              </div>
            )}
          </div>
        </GlassWidget>

        <GlassWidget widgetId={`exercise-${exerciseId}-weight`} showGlow allowColorChange className="p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">Weight Progression</h2>
          <div className="h-[300px]">
            {history && history.length > 0 ? (
              <Line data={weightChartData} options={chartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Award size={48} className="text-white/20 mx-auto mb-4" />
                  <p className="text-white/40">No weight data available</p>
                </div>
              </div>
            )}
          </div>
        </GlassWidget>
      </div>

      <GlassWidget widgetId={`exercise-${exerciseId}-sets`} showGlow allowColorChange className="p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">Sets per Workout</h2>
        <div className="h-[300px]">
          {history && history.length > 0 ? (
            <Bar data={setsChartData} options={chartOptions} />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Activity size={48} className="text-white/20 mx-auto mb-4" />
                <p className="text-white/40">No sets data available</p>
              </div>
            </div>
          )}
        </div>
      </GlassWidget>

      <GlassWidget className="p-6">
        <h2 className="text-xl font-bold text-white mb-4">Workout History</h2>

        {history && history.length === 0 ? (
          <p className="text-center text-white/40 py-8">
            No history yet. Start using this exercise in your workouts!
          </p>
        ) : (
          <div className="space-y-3">
            {history?.map((entry, index) => (
              <div
                key={index}
                className="p-4 rounded-lg bg-white/5 hover:bg-white/8 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-white">{formatDate(entry.date)}</h3>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-white/60">
                      Volume: <span className="text-white font-semibold">{entry.totalVolume.toFixed(0)} kg</span>
                    </span>
                    <span className="text-white/60">
                      Max: <span className="text-white font-semibold">{entry.maxWeight} kg</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {entry.sets.map((set, setIndex) => (
                    <div
                      key={setIndex}
                      className="p-2 rounded bg-white/5 text-center"
                    >
                      <p className="text-xs text-white/40 mb-1">Set {setIndex + 1}</p>
                      <p className="text-sm font-semibold text-white">
                        {set.weight}kg × {set.reps}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassWidget>

      {/* Invisible spacer to push content above BottomNav overlay */}
      <div className="h-20 md:hidden" aria-hidden="true" />
    </div>
  );
}

