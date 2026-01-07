import { Clock, Dumbbell, TrendingUp } from 'lucide-react';
import GlassWidget from '@/components/ui/GlassWidget';
import { formatDate, formatDuration } from '@/lib/utils';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/db';

export default function LatestWorkoutWidget() {
  const router = useRouter();

  const handleExerciseClick = (exerciseId: number) => {
    router.push(`/exercises/${exerciseId}`);
  };

  // Handle data loading internally to avoid blocking page render
  const workout = useLiveQuery(async () => {
    const workout = await db.workouts.orderBy('date').reverse().first();
    if (!workout) return null;

    const routine = workout.routineId
      ? await db.routines.get(workout.routineId)
      : undefined;

    const workoutExercises = await db.workout_exercises
      .where('workoutId')
      .equals(workout.id!)
      .sortBy('order');

    const exercisesWithDetails = await Promise.all(
      workoutExercises.map(async (we) => {
        const exercise = await db.exercises.get(we.exerciseId);
        const sets = await db.sets
          .where('workoutExerciseId')
          .equals(we.id!)
          .toArray();

        return {
          workoutExercise: we,
          exercise: exercise!,
          sets
        };
      })
    );

    const totalVolume = exercisesWithDetails.reduce(
      (sum, ex) =>
        sum +
        ex.sets
          .filter((s) => s.completed)
          .reduce((vol, s) => vol + s.weight * s.reps, 0),
      0
    );

    const result = {
      workout,
      routine,
      exercises: exercisesWithDetails,
      totalVolume,
      duration: workout.endTime ? workout.endTime - workout.startTime : undefined
    };

    return result;
  }, []);

  // Show loading skeleton immediately
  if (workout === undefined) {
    return (
      <GlassWidget widgetId="dashboard-latest-workout" showGlow allowColorChange className="p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4">Latest Workout</h2>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-white/20 rounded w-3/4"></div>
          <div className="h-3 bg-white/10 rounded w-1/2"></div>
          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="h-12 bg-white/10 rounded"></div>
            <div className="h-12 bg-white/10 rounded"></div>
            <div className="h-12 bg-white/10 rounded"></div>
          </div>
        </div>
      </GlassWidget>
    );
  }

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
    <GlassWidget widgetId="dashboard-latest-workout" showGlow allowColorChange className="p-4 md:p-6 mb-10">
      <h2 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4">Latest Workout</h2>

      <div className="max-h-64 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}>
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
                <span
                  className="text-sm text-white/80 cursor-pointer hover:text-blue-400 transition-colors"
                  onClick={() => ex.exercise.id && handleExerciseClick(ex.exercise.id)}
                >
                  {ex.exercise.name}
                </span>
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
      </div>
    </GlassWidget>
  );
}

