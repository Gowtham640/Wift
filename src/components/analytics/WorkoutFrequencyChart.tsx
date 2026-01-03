'use client';

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import GlassWidget from '@/components/ui/GlassWidget';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { TimePeriod, getDateRangeForPeriod } from './TimeFilter';
import { getLocalDateString } from '@/lib/utils';

ChartJS.register(ArcElement, Tooltip, Legend);

interface WorkoutFrequencyChartProps {
  timePeriod: TimePeriod;
}

export default function WorkoutFrequencyChart({
  timePeriod
}: WorkoutFrequencyChartProps) {
  // Track completed workouts to force re-renders when workouts are completed
  const deletionTracker = useLiveQuery(async () => {
    return await db.workouts.where('endTime').above(0).count(); // Changes when workouts are completed/incompleted
  });

  const workoutStats = useLiveQuery(async () => {
    const { startDate, endDate } = getDateRangeForPeriod(timePeriod);

    // Calculate total days in the period
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Get unique workout days in the period (only completed workouts)
    const workouts = await db.workouts
      .where('date')
      .between(getLocalDateString(startDate), getLocalDateString(endDate))
      .and(workout => workout.endTime !== undefined)
      .toArray();

    const uniqueWorkoutDays = new Set(workouts.map(w => w.date)).size;
    const restDays = Math.max(0, totalDays - uniqueWorkoutDays);

    return {
      workoutDays: uniqueWorkoutDays,
      restDays: restDays,
      totalDays: totalDays
    };
  }, [timePeriod, deletionTracker]); // Include deletionTracker in dependencies

  const data = {
    labels: ['Workout Days', 'Rest Days'],
    datasets: [
      {
        data: [workoutStats?.workoutDays || 0, workoutStats?.restDays || 0],
        backgroundColor: [
          'rgba(255, 255, 255, 0.8)',
          'rgba(255, 255, 255, 0.1)'
        ],
        borderColor: [
          'rgba(255, 255, 255, 1)',
          'rgba(255, 255, 255, 0.2)'
        ],
        borderWidth: 2
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
          font: {
            size: 14
          },
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'rgba(255, 255, 255, 1)',
        bodyColor: 'rgba(255, 255, 255, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        displayColors: true
      }
    }
  };

  const totalDays = (workoutStats?.workoutDays || 0) + (workoutStats?.restDays || 0);
  const workoutPercentage = totalDays > 0 ? (((workoutStats?.workoutDays || 0) / totalDays) * 100).toFixed(1) : 0;

  return (
    <GlassWidget widgetId="analytics-frequency" showGlow allowColorChange className="p-4 md:p-6">
      <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">Workout Frequency</h2>

      <div className="mb-4 md:mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/60">Workout Days</span>
          <span className="text-white font-semibold">{workoutStats?.workoutDays || 0}</span>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/60">Rest Days</span>
          <span className="text-white font-semibold">{workoutStats?.restDays || 0}</span>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/60">Total Days</span>
          <span className="text-white font-semibold">{workoutStats?.totalDays || 0}</span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <span className="text-white/80 font-medium">Workout Rate</span>
          <span className="text-white font-bold">{workoutPercentage}%</span>
        </div>
      </div>

      <div className="h-[300px]">
        <Pie data={data} options={options} />
      </div>
    </GlassWidget>
  );
}

