'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkouts } from '@/hooks/useWorkouts';
import { Dumbbell } from 'lucide-react';
import GlassWidget from '@/components/ui/GlassWidget';
import WorkoutHistoryCard from '@/components/history/WorkoutHistoryCard';
import WorkoutEditModal from '@/components/history/WorkoutEditModal';
import type { Workout } from '@/lib/db';

export default function HistoryPage() {
  const router = useRouter();
  const { workouts, updateWorkout, deleteWorkout } = useWorkouts();
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this workout? This action cannot be undone.')) {
      await deleteWorkout(id);
    }
  };

  const handleEdit = (workout: Workout) => {
    setEditingWorkout(workout);
  };

  const handleSaveWorkout = async (workoutId: number, updates: Partial<Workout>) => {
    await updateWorkout(workoutId, updates);
    setEditingWorkout(null);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="px-2 md:px-0">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">Workout History</h1>
        <p className="text-sm md:text-base text-white/60">View and manage your past workouts</p>
      </div>

      {!workouts || workouts.length === 0 ? (
        <GlassWidget className="p-12 text-center">
          <Dumbbell size={48} className="text-white/20 mx-auto mb-4" />
          <p className="text-white/40 mb-4">No workouts found.</p>
          <p className="text-white/60 text-sm">Start your first workout to see it here!</p>
        </GlassWidget>
      ) : (
        <div className="space-y-4">
          {workouts.map((workout) => (
            <WorkoutHistoryCard
              key={workout.id}
              workout={workout}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <WorkoutEditModal
        workout={editingWorkout}
        isOpen={editingWorkout !== null}
        onClose={() => setEditingWorkout(null)}
        onSave={handleSaveWorkout}
      />
    </div>
  );
}
