'use client';

import { useState, FormEvent } from 'react';
import { type Exercise } from '@/lib/db';
import { MUSCLE_GROUPS, EQUIPMENT_TYPES } from '@/lib/types';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface ExerciseFormProps {
  exercise?: Exercise;
  onSubmit: (exercise: Omit<Exercise, 'id'>) => Promise<void>;
  onCancel?: () => void;
}

export default function ExerciseForm({
  exercise,
  onSubmit,
  onCancel
}: ExerciseFormProps) {
  const [formData, setFormData] = useState({
    name: exercise?.name || '',
    muscleGroup: exercise?.muscleGroup || '',
    equipment: exercise?.equipment || '',
    isCustom: exercise?.isCustom ?? true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.muscleGroup) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({ name: '', muscleGroup: '', equipment: '', isCustom: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-white/80 mb-2">
          Exercise Name *
        </label>
        <Input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Bench Press"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/80 mb-2">
          Muscle Group *
        </label>
        <select
          value={formData.muscleGroup}
          onChange={(e) => setFormData({ ...formData, muscleGroup: e.target.value })}
          className="input"
          required
        >
          <option value="">Select muscle group</option>
          {MUSCLE_GROUPS.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-white/80 mb-2">
          Equipment
        </label>
        <select
          value={formData.equipment}
          onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
          className="input"
        >
          <option value="">Select equipment (optional)</option>
          {EQUIPMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {exercise ? 'Update Exercise' : 'Add Exercise'}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}



