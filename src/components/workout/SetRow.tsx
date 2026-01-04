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
  value={set.weight || ''}
  onChange={(e) => onUpdate({ weight: Number(e.target.value) || 0 })}
  placeholder="kg"
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
  value={set.reps || ''}
  onChange={(e) => onUpdate({ reps: Number(e.target.value) || 0 })}
  placeholder="reps"
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
          onClick={() => onUpdate({ completed: !set.completed })}
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
