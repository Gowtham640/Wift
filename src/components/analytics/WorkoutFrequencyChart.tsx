'use client';

import { Flame, Clock } from 'lucide-react';
import GlassWidget from '@/components/ui/GlassWidget';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { TimePeriod, getDateRangeForPeriod } from './TimeFilter';
import { getLocalDateString, formatDuration } from '@/lib/utils';


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

  const workoutData = useLiveQuery(async () => {
    const { startDate, endDate } = getDateRangeForPeriod(timePeriod);

    // Get all workouts first, then filter by date and completion
    const allWorkouts = await db.workouts.toArray();

    const completedWorkouts = allWorkouts.filter(workout =>
      workout.endTime !== undefined &&
      workout.date >= getLocalDateString(startDate) &&
      workout.date <= getLocalDateString(endDate)
    );

    // Calculate current streak
    let currentStreak = 0;
    const today = getLocalDateString(new Date());
    let checkDate = new Date();

    // Check consecutive days backwards from today
    for (let i = 0; i < 365; i++) {
      const dateString = getLocalDateString(checkDate);
      const hasWorkout = allWorkouts.some(w =>
        w.endTime !== undefined && w.date === dateString
      );

      if (hasWorkout) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate average duration
    let avgDuration = 0;
    if (completedWorkouts.length > 0) {
      const durations = completedWorkouts
        .map(workout => workout.endTime! - workout.startTime)
        .filter(duration => duration > 0 && duration < 24 * 60 * 60 * 1000); // Valid durations under 24 hours

      if (durations.length > 0) {
        const totalDuration = durations.reduce((sum, duration) => sum + duration, 0);
        avgDuration = Math.round(totalDuration / durations.length);
      }
    }

    return {
      count: completedWorkouts.length,
      currentStreak,
      avgDuration
    };
  }, [timePeriod, deletionTracker]);


  if (!workoutData) {
    return (
      <GlassWidget widgetId="analytics-frequency" showGlow allowColorChange className="p-4 md:p-6 animate-pulse">
        <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">Total Workouts</h2>
        <div className="h-32 bg-white/10 rounded"></div>
      </GlassWidget>
    );
  }

  return (
    <GlassWidget widgetId="analytics-frequency" showGlow allowColorChange className="p-4 md:p-6">
      <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">Total Workouts</h2>

      <div className="text-center mb-6">
        <div className="text-4xl md:text-5xl font-bold text-white mb-1">
          {workoutData.count}
        </div>
        <div className="text-white/60 text-sm">
          workouts completed
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Current Streak */}
        <div className="text-center p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <div className="flex items-center justify-center gap-1 mb-2">
            <Flame className="text-orange-400" size={16} />
            <span className="text-xs text-white/60 font-medium">Streak</span>
          </div>
          <div className="text-2xl font-bold text-orange-400">
            {workoutData.currentStreak}
          </div>
          <div className="text-xs text-white/40">days</div>
        </div>

        {/* Average Duration */}
        <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center justify-center gap-1 mb-2">
            <Clock className="text-blue-400" size={16} />
            <span className="text-xs text-white/60 font-medium">Avg Session</span>
          </div>
          <div className="text-lg font-bold text-blue-400">
            {workoutData.avgDuration > 0 ? formatDuration(workoutData.avgDuration) : '--:--'}
          </div>
          <div className="text-xs text-white/40">duration</div>
        </div>
      </div>
    </GlassWidget>
  );
}

