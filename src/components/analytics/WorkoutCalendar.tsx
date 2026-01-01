'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Flame } from 'lucide-react';
import GlassWidget from '@/components/ui/GlassWidget';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function WorkoutCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get workout dates for the current month and calculate streaks
  const calendarData = useLiveQuery(async () => {
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);

    // Get all workouts for streak calculation (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const allWorkouts = await db.workouts
      .where('date')
      .between(ninetyDaysAgo.toISOString().split('T')[0], new Date().toISOString().split('T')[0])
      .sortBy('date');

    // Get workouts for current month
    const monthWorkouts = await db.workouts
      .where('date')
      .between(startOfMonth.toISOString().split('T')[0], endOfMonth.toISOString().split('T')[0])
      .toArray();

    const workoutDateSet = new Set(monthWorkouts.map(w => w.date));

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    let checkDate = new Date(today);

    // Check consecutive days backwards from today
    for (let i = 0; i < 365; i++) { // Max 1 year back
      const dateString = checkDate.toISOString().split('T')[0];
      const hasWorkout = allWorkouts.some(w => w.date === dateString);

      if (hasWorkout) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;

    for (const workout of allWorkouts) {
      const workoutDate = new Date(workout.date);
      const nextDay = new Date(workoutDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayString = nextDay.toISOString().split('T')[0];

      const hasNextDay = allWorkouts.some(w => w.date === nextDayString);

      if (hasNextDay) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak + 1);
        tempStreak = 0;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak + 1);

    return {
      workoutDates: workoutDateSet,
      currentStreak,
      longestStreak,
      totalWorkoutsThisMonth: monthWorkouts.length
    };
  }, [year, month]);

  const getMonthDates = () => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const dates = [];
    const current = new Date(startDate);

    while (current <= lastDay || dates.length % 7 !== 0) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  };

  const dates = getMonthDates();

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === month;
  };

  const hasWorkout = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return calendarData?.workoutDates.has(dateString) || false;
  };

  return (
    <GlassWidget widgetId="analytics-workout-calendar" showGlow allowColorChange className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
          <Calendar size={20} />
          Workout Calendar
        </h2>
        <div className="text-right">
          <div className="flex items-center gap-1 text-orange-400">
            <Flame size={16} />
            <span className="font-bold">{calendarData?.currentStreak || 0}</span>
            <span className="text-sm text-white/60">day streak</span>
          </div>
          <p className="text-xs text-white/40">
            Best: {calendarData?.longestStreak || 0} days
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          {MONTHS[month]} {year}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={previousMonth}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={16} className="text-white/60" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ChevronRight size={16} className="text-white/60" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-4">
        {DAYS.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-white/60 mb-2">
            {day}
          </div>
        ))}

        {dates.map((date, index) => {
          const isCurrentMonthDate = isCurrentMonth(date);
          const isTodayDate = isToday(date);
          const hasWorkoutDate = hasWorkout(date);

          return (
            <div
              key={index}
              className={`
                aspect-square flex items-center justify-center rounded-lg text-sm
                transition-colors relative
                ${!isCurrentMonthDate ? 'text-white/20' : 'text-white/80'}
                ${isTodayDate ? 'bg-white/30 border border-white/50 font-bold' : ''}
                ${hasWorkoutDate && !isTodayDate ? 'bg-green-500/20 border border-green-500/30' : ''}
                ${!hasWorkoutDate && !isTodayDate ? 'hover:bg-white/5' : ''}
              `}
            >
              {date.getDate()}
              {hasWorkoutDate && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-green-400 rounded-full" />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-white/30 border border-white/50 rounded" />
            <span className="text-white/60">Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500/20 border border-green-500/30 rounded" />
            <span className="text-white/60">Workout</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white/60">
            {calendarData?.totalWorkoutsThisMonth || 0} workouts this month
          </p>
        </div>
      </div>
    </GlassWidget>
  );
}
