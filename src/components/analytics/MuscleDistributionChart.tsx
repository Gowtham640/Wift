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
  const filteredDistribution = useLiveQuery(async () => {
    const { startDate, endDate } = getDateRangeForPeriod(timePeriod);

    const workouts = await db.workouts
      .where('date')
      .between(getLocalDateString(startDate), getLocalDateString(endDate))
      .toArray();

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
          .and(s => s.completed)
          .toArray();

        const volume = sets.reduce((sum, s) => sum + s.weight * s.reps, 0);

        if (!muscleVolumes[exercise.muscleGroup]) {
          muscleVolumes[exercise.muscleGroup] = 0;
        }
        muscleVolumes[exercise.muscleGroup] += volume;
      }
    }

    const totalVolume = Object.values(muscleVolumes).reduce((sum, v) => sum + v, 0);

    const data: MuscleGroupVolume[] = Object.entries(muscleVolumes).map(
      ([muscleGroup, volume]) => ({
        muscleGroup,
        volume,
        percentage: totalVolume > 0 ? (volume / totalVolume) * 100 : 0
      })
    );

    return data;
  }, [timePeriod]);

  const sortedDistribution = [...(filteredDistribution || [])].sort((a, b) => b.volume - a.volume);

  const data = {
    labels: sortedDistribution.map(d => d.muscleGroup),
    datasets: [
      {
        label: 'Volume (kg)',
        data: sortedDistribution.map(d => d.volume),
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderColor: 'rgba(255, 255, 255, 1)',
        borderWidth: 2,
        pointBackgroundColor: sortedDistribution.map((_, index) => {
          const colors = [
            'rgba(255, 255, 255, 1)',
            'rgba(168, 85, 247, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(239, 68, 68, 1)',
            'rgba(6, 182, 212, 1)',
            'rgba(236, 72, 153, 1)',
            'rgba(139, 92, 246, 1)',
            'rgba(34, 197, 94, 1)',
            'rgba(251, 146, 60, 1)'
          ];
          return colors[index % colors.length];
        }),
        pointBorderColor: 'rgba(255, 255, 255, 0.8)',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
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
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          title: function(context: any) {
            return context[0].label;
          },
          label: function(context: any) {
            const index = context.dataIndex;
            const volume = sortedDistribution[index].volume;
            const percentage = sortedDistribution[index].percentage;
            return `Volume: ${volume.toFixed(0)} kg (${percentage.toFixed(1)}%)`;
          }
        }
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        angleLines: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        pointLabels: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 12
          }
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
          backdropColor: 'transparent',
          callback: function(value: any) {
            return value + 'kg';
          }
        }
      }
    }
  };

  return (
    <GlassWidget widgetId="analytics-muscle-distribution" showGlow allowColorChange className="p-4 md:p-6">
      <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">Muscle Balance</h2>

      <div className="mb-4 md:mb-6 grid grid-cols-2 gap-2 md:gap-3">
        {sortedDistribution.slice(0, 6).map((item, index) => (
          <div key={item.muscleGroup} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
            <span className="text-sm text-white/80">{item.muscleGroup}</span>
            <span className="text-sm text-white/60">{item.percentage.toFixed(1)}%</span>
          </div>
        ))}
      </div>

      <div className="h-[400px]">
        <Radar data={data} options={options} />
      </div>
    </GlassWidget>
  );
}

