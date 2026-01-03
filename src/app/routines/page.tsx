'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRoutines } from '@/hooks/useRoutines';
import { Plus, Zap } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import SearchInput from '@/components/ui/SearchInput';
import RoutineCard from '@/components/routines/RoutineCard';
import RoutineForm from '@/components/routines/RoutineForm';

export default function RoutinesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const { routines, addRoutine, updateRoutine, deleteRoutine } = useRoutines(search);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<any>(null);

  const handleCreate = async (routine: { name: string; notes?: string }) => {
    const id = await addRoutine(routine);
    setShowCreateModal(false);
    router.push(`/routines/${id}/edit`);
  };

  const handleUpdate = async (routine: { name: string; notes?: string }) => {
    if (editingRoutine?.id) {
      await updateRoutine(editingRoutine.id, routine);
      setEditingRoutine(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this routine?')) {
      await deleteRoutine(id);
    }
  };

  const handleStartFreeWorkout = () => {
    router.push('/workouts/new');
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Routines</h1>
        <div className="flex gap-2 md:gap-3 w-full sm:w-auto">
          <Button variant="secondary" onClick={handleStartFreeWorkout} className="flex-1 sm:flex-none text-sm md:text-base py-2 md:py-3">
            <Zap size={18} />
            <span className="hidden sm:inline">Free Workout</span>
          </Button>
          <Button onClick={() => setShowCreateModal(true)} className="flex-1 sm:flex-none text-sm md:text-base py-2 md:py-3">
            <Plus size={18} />
            <span className="hidden sm:inline">Create</span>
            <span className="sm:hidden">Create Routine</span>
          </Button>
        </div>
      </div>

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="        Search routines..."
        className="max-w-full md:max-w-md"
      />

      <div className="space-y-4">
        {routines && routines.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-white/40 mb-4">
              No routines found. Create your first routine!
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus size={20} />
              Create Routine
            </Button>
          </div>
        )}

        {routines?.map((routine) => (
          <RoutineCard
            key={routine.id}
            id={routine.id!}
            name={routine.name}
            exerciseCount={routine.exerciseCount}
            notes={routine.notes}
            onEdit={() => router.push(`/routines/${routine.id}/edit`)}
            onDelete={() => handleDelete(routine.id!)}
          />
        ))}
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Routine"
      >
        <RoutineForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      <Modal
        isOpen={editingRoutine !== null}
        onClose={() => setEditingRoutine(null)}
        title="Edit Routine"
      >
        {editingRoutine && (
          <RoutineForm
            routine={editingRoutine}
            onSubmit={handleUpdate}
            onCancel={() => setEditingRoutine(null)}
          />
        )}
      </Modal>
    </div>
  );
}

