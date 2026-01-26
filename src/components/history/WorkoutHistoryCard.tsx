'use client';

import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { Trash2, Edit, Calendar, Clock, Dumbbell, TrendingUp } from 'lucide-react';
import Button from '@/components/ui/Button';
import GlassWidget from '@/components/ui/GlassWidget';
import { formatDuration, calculateTotalVolume } from '@/lib/utils';
import { db } from '@/lib/db';
import type { Workout } from '@/lib/db';

interface WorkoutHistoryCardProps {
  workout: Workout;
  onEdit: (workout: Workout) => void;
  onDelete: (id: number) => void;
}

export default function WorkoutHistoryCard({ workout, onEdit, onDelete }: WorkoutHistoryCardProps) {
  const router = useRouter();

  const isCompleted = !!workout.endTime;
  const duration = workout.endTime ? workout.endTime - workout.startTime : 0;

  // Fetch workout details including volume and exercises
  const workoutDetails = useLiveQuery(async () => {
    if (!workout.id) return null;

    // Get routine name
    const routine = workout.routineId
      ? await db.routines.get(workout.routineId)
      : null;

    // Get workout exercises and their sets
    const workoutExercises = await db.workout_exercises
      .where('workoutId')
      .equals(workout.id)
      .sortBy('order');

    const exercisesWithDetails = await Promise.all(
      workoutExercises.slice(0, 3).map(async (we) => {
        const exercise = await db.exercises.get(we.exerciseId);
        const sets = await db.sets
          .where('workoutExerciseId')
          .equals(we.id!)
          .toArray();

        const volume = calculateTotalVolume(sets);
        return {
          exercise: exercise!,
          volume,
          setsCount: sets.length
        };
      })
    );

    // Calculate total volume
    const totalVolume = exercisesWithDetails.reduce((sum, ex) => sum + ex.volume, 0);

    return {
      routineName: routine?.name || (workout.routineId ? 'Unknown Routine' : 'Free Workout'),
      totalVolume,
      topExercises: exercisesWithDetails
    };
  }, [workout.id, workout.routineId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleCardClick = () => {
    router.push(`/workouts/${workout.id}`);
  };

  return (
    <GlassWidget
      className="p-4 md:p-6 hover:scale-[1.01] transition-transform cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="space-y-1">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/50">Routine</p>
              <h3 className="text-xl font-semibold text-white">
                {workoutDetails?.routineName || 'Loading...'}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
            <div className="flex items-center gap-2">
              <Calendar size={14} />
              <span>{formatDate(workout.date)}</span>
            </div>
            {isCompleted && duration > 0 && (
              <div className="flex items-center gap-2">
                <Clock size={14} />
                <span>{formatDuration(duration)}</span>
              </div>
            )}
            {workoutDetails?.totalVolume && workoutDetails.totalVolume > 0 && (
              <div className="flex items-center gap-2">
                <TrendingUp size={14} />
                <span>{workoutDetails.totalVolume.toFixed(0)} kg</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-1 ml-2">
          <Button
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(workout);
            }}
            className="p-2"
            title="Edit workout"
          >
            <Edit size={14} />
          </Button>
          <Button
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(workout.id!);
            }}
            className="p-2 text-red-400 hover:text-red-300"
            title="Delete workout"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {/* Top 3 exercises */}
      {workoutDetails?.topExercises && workoutDetails.topExercises.length > 0 && (
        <div className="space-y-2 mb-4">
          <h4 className="text-sm font-medium text-white/80">Top Exercises:</h4>
          <div className="space-y-1">
            {workoutDetails.topExercises.map((exercise, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-white/70 truncate">{exercise.exercise.name}</span>
                <div className="flex items-center gap-2 text-white/50">
                  <span>{exercise.setsCount} sets</span>
                  <span>•</span>
                  <span>{exercise.volume.toFixed(0)} kg</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-green-400' : 'bg-yellow-400'}`} />
          <span className="text-sm text-white/60">
            {isCompleted ? 'Completed' : 'In Progress'}
          </span>
        </div>
        <Button
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/workouts/${workout.id}`);
          }}
        >
          View Details
        </Button>
      </div>
    </GlassWidget>
  );
}
