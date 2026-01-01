'use client';

import { useState, useEffect } from 'react';
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
  const { sets, addSet, updateSet, deleteSet } = useSets(workoutExerciseId);
  const [firstSetValues, setFirstSetValues] = useState<{ weight: number; reps: number } | null>(null);
  const [deleteMode, setDeleteMode] = useState(false);

  const currentVolume = sets ? calculateTotalVolume(sets) : 0;
  const volumeIncrease = calculateVolumeIncrease(currentVolume, previousVolume);

  useEffect(() => {
    if (sets && sets.length > 0) {
      const firstCompleted = sets.find(s => s.completed);
      if (firstCompleted && firstCompleted.weight > 0 && firstCompleted.reps > 0) {
        setFirstSetValues({ weight: firstCompleted.weight, reps: firstCompleted.reps });
      }
    }
  }, [sets]);

  const handleAddSet = async () => {
    const defaultValues = firstSetValues || previousBest;
    await addSet(workoutExerciseId, defaultValues);
  };

  const handleDeleteSet = async (setId: number) => {
    if (sets && sets.length > 1) {
      await deleteSet(setId);
    }
  };

  const getDefaultValues = (index: number) => {
    if (firstSetValues) return firstSetValues;
    return previousBest;
  };

  return (
    <GlassWidget className="p-4 md:p-6">
      <div className="flex items-start justify-between mb-3 md:mb-4 gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg md:text-xl font-semibold text-white truncate">{exercise.name}</h3>
          <p className="text-xs md:text-sm text-white/60">{exercise.muscleGroup}</p>
        </div>
        <VolumeIndicator percentage={volumeIncrease} />
      </div>

      <div className="space-y-2 md:space-y-3">
        <div className="grid grid-cols-5 gap-2 md:gap-3 mb-2 text-xs md:text-sm text-white/60 font-medium">
          <div className="text-center">Set</div>
          <div className="text-center hidden sm:block">Previous</div>
          <div className="text-center sm:hidden">Prev</div>
          <div className="text-center">Weight</div>
          <div className="text-center">Reps</div>
          <div className="text-center">Done</div>
        </div>

        {sets?.map((set, index) => (
          <div key={set.id} className="flex items-center gap-2">
            <SetRow
              setNumber={index + 1}
              set={set}
              previousBest={getDefaultValues(index)}
              onUpdate={(updates) => updateSet(set.id!, updates)}
            />
            {deleteMode && sets.length > 1 && (
              <button
                onClick={() => handleDeleteSet(set.id!)}
                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors"
              >
                <Trash2 size={16} className="text-red-400" />
              </button>
            )}
          </div>
        ))}

        <div className="flex gap-2 mt-2">
          <button
            onClick={handleAddSet}
            className="flex-1 btn btn-secondary"
          >
            <Plus size={16} />
            Add Set
          </button>

          {sets && sets.length > 1 && (
            <button
              onClick={() => setDeleteMode(!deleteMode)}
              className={`flex-1 btn ${deleteMode ? 'btn-danger' : 'btn-secondary'}`}
            >
              <Trash2 size={16} />
              {deleteMode ? 'Done' : 'Remove'}
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex justify-between text-sm">
          <span className="text-white/60">Total Volume:</span>
          <span className="text-white font-semibold">{currentVolume.toFixed(0)} kg</span>
        </div>
      </div>
    </GlassWidget>
  );
}

