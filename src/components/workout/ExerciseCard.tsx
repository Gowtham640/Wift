'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import GlassWidget from '@/components/ui/GlassWidget';
import SetRow from './SetRow';
import VolumeIndicator from './VolumeIndicator';
import { useSets } from '@/hooks/useWorkouts';
import { type Exercise } from '@/lib/db';
import { calculateTotalVolume, calculateVolumeIncrease } from '@/lib/utils';

interface ExerciseCardProps {
  workoutExerciseId: number;
  exercise: Exercise;
  previousBest?: { weight: number; reps: number };
  previousVolume?: number;
}

export default function ExerciseCard({
  workoutExerciseId,
  exercise,
  previousBest,
  previousVolume = 0
}: ExerciseCardProps) {
  const router = useRouter();
  const { sets, addSet, updateSet, deleteSet } = useSets(workoutExerciseId);
  const [deleteMode, setDeleteMode] = useState(false);

  const currentVolume = sets ? calculateTotalVolume(sets) : 0;
  const volumeIncrease = calculateVolumeIncrease(currentVolume, previousVolume);

  useEffect(() => {
    if (sets && sets.length > 0) {
      const firstCompleted = sets.find(s => s.completed);
      if (firstCompleted && firstCompleted.weight > 0 && firstCompleted.reps > 0) {
        // Could store first set values if needed
      }
    }
  }, [sets]);

  const handleAddSet = async () => {
    const defaultValues = previousBest;
    await addSet(workoutExerciseId, defaultValues);
  };

  const handleDeleteSet = async (setId: number) => {
    if (sets && sets.length > 1) {
      await deleteSet(setId);
    }
  };

  const getDefaultValues = (index: number) => {
    return previousBest;
  };

  return (
    <GlassWidget className="p-2 md:p-4">
      <div className="flex items-start justify-between mb-3 md:mb-4 gap-2">
        <div className="flex-1 min-w-0">
          <h3
            className="text-lg md:text-xl font-semibold text-blue-400 truncate cursor-pointer hover:text-blue-300 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/exercises/${exercise.id}`);
            }}
          >
            {exercise.name}
          </h3>
          <p className="text-xs md:text-sm text-white/60">{exercise.muscleGroup}</p>
        </div>
        <VolumeIndicator percentage={volumeIncrease} />
      </div>

      <div className="space-y-2 md:space-y-3">
        {/* Table Headers */}
        <div className="grid grid-cols-6 gap-2 mb-3 text-sm text-white/60 font-medium bg-white/5 rounded-lg p-3">
          <div className="text-center">Set</div>
          <div className="text-center">Previous</div>
          <div className="text-center">Weight</div>
          <div className="text-center">Reps</div>
          <div className="text-center">Done</div>
          <div className="text-center"></div>
        </div>

        <div className="space-y-1">
          {sets?.map((set, index) => (
            <div key={set.id} className="grid grid-cols-6 gap-2 items-center bg-white/5 rounded-lg p-2">
              <SetRow
                setNumber={index + 1}
                set={set}
                previousBest={getDefaultValues(index)}
                onUpdate={(updates) => updateSet(set.id!, updates)}
              />
              <div className="flex justify-center">
                {deleteMode && sets.length > 1 && (
                  <button
                    onClick={() => handleDeleteSet(set.id!)}
                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-3">
          <button
            onClick={handleAddSet}
            className="flex-1 btn btn-secondary py-2 md:py-3 text-sm"
          >
            <Plus size={16} />
            Add Set
          </button>

          {sets && sets.length > 1 && (
            <button
              onClick={() => setDeleteMode(!deleteMode)}
              className={`flex-1 btn py-2 md:py-3 text-sm ${
                deleteMode ? 'btn-danger' : 'btn-secondary'
              }`}
            >
              <Trash2 size={16} />
              {deleteMode ? 'Done' : 'Remove'}
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-white/10">
        <div className="flex justify-between text-xs md:text-sm">
          <span className="text-white/60">Total Volume:</span>
          <span className="text-white font-semibold">{currentVolume.toFixed(0)} kg</span>
        </div>
      </div>
    </GlassWidget>
  );
}

