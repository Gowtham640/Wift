import { useState } from 'react';
import { Play, Edit, Trash2, Dumbbell } from 'lucide-react';
import GlassWidget from '@/components/ui/GlassWidget';
import { useRouter } from 'next/navigation';
import { useWorkouts } from '@/hooks/useWorkouts';
import { showToast } from '@/components/ui/Toast';

interface RoutineCardProps {
  id: number;
  name: string;
  exerciseCount: number;
  notes?: string;
  onEdit: () => void;
  onDelete: () => void;
}

export default function RoutineCard({
  id,
  name,
  exerciseCount,
  notes,
  onEdit,
  onDelete
}: RoutineCardProps) {
  const router = useRouter();
  const { createWorkout } = useWorkouts();
  const [isStarting, setIsStarting] = useState(false);

  const handleStart = async () => {
    if (isStarting) return;

    setIsStarting(true);
    try {
      const workoutId = await createWorkout(id);
      router.push(`/workouts/${workoutId}`);
    } catch (error) {
      console.error('Failed to start routine workout:', error);
      showToast('Failed to start workout. Please try again.', 'error');
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <GlassWidget className="p-4 md:p-6 hover:scale-[1.02] transition-transform">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg md:text-xl font-semibold text-white mb-2 truncate">{name}</h3>
          <div className="flex items-center gap-2 text-white/60 text-xs md:text-sm">
            <Dumbbell size={14} />
            <span>{exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}</span>
          </div>
          {notes && (
            <p className="text-xs md:text-sm text-white/40 mt-2 line-clamp-2">{notes}</p>
          )}
        </div>
        <div className="flex gap-1 ml-2">
          <button
            onClick={onEdit}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <Edit size={16} className="text-white/60" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors"
          >
            <Trash2 size={16} className="text-red-400" />
          </button>
        </div>
      </div>

      <button
        onClick={handleStart}
        disabled={isStarting}
        className="w-full btn btn-primary py-3"
      >
        <Play size={16} />
        {isStarting ? 'Starting...' : 'Start Workout'}
      </button>
    </GlassWidget>
  );
}

