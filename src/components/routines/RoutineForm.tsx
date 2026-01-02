'use client';

import { useState, FormEvent } from 'react';
import { type Routine } from '@/lib/db';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface RoutineFormProps {
  routine?: Routine;
  onSubmit: (routine: { name: string; notes?: string }) => Promise<void>;
  onCancel?: () => void;
}

export default function RoutineForm({
  routine,
  onSubmit,
  onCancel
}: RoutineFormProps) {
  const [formData, setFormData] = useState({
    name: routine?.name || '',
    notes: routine?.notes || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-white/80 mb-2">
          Routine Name *
        </label>
        <Input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Push Day"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/80 mb-2">
          Notes (Optional)
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Add notes about this routine..."
          className="input min-h-[100px] resize-none"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {routine ? 'Update Routine' : 'Create Routine'}
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


