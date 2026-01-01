'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import GlassWidget from '@/components/ui/GlassWidget';
import { getMonthDates } from '@/lib/utils';

interface CalendarWidgetProps {
  workoutDates: string[];
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function CalendarWidget({ workoutDates }: CalendarWidgetProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const dates = getMonthDates(year, month);
  const workoutDateSet = new Set(workoutDates);

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
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return workoutDateSet.has(dateString);
  };

  return (
    <GlassWidget widgetId="dashboard-calendar" showGlow allowColorChange className="p-4 md:p-6">
      <div className="flex items-center justify-between pr-10 mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-bold text-white">
          {MONTHS[month]} {year}
        </h2>
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

      <div className="grid grid-cols-7 gap-2">
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

      <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-white/30 border border-white/50 rounded" />
          <span className="text-white/60">Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500/20 border border-green-500/30 rounded" />
          <span className="text-white/60">Workout</span>
        </div>
      </div>
    </GlassWidget>
  );
}

