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

    // Get all workouts first, then filter by date and completion
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

        // Count sets instead of volume
        const setCount = sets.length;

        if (!muscleSets[exercise.muscleGroup]) {
          muscleSets[exercise.muscleGroup] = 0;
        }
        muscleSets[exercise.muscleGroup] += setCount;
      }
    }

    // Convert to chart data format
    const labels = Object.keys(muscleSets);
    const data = Object.values(muscleSets);

    // Calculate percentages for better visualization
    const totalSets = data.reduce((sum, value) => sum + value, 0);
    const percentages = data.map(value => totalSets > 0 ? (value / totalSets) * 100 : 0);

    return {
      labels,
      data: percentages,
      rawData: data
    };
  }, [timePeriod, deletionTracker]);

  if (!muscleData || muscleData.labels.length === 0) {
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
    labels: muscleData.labels,
    datasets: [
      {
        label: 'Set Distribution (%)',
        data: muscleData.data,
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
            const rawValue = muscleData.rawData[context.dataIndex] || 0;
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
      <div className="text-center">
        <p className="text-sm text-white/60">
          {muscleData.rawData.reduce((sum, value) => sum + value, 0)} total sets
        </p>
      </div>
    </GlassWidget>
  );
}

