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
  // Track workouts to force re-renders when workouts are added/completed/deleted
  const deletionTracker = useLiveQuery(async () => {
    return await db.workouts.count(); // Changes when workouts are added/deleted
  });

  const workoutCount = useLiveQuery(async () => {
    const { startDate, endDate } = getDateRangeForPeriod(timePeriod);

    // Get all workouts first, then filter by date and completion (same as debugAnalytics)
    const allWorkouts = await db.workouts.toArray();

    const completedWorkouts = allWorkouts.filter(workout =>
      workout.endTime !== undefined &&
      workout.date >= getLocalDateString(startDate) &&
      workout.date <= getLocalDateString(endDate)
    );

    return completedWorkouts.length;
  }, [timePeriod, deletionTracker]); // Include deletionTracker in dependencies

  const data = {
    labels: ['Workouts'],
    datasets: [
      {
        data: [workoutCount || 0],
        backgroundColor: ['rgba(255, 255, 255, 0.8)'],
        borderColor: ['rgba(255, 255, 255, 1)'],
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

  return (
    <GlassWidget widgetId="analytics-frequency" showGlow allowColorChange className="p-4 md:p-6">
      <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">Total Workouts</h2>

      <div className="text-center py-8">
        <div className="text-6xl md:text-8xl font-bold text-white mb-2">
          {workoutCount || 0}
        </div>
        <div className="text-white/60 text-lg">
          workouts completed
        </div>
      </div>

      <div className="h-[200px] flex items-center justify-center">
        <div className="w-32 h-32 rounded-full border-8 border-white/20 flex items-center justify-center">
          <div className="text-3xl font-bold text-white">
            {workoutCount || 0}
          </div>
        </div>
      </div>
    </GlassWidget>
  );
}

