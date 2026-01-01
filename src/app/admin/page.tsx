'use client';

import { useState, useEffect } from 'react';
import { useExercises } from '@/hooks/useExercises';
import { useProfile } from '@/hooks/useProfile';
import { Trash2, Edit, Plus, User, Save } from 'lucide-react';
import GlassWidget from '@/components/ui/GlassWidget';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ExerciseForm from '@/components/admin/ExerciseForm';
import CSVUploader from '@/components/admin/CSVUploader';
import SearchInput from '@/components/ui/SearchInput';
import Input from '@/components/ui/Input';
import { type Exercise } from '@/lib/db';

export default function AdminPage() {
  const [search, setSearch] = useState('');
  const { exercises, addExercise, updateExercise, deleteExercise, bulkAddExercises } = useExercises({ search });
  const { profile, updateProfile } = useProfile();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [profileName, setProfileName] = useState('');

  useEffect(() => {
    if (profile?.name) {
      setProfileName(profile.name);
    }
  }, [profile?.name]);

  const handleUpdateProfile = async () => {
    await updateProfile({ name: profileName });
  };

  const handleAdd = async (exercise: Omit<Exercise, 'id'>) => {
    await addExercise(exercise);
    setShowAddModal(false);
  };

  const handleUpdate = async (exercise: Omit<Exercise, 'id'>) => {
    if (editingExercise?.id) {
      await updateExercise(editingExercise.id, exercise);
      setEditingExercise(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this exercise?')) {
      await deleteExercise(id);
    }
  };

  const handleBulkUpload = async (exercises: Omit<Exercise, 'id'>[]) => {
    await bulkAddExercises(exercises);
  };

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto">
      <div className="px-2 md:px-0">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Admin Panel</h1>
        <p className="text-sm md:text-base text-white/60">Manage exercises and your profile settings</p>
      </div>

      {/* Profile Settings */}
      <GlassWidget className="p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <User size={20} className="text-white" />
          <h2 className="text-lg md:text-xl font-bold text-white">Profile Settings</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Your Name
            </label>
            <Input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>
          <div>
            <Button onClick={handleUpdateProfile} className="w-full">
              <Save size={18} />
              Save Profile
            </Button>
          </div>
          <div className="text-sm text-white/60">
            This name will be displayed in the dashboard greeting.
          </div>
        </div>
      </GlassWidget>

      {/* Exercise Management */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-2 md:px-0">
        <h2 className="text-xl md:text-2xl font-bold text-white">Exercise Management</h2>
        <Button onClick={() => setShowAddModal(true)} className="w-full sm:w-auto text-sm md:text-base py-2 md:py-3">
          <Plus size={18} />
          Add Exercise
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2">
          <GlassWidget className="p-6">
            <div className="mb-4">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search exercises..."
              />
            </div>

            <div className="space-y-2">
              {exercises && exercises.length === 0 && (
                <p className="text-center text-white/40 py-8">
                  No exercises found. Add your first exercise!
                </p>
              )}

              {exercises?.map((exercise) => (
                <div
                  key={exercise.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/8 transition-colors"
                >
                  <div>
                    <h3 className="text-white font-medium">{exercise.name}</h3>
                    <p className="text-sm text-white/60">
                      {exercise.muscleGroup}
                      {exercise.equipment && ` • ${exercise.equipment}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingExercise(exercise)}
                      className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(exercise.id!)}
                      className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </GlassWidget>
        </div>

        <div>
          <CSVUploader onUpload={handleBulkUpload} />
        </div>
      </div>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Exercise"
      >
        <ExerciseForm onSubmit={handleAdd} onCancel={() => setShowAddModal(false)} />
      </Modal>

      <Modal
        isOpen={editingExercise !== null}
        onClose={() => setEditingExercise(null)}
        title="Edit Exercise"
      >
        {editingExercise && (
          <ExerciseForm
            exercise={editingExercise}
            onSubmit={handleUpdate}
            onCancel={() => setEditingExercise(null)}
          />
        )}
      </Modal>
    </div>
  );
}

