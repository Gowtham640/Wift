'use client';

import { CheckSquare, Square } from 'lucide-react';
import Input from '@/components/ui/Input';
import { type Set } from '@/lib/db';

interface SetRowProps {
  setNumber: number;
  set: Set;
  previousBest?: { weight: number; reps: number };
  onUpdate: (updates: Partial<Set>) => void;
}

export default function SetRow({ setNumber, set, previousBest, onUpdate }: SetRowProps) {
  return (
    <div className="grid grid-cols-5 gap-2 md:gap-3 items-center">
      <div className="text-center">
        <span className="text-white/60 font-mono text-sm md:text-base">{setNumber}</span>
      </div>

      <div className="text-center">
        {previousBest ? (
          <span className="text-white/40 text-xs md:text-sm">
            {previousBest.weight}×{previousBest.reps}
          </span>
        ) : (
          <span className="text-white/20 text-xs md:text-sm">-</span>
        )}
      </div>

      <Input
        type="number"
        value={set.weight || ''}
        onChange={(e) => onUpdate({ weight: parseFloat(e.target.value) || 0 })}
        placeholder="kg"
        className="text-center"
        min="0"
        step="0.5"
      />

      <Input
        type="number"
        value={set.reps || ''}
        onChange={(e) => onUpdate({ reps: parseInt(e.target.value) || 0 })}
        placeholder="reps"
        className="text-center"
        min="0"
        step="1"
      />

      <div className="flex justify-center">
        <button
          onClick={() => onUpdate({ completed: !set.completed })}
          className={`p-2 rounded-lg transition-colors ${
            set.completed
              ? 'bg-green-500/20 text-green-400'
              : 'bg-white/5 text-white/40 hover:bg-white/10'
          }`}
        >
          {set.completed ? <CheckSquare size={20} /> : <Square size={20} />}
        </button>
      </div>
    </div>
  );
}

