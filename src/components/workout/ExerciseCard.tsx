'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Check, X } from 'lucide-react';
import GlassWidget from '@/components/ui/GlassWidget';
import VolumeIndicator from './VolumeIndicator';
import { useSets } from '@/hooks/useWorkouts';
import { type Exercise } from '@/lib/db';
import { calculateTotalVolume, calculateVolumeIncrease } from '@/lib/utils';
import Input from '@/components/ui/Input';

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
  const { sets, addSet, updateSet } = useSets(workoutExerciseId);
  const [editingSet, setEditingSet] = useState<number | null>(null);
  const [tempValues, setTempValues] = useState<{ weight: number; reps: number } | null>(null);

  const currentVolume = sets ? calculateTotalVolume(sets) : 0;
  const volumeIncrease = calculateVolumeIncrease(currentVolume, previousVolume);

  const handleCardClick = () => {
    router.push('/analytics');
  };

  const handleAddSet = async () => {
    const defaultValues = previousBest || { weight: 0, reps: 0 };
    await addSet(workoutExerciseId, defaultValues);
  };

  const startEditing = (setId: number, currentValues: { weight: number; reps: number }) => {
    setEditingSet(setId);
    setTempValues(currentValues);
  };

  const saveSet = async () => {
    if (editingSet && tempValues) {
      await updateSet(editingSet, {
        weight: tempValues.weight,
        reps: tempValues.reps,
        completed: true
      });
      setEditingSet(null);
      setTempValues(null);
    }
  };

  const cancelEditing = () => {
    setEditingSet(null);
    setTempValues(null);
  };

  const handleSwipeLeft = (setId: number) => {
    // This would need to be implemented with touch events
    // For now, we'll keep a simple delete option
    console.log('Swipe left on set:', setId);
  };

  return (
    <GlassWidget
      className="p-4 md:p-6 cursor-pointer hover:scale-[1.01] transition-transform"
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between mb-4 gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg md:text-xl font-semibold text-blue-400 truncate">{exercise.name}</h3>
          <p className="text-xs md:text-sm text-white/60">{exercise.muscleGroup}</p>
        </div>
        <VolumeIndicator percentage={volumeIncrease} />
      </div>

      <div className="space-y-3">
        {sets?.map((set, index) => (
          <div key={set.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
            <span className="text-white/60 font-mono text-sm w-8">#{index + 1}</span>

            {editingSet === set.id ? (
              <div className="flex-1 flex items-center gap-2">
                <Input
                  type="number"
                  value={tempValues?.weight || ''}
                  onChange={(e) => setTempValues(prev => ({ ...prev!, weight: parseFloat(e.target.value) || 0 }))}
                  placeholder="kg"
                  className="w-20 text-center"
                  min="0"
                  step="0.5"
                  autoFocus
                />
                <span className="text-white/40">×</span>
                <Input
                  type="number"
                  value={tempValues?.reps || ''}
                  onChange={(e) => setTempValues(prev => ({ ...prev!, reps: parseInt(e.target.value) || 0 }))}
                  placeholder="reps"
                  className="w-20 text-center"
                  min="0"
                  step="1"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    saveSet();
                  }}
                  className="p-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    cancelEditing();
                  }}
                  className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-white">
                    {set.weight || 0} kg × {set.reps || 0} reps
                  </span>
                  {set.completed && (
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {previousBest && (
                    <span className="text-white/40 text-xs">
                      PB: {previousBest.weight}×{previousBest.reps}
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(set.id!, { weight: set.weight, reps: set.reps });
                    }}
                    className="text-white/60 hover:text-white text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20"
                  >
                    Edit
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleAddSet();
          }}
          className="w-full btn btn-secondary py-3"
        >
          <Plus size={16} />
          Add Set
        </button>
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

