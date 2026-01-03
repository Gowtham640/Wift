'use client';

import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { Trash2, Edit, Calendar, Clock, Dumbbell } from 'lucide-react';
import Button from '@/components/ui/Button';
import GlassWidget from '@/components/ui/GlassWidget';
import { formatDuration } from '@/lib/utils';
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

  // Fetch routine name if workout has routineId
  const routine = useLiveQuery(async () => {
    if (workout.routineId) {
      return await db.routines.get(workout.routineId);
    }
    return null;
  }, [workout.routineId]);

  // Use actual routine name
  const workoutName = routine?.name
    ? routine.name
    : (workout.routineId ? 'Unknown Routine' : 'Free Workout');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <GlassWidget className="p-4 md:p-6 hover:scale-[1.02] transition-transform">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2">
            {workoutName}
          </h3>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-white/60">
              <Calendar size={14} />
              <span>{formatDate(workout.date)}</span>
            </div>
            {isCompleted && duration > 0 && (
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Clock size={14} />
                <span>{formatDuration(duration)}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-1 ml-2">
          <Button
            variant="secondary"
            onClick={() => onEdit(workout)}
            className="p-2"
            title="Edit workout"
          >
            <Edit size={14} />
          </Button>
          <Button
            variant="secondary"
            onClick={() => onDelete(workout.id!)}
            className="p-2 text-red-400 hover:text-red-300"
            title="Delete workout"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-green-400' : 'bg-yellow-400'}`} />
          <span className="text-sm text-white/60">
            {isCompleted ? 'Completed' : 'In Progress'}
          </span>
        </div>
        <Button
          variant="secondary"
          onClick={() => router.push(`/workouts/${workout.id}`)}
        >
          View Details
        </Button>
      </div>
    </GlassWidget>
  );
}
