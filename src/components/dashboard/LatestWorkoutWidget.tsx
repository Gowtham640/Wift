import { Clock, Dumbbell, TrendingUp } from 'lucide-react';
import GlassWidget from '@/components/ui/GlassWidget';
import { type WorkoutWithDetails } from '@/lib/types';
import { formatDate, formatDuration } from '@/lib/utils';
import Link from 'next/link';

interface LatestWorkoutWidgetProps {
  workout: WorkoutWithDetails | null;
}

export default function LatestWorkoutWidget({ workout }: LatestWorkoutWidgetProps) {
  if (!workout) {
    return (
      <GlassWidget widgetId="dashboard-latest-workout" showGlow allowColorChange className="p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4">Latest Workout</h2>
        <p className="text-center text-sm md:text-base text-white/40 py-6 md:py-8">
          No workouts yet. Start your first workout!
        </p>
      </GlassWidget>
    );
  }

  return (
    <GlassWidget widgetId="dashboard-latest-workout" showGlow allowColorChange className="p-4 md:p-6">
      <h2 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4">Latest Workout</h2>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {workout.routine?.name || 'Free Workout'}
          </h3>
          <p className="text-sm text-white/60">{formatDate(workout.workout.date)}</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-white/40" />
            <div>
              <p className="text-xs text-white/60">Duration</p>
              <p className="text-sm font-semibold text-white">
                {workout.duration ? formatDuration(workout.duration) : '-'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Dumbbell size={16} className="text-white/40" />
            <div>
              <p className="text-xs text-white/60">Exercises</p>
              <p className="text-sm font-semibold text-white">
                {workout.exercises.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-white/40" />
            <div>
              <p className="text-xs text-white/60">Volume</p>
              <p className="text-sm font-semibold text-white">
                {workout.totalVolume.toFixed(0)} kg
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-white/10">
          <p className="text-xs text-white/60 mb-2">Exercises</p>
          <div className="space-y-1">
            {workout.exercises.slice(0, 3).map((ex) => (
              <div key={ex.workoutExercise.id} className="flex items-center justify-between">
                <span className="text-sm text-white/80">{ex.exercise.name}</span>
                <span className="text-xs text-white/40">
                  {ex.sets.filter(s => s.completed).length} sets
                </span>
              </div>
            ))}
            {workout.exercises.length > 3 && (
              <p className="text-xs text-white/40">
                +{workout.exercises.length - 3} more
              </p>
            )}
          </div>
        </div>

        <Link
          href={`/workouts/${workout.workout.id}`}
          className="block w-full btn btn-secondary text-center"
        >
          View Workout
        </Link>
      </div>
    </GlassWidget>
  );
}

