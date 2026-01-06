'use client';

import { useState, FormEvent, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import type { Workout } from '@/lib/db';
import { formatDuration } from '@/lib/utils';

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
    duration: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form data when workout changes
  useEffect(() => {
    if (workout) {
      const currentDuration = workout.endTime && workout.startTime
        ? Math.floor((workout.endTime - workout.startTime) / 1000 / 60) + 'm'
        : '45m';

      setFormData({
        date: workout.date,
        duration: currentDuration,
        notes: workout.notes || ''
      });
    }
  }, [workout]);

  const parseDurationString = (durationStr: string): number => {
    // Simple parser for formats like "45m", "1h 30m", "90"
    const hours = durationStr.match(/(\d+)h/);
    const minutes = durationStr.match(/(\d+)m/);
    const plainMinutes = durationStr.match(/^(\d+)$/);

    let totalMs = 0;

    if (hours) totalMs += parseInt(hours[1]) * 60 * 60 * 1000;
    if (minutes) totalMs += parseInt(minutes[1]) * 60 * 1000;
    if (plainMinutes && !hours && !minutes) totalMs += parseInt(plainMinutes[1]) * 60 * 1000;

    return totalMs;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!workout) return;

    setIsSubmitting(true);
    try {
      const updates: Partial<Workout> = {
        date: formData.date,
        notes: formData.notes || undefined
      };

      // Add duration update if duration changed
      if (formData.duration) {
        const durationMs = parseDurationString(formData.duration);
        updates.endTime = workout.startTime + durationMs;
      }

      await onSave(workout.id!, updates);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ date: '', duration: '', notes: '' });
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
            Duration (e.g., 45m, 1h 30m)
          </label>
          <Input
            type="text"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            placeholder="45m"
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
