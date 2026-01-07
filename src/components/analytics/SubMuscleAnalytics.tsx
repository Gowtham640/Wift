'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import GlassWidget from '@/components/ui/GlassWidget';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { TimePeriod, getDateRangeForPeriod } from './TimeFilter';
import { getLocalDateString } from '@/lib/utils';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface SubMuscleAnalyticsProps {
  timePeriod: TimePeriod;
}

export default function SubMuscleAnalytics({
  timePeriod
}: SubMuscleAnalyticsProps) {
  // Track workouts to force re-renders when workouts are added/completed/deleted
  const deletionTracker = useLiveQuery(async () => {
    return await db.workouts.count();
  });

  const subMuscleData = useLiveQuery(async () => {
    const { startDate, endDate } = getDateRangeForPeriod(timePeriod);

    // Get all workouts first, then filter by date and completion
    const allWorkouts = await db.workouts.toArray();

    const workouts = allWorkouts.filter(workout =>
      workout.endTime !== undefined &&
      workout.date >= getLocalDateString(startDate) &&
      workout.date <= getLocalDateString(endDate)
    );

    const subMuscleSets: { [key: string]: number } = {};
    const subMuscleVolume: { [key: string]: number } = {};

    for (const workout of workouts) {
      const workoutExercises = await db.workout_exercises
        .where('workoutId')
        .equals(workout.id!)
        .toArray();

      for (const workoutExercise of workoutExercises) {
        const exercise = await db.exercises.get(workoutExercise.exerciseId);
        if (!exercise) continue;

        // Use subMuscleGroup if available, otherwise fall back to muscleGroup
        const subMuscleKey = exercise.subMuscleGroup || exercise.muscleGroup || 'Unknown';

        const sets = await db.sets
          .where('workoutExerciseId')
          .equals(workoutExercise.id!)
          .and(set => set.completed)
          .toArray();

        const volume = sets.reduce((sum, set) => sum + set.weight * set.reps, 0);

        subMuscleSets[subMuscleKey] = (subMuscleSets[subMuscleKey] || 0) + sets.length;
        subMuscleVolume[subMuscleKey] = (subMuscleVolume[subMuscleKey] || 0) + volume;
      }
    }

    return { subMuscleSets, subMuscleVolume };
  }, [timePeriod, deletionTracker]);

  const chartData = {
    labels: Object.keys(subMuscleData?.subMuscleSets || {}),
    datasets: [
      {
        label: 'Sets',
        data: Object.values(subMuscleData?.subMuscleSets || {}),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
        yAxisID: 'y'
      },
      {
        label: 'Volume (kg)',
        data: Object.values(subMuscleData?.subMuscleVolume || {}),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
        yAxisID: 'y1'
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const
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
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          maxRotation: 45,
          minRotation: 0
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)'
        },
        title: {
          display: true,
          text: 'Sets',
          color: 'rgba(255, 255, 255, 0.8)'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: 'rgba(16, 185, 129, 0.8)'
        },
        title: {
          display: true,
          text: 'Volume (kg)',
          color: 'rgba(16, 185, 129, 0.8)'
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    }
  };

  return (
    <GlassWidget className="p-4 md:p-6">
      <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">Sub-Muscle Group Analytics</h2>
      <div className="h-[400px]">
        {subMuscleData && Object.keys(subMuscleData.subMuscleSets).length > 0 ? (
          <Bar data={chartData} options={options} />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-white/20 text-4xl mb-4">📊</div>
              <p className="text-white/40">No sub-muscle group data available</p>
              <p className="text-white/60 text-sm mt-2">Complete workouts to see analytics</p>
            </div>
          </div>
        )}
      </div>
    </GlassWidget>
  );
}
