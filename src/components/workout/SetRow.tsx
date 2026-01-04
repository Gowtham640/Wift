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
  // Local state for inputs
  const [localWeight, setLocalWeight] = useState(set.weight || 0);
  const [localReps, setLocalReps] = useState(set.reps || 0);

  // Update local state when set prop changes
  useEffect(() => {
    setLocalWeight(set.weight || 0);
    setLocalReps(set.reps || 0);
  }, [set.weight, set.reps]);

  // Update local state when shared values change (from other sets)
  useEffect(() => {
    if (sharedWeight !== undefined && localWeight === 0) {
      setLocalWeight(sharedWeight);
    }
    if (sharedReps !== undefined && localReps === 0) {
      setLocalReps(sharedReps);
    }
  }, [sharedWeight, sharedReps, localWeight, localReps]);

  // Handle weight input change
  const handleWeightChange = (value: number) => {
    setLocalWeight(value);
    onUpdate({ weight: value });
    onValueChange?.('weight', value);
  };

  // Handle reps input change
  const handleRepsChange = (value: number) => {
    setLocalReps(value);
    onUpdate({ reps: value });
    onValueChange?.('reps', value);
  };

  // Calculate placeholder values
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
          value={localWeight || ''}
          onChange={(e) => handleWeightChange(Number(e.target.value) || 0)}
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
          value={localReps || ''}
          onChange={(e) => handleRepsChange(Number(e.target.value) || 0)}
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

            // If marking as completed and no values entered, use placeholder values
            if (isCompleting && (!localWeight || !localReps)) {
              if (!localWeight && typeof weightPlaceholder === 'number') {
                updates.weight = weightPlaceholder;
                setLocalWeight(weightPlaceholder);
              }
              if (!localReps && typeof repsPlaceholder === 'number') {
                updates.reps = repsPlaceholder;
                setLocalReps(repsPlaceholder);
              }
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
