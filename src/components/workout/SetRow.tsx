'use client';

import { useState, useEffect } from 'react';
import { CheckSquare, Square } from 'lucide-react';
import { type Set } from '@/lib/db';

interface SetRowProps {
  setNumber: number;
  set: Set;
  previousBest?: { weight: number; reps: number };
  sharedWeight?: number;
  sharedReps?: number;
  onUpdate: (updates: Partial<Set>) => void;
  onValueChange?: (field: 'weight' | 'reps', value: number) => void;
}

export default function SetRow({
  setNumber,
  set,
  previousBest,
  sharedWeight,
  sharedReps,
  onUpdate,
  onValueChange
}: SetRowProps) {
  // Calculate default values (placeholders become real values)
  const defaultWeight = typeof (sharedWeight ?? previousBest?.weight) === 'number'
    ? (sharedWeight ?? previousBest?.weight)!
    : 0;
  const defaultReps = typeof (sharedReps ?? previousBest?.reps) === 'number'
    ? (sharedReps ?? previousBest?.reps)!
    : 0;

  // Local state for inputs - allow empty values
  const [localWeight, setLocalWeight] = useState<number | ''>(set.weight || '');
  const [localReps, setLocalReps] = useState<number | ''>(set.reps || '');

  // Update local state when set prop changes (only if not currently editing)
  useEffect(() => {
    // Don't override if user is actively editing (local state is not empty and different from db)
    const currentWeight = typeof localWeight === 'number' ? localWeight : 0;
    const currentReps = typeof localReps === 'number' ? localReps : 0;

    if (currentWeight !== set.weight && currentWeight !== 0) return;
    if (currentReps !== set.reps && currentReps !== 0) return;

    setLocalWeight(set.weight || '');
    setLocalReps(set.reps || '');
  }, [set.weight, set.reps]);

  // Handle weight input change - allow empty values
  const handleWeightChange = (value: string) => {
    const numValue = value === '' ? '' : Number(value);
    setLocalWeight(numValue);

    // Only update database if it's a valid number
    if (typeof numValue === 'number') {
      onUpdate({ weight: numValue });
      onValueChange?.('weight', numValue);
    }
  };

  // Handle reps input change - allow empty values
  const handleRepsChange = (value: string) => {
    const numValue = value === '' ? '' : Number(value);
    setLocalReps(numValue);

    // Only update database if it's a valid number
    if (typeof numValue === 'number') {
      onUpdate({ reps: numValue });
      onValueChange?.('reps', numValue);
    }
  };

  // Calculate display placeholder (for UI only)
  const weightPlaceholder = sharedWeight ?? previousBest?.weight ?? 'kg';
  const repsPlaceholder = sharedReps ?? previousBest?.reps ?? 'reps';

  return (
    <div className="contents">
      <div className="text-center py-2">
        <span className="text-white/60 font-mono text-sm">{setNumber}</span>
      </div>

      <div className="text-center py-2">
        {previousBest ? (
          <span className="text-white/40 text-sm">
            {previousBest.weight}×{previousBest.reps}
          </span>
        ) : (
          <span className="text-white/20 text-sm">-</span>
        )}
      </div>

      <div className="py-2 bg-transparent rounded-none">
        <input
          type="number"
          value={localWeight}
          onChange={(e) => handleWeightChange(e.target.value)}
          placeholder={typeof weightPlaceholder === 'number' ? weightPlaceholder.toString() : weightPlaceholder}
          className="
            w-full
            bg-transparent
            text-center
            text-sm
            border-0
            outline-none
            shadow-none
            appearance-none
            focus:outline-none
            focus:ring-0
            focus:border-0
            p-0
            m-0
          "
          inputMode="decimal"
        />
      </div>

      <div className="px-1 py-2 bg-transparent rounded-none">
        <input
          type="number"
          value={localReps}
          onChange={(e) => handleRepsChange(e.target.value)}
          placeholder={typeof repsPlaceholder === 'number' ? repsPlaceholder.toString() : repsPlaceholder}
          className="
            w-full
            bg-transparent
            text-center
            text-sm
            border-0
            outline-none
            shadow-none
            appearance-none
            focus:outline-none
            focus:ring-0
            focus:border-0
            p-0
            m-0
          "
          inputMode="decimal"
        />
      </div>

      <div className="flex justify-center py-2">
        <button
          onClick={() => {
            const isCompleting = !set.completed;
            const updates: Partial<Set> = { completed: isCompleting };

            // BULLETPROOF: When completing a set, ensure it has valid weight/reps values
            if (isCompleting) {
              const finalWeight = (typeof localWeight === 'number' && localWeight > 0) ? localWeight : defaultWeight;
              const finalReps = (typeof localReps === 'number' && localReps > 0) ? localReps : defaultReps;

              updates.weight = finalWeight;
              updates.reps = finalReps;

              // Update local state to match final values
              setLocalWeight(finalWeight);
              setLocalReps(finalReps);
            }

            onUpdate(updates);
          }}
          className={`p-2 rounded-lg transition-colors ${
            set.completed
              ? 'bg-green-500/20 text-green-400'
              : 'bg-white/5 text-white/40 hover:bg-white/10'
          }`}
        >
          {set.completed ? <CheckSquare size={18} /> : <Square size={18} />}
        </button>
      </div>
    </div>
  );
}
