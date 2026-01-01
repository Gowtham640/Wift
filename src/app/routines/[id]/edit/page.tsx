'use client';

import { use } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRoutine } from '@/hooks/useRoutines';
import { useExercises } from '@/hooks/useExercises';
import { MUSCLE_GROUPS, EQUIPMENT_TYPES } from '@/lib/types';
import { Plus, Trash2, ArrowLeft, Check, Filter } from 'lucide-react';
import GlassWidget from '@/components/ui/GlassWidget';
import Button from '@/components/ui/Button';
import SearchInput from '@/components/ui/SearchInput';

export default function EditRoutinePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const routineId = parseInt(resolvedParams.id);
  const router = useRouter();
  const { routine, addExerciseToRoutine, removeExerciseFromRoutine } = useRoutine(routineId);
  const [search, setSearch] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<string>('');
  const [equipment, setEquipment] = useState<string>('');
  const { exercises: allExercises } = useExercises({ search, muscleGroup, equipment });

  const handleAddExercise = async (exerciseId: number) => {
    await addExerciseToRoutine(routineId, exerciseId);
  };

  const handleRemoveExercise = async (routineExerciseId: number) => {
    if (confirm('Remove this exercise from the routine?')) {
      await removeExerciseFromRoutine(routineExerciseId);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setMuscleGroup('');
    setEquipment('');
  };

  const hasFilters = search || muscleGroup || equipment;

  const routineExerciseIds = routine?.exercises.map(e => e.id) || [];
  const availableExercises = allExercises?.filter(e => !routineExerciseIds.includes(e.id)) || [];

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start gap-3 px-2 md:px-0">
        <Button variant="secondary" onClick={() => router.push('/routines')} className="p-2 md:p-3">
          <ArrowLeft size={18} />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-white">{routine?.routine.name}</h1>
          <p className="text-sm md:text-base text-white/60">Add exercises to your routine</p>
        </div>
        <Button onClick={() => router.push('/routines')} className="w-full sm:w-auto text-sm md:text-base py-2 md:py-3">
          <Check size={18} />
          Done
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 min-h-[calc(100vh-200px)]">
        <div className="flex flex-col">
          <h2 className="text-xl font-semibold text-white mb-4">
            Routine Exercises ({routine?.exerciseCount || 0})
          </h2>
          <GlassWidget className="p-4 md:p-6 flex-1">
            {routine && routine.exerciseCount === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-center text-white/40">
                  No exercises added yet. Add exercises from the right panel.
                </p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto flex-1">
                {routine?.exercises.map((exercise, index) => {
                  const routineExercise = routine.exercises.find(e => e.id === exercise.id);
                  return (
                    <div
                      key={exercise.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-white/40 font-mono text-sm">
                          #{index + 1}
                        </span>
                        <div>
                          <h3 className="text-white font-medium">{exercise.name}</h3>
                          <p className="text-sm text-white/60">{exercise.muscleGroup}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const routineExercise = routine.routineExercises.find(
                            re => re.exerciseId === exercise.id
                          );
                          if (routineExercise?.id) {
                            handleRemoveExercise(routineExercise.id);
                          }
                        }}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassWidget>
        </div>

        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">
              Available Exercises
            </h2>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-1"
              >
                <Trash2 size={16} />
                Clear Filters
              </button>
            )}
          </div>

          <GlassWidget className="p-4 md:p-6 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter size={20} className="text-white/60" />
              <h3 className="text-lg font-semibold text-white">Filters</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search exercises..."
              />

              <select
                value={muscleGroup}
                onChange={(e) => setMuscleGroup(e.target.value)}
                className="input"
              >
                <option value="">All Muscle Groups</option>
                {MUSCLE_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>

              <select
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                className="input"
              >
                <option value="">All Equipment</option>
                {EQUIPMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </GlassWidget>

          <GlassWidget className="p-4 md:p-6 flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto">
              {availableExercises.length === 0 ? (
                <p className="text-center text-white/40 py-8">
                  {hasFilters ? 'No exercises match your filters.' : 'No exercises available. Add exercises in the Admin page.'}
                </p>
              ) : (
                <div className="space-y-2 pb-4">
                  {availableExercises.map((exercise) => (
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
                      <button
                        onClick={() => handleAddExercise(exercise.id!)}
                        className="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-colors flex-shrink-0"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </GlassWidget>
        </div>
      </div>
    </div>
  );
}

