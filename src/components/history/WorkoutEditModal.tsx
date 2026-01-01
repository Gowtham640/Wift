'use client';

import { useState, FormEvent, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import type { Workout } from '@/lib/db';

interface WorkoutEditModalProps {
  workout: Workout | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (workoutId: number, updates: Partial<Workout>) => Promise<void>;
}

export default function WorkoutEditModal({
  workout,
  isOpen,
  onClose,
  onSave
}: WorkoutEditModalProps) {
  const [formData, setFormData] = useState({
    date: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form data when workout changes
  useEffect(() => {
    if (workout) {
      setFormData({
        date: workout.date,
        notes: workout.notes || ''
      });
    }
  }, [workout]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!workout) return;

    setIsSubmitting(true);
    try {
      await onSave(workout.id!, {
        date: formData.date,
        notes: formData.notes || undefined
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ date: '', notes: '' });
    onClose();
  };

  if (!workout) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Workout"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Date
          </label>
          <Input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Add notes about this workout..."
            className="input min-h-[100px] resize-vertical"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
