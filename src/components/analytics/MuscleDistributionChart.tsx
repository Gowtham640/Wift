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
import type { MuscleGroupVolume } from '@/lib/types';
import { getLocalDateString } from '@/lib/utils';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Title, Tooltip, Legend);

interface MuscleDistributionChartProps {
  timePeriod: TimePeriod;
}

export default function MuscleDistributionChart({
  timePeriod
}: MuscleDistributionChartProps) {
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

    const muscleVolumes: { [key: string]: number } = {};

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
          .filter(s => s.completed)
          .toArray();

        const volume = sets.reduce((sum, s) => sum + s.weight * s.reps, 0);

        if (!muscleVolumes[exercise.muscleGroup]) {
          muscleVolumes[exercise.muscleGroup] = 0;
        }
        muscleVolumes[exercise.muscleGroup] += volume;
      }
    }

    return Object.entries(muscleVolumes).map(([muscle, volume]) => ({
      muscle,
      volume
    }));
  }, [timePeriod, deletionTracker]);

  const sortedData = [...(muscleData || [])].sort((a, b) => b.volume - a.volume);

  const data = {
    labels: sortedData.map(d => d.muscle),
    datasets: [
      {
        label: 'Volume (kg)',
        data: sortedData.map(d => d.volume),
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderColor: 'rgba(255, 255, 255, 1)',
        borderWidth: 2
      }
    ]
  };

  const options = {
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
        callbacks: {
          label: function(context: any) {
            return `${context.parsed.r} kg`;
          }
        }
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        ticks: {
          display: false
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        angleLines: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        pointLabels: {
          color: 'rgba(255, 255, 255, 0.8)',
          font: {
            size: 12
          }
        }
      }
    }
  };

  return (
    <GlassWidget widgetId="analytics-muscle-distribution" showGlow allowColorChange className="p-4 md:p-6">
      <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">Muscle Volume</h2>

      <div className="h-[350px]">
        {sortedData && sortedData.length > 0 ? (
          <Radar data={data} options={options} />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-white/40 mb-2">No muscle data available</p>
              <p className="text-white/60 text-sm">Complete some workouts to see volume distribution</p>
            </div>
          </div>
        )}
      </div>

      {sortedData && sortedData.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {sortedData.slice(0, 6).map((item) => (
            <div key={item.muscle} className="flex items-center justify-between p-2 rounded bg-white/5">
              <span className="text-sm text-white/80">{item.muscle}</span>
              <span className="text-sm text-white/60">{item.volume.toFixed(0)}kg</span>
            </div>
          ))}
        </div>
      )}
    </GlassWidget>
  );
}

