'use client';

import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import GlassWidget from '@/components/ui/GlassWidget';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { TimePeriod, getDateRangeForPeriod } from './TimeFilter';
import { getLocalDateString } from '@/lib/utils';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Title, Tooltip, Legend);

interface MuscleSetsChartProps {
  timePeriod: TimePeriod;
}

export default function MuscleSetsChart({
  timePeriod
}: MuscleSetsChartProps) {
  // Track workouts to force re-renders when workouts are added/completed/deleted
  const deletionTracker = useLiveQuery(async () => {
    return await db.workouts.count(); // Changes when workouts are added/deleted
  });

  const muscleData = useLiveQuery(async () => {
    const { startDate, endDate } = getDateRangeForPeriod(timePeriod);

    const allWorkouts = await db.workouts.toArray();

    const workouts = allWorkouts.filter(workout =>
      workout.endTime !== undefined &&
      workout.date >= getLocalDateString(startDate) &&
      workout.date <= getLocalDateString(endDate)
    );

    const muscleSets: { [key: string]: number } = {};

    for (const workout of workouts) {
      const workoutExercises = await db.workout_exercises
        .where('workoutId')
        .equals(workout.id!)
        .toArray();

      for (const we of workoutExercises) {
        const exercise = await db.exercises.get(we.exerciseId);
        if (!exercise) continue;

        const sets = await db.sets
          .where('workoutExerciseId')
          .equals(we.id!)
          .and(s => s.completed)
          .toArray();

        const setCount = sets.length;
        if (setCount === 0) continue;

        const muscleKey = exercise.muscleGroup || 'Unknown';
        muscleSets[muscleKey] = (muscleSets[muscleKey] || 0) + setCount;
      }
    }

    const entries = Object.entries(muscleSets)
      .map(([muscle, sets]) => ({ muscle, sets }))
      .sort((a, b) => b.sets - a.sets);

    const totalSets = entries.reduce((sum, entry) => sum + entry.sets, 0);

    return {
      entries: entries.map(entry => ({
        ...entry,
        percentage: totalSets > 0 ? (entry.sets / totalSets) * 100 : 0
      })),
      totalSets
    };
  }, [timePeriod, deletionTracker]);

  if (!muscleData || muscleData.entries.length === 0) {
    return (
      <GlassWidget widgetId="analytics-muscle-sets" showGlow allowColorChange className="p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">Set Distribution</h2>
        <div className="text-center py-8">
          <div className="text-white/40 mb-4">
            No set data yet
          </div>
          <p className="text-white/60 text-sm">
            Complete workouts to see your set distribution by muscle group
          </p>
        </div>
      </GlassWidget>
    );
  }

  const data = {
    labels: muscleData.entries.map(entry => entry.muscle),
    datasets: [
      {
        label: 'Set Distribution (%)',
        data: muscleData.entries.map(entry => entry.percentage),
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        borderColor: 'rgba(168, 85, 247, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(168, 85, 247, 1)',
        pointBorderColor: 'rgba(255, 255, 255, 0.8)',
        pointBorderWidth: 2,
        pointRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const percentage = context.parsed.r || 0;
            const entry = muscleData.entries[context.dataIndex];
            const rawValue = entry ? entry.sets : 0;
            return `${label}: ${rawValue} sets (${percentage.toFixed(1)}%)`;
          },
        },
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        ticks: {
          display: false,
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        angleLines: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        pointLabels: {
          color: 'rgba(255, 255, 255, 0.8)',
          font: {
            size: 12,
          },
        },
      },
    },
  };

  return (
    <GlassWidget widgetId="analytics-muscle-sets" showGlow allowColorChange className="p-4 md:p-6">
      <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">Set Distribution</h2>
      <div className="h-[250px] mb-4">
        <Radar data={data} options={options} />
      </div>
      <div className="text-sm text-white/60 mb-3 text-center">
        {muscleData.totalSets} total sets
      </div>
      <div className="space-y-2">
        {muscleData.entries.slice(0, 6).map(entry => (
          <div
            key={entry.muscle}
            className="flex items-center justify-between rounded bg-white/5 px-3 py-2"
          >
            <div>
              <p className="text-sm text-white">{entry.muscle}</p>
              <p className="text-xs text-white/50">{entry.percentage.toFixed(1)}% of sets</p>
            </div>
            <span className="text-sm text-white/60">{entry.sets} sets</span>
          </div>
        ))}
      </div>
    </GlassWidget>
  );
}


