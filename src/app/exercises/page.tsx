'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useExercises } from '@/hooks/useExercises';
import { MUSCLE_GROUPS, EQUIPMENT_TYPES } from '@/lib/types';
import { Filter, X } from 'lucide-react';
import GlassWidget from '@/components/ui/GlassWidget';
import SearchInput from '@/components/ui/SearchInput';

export default function ExercisesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<string>('');
  const [equipment, setEquipment] = useState<string>('');

  const { exercises } = useExercises({ search, muscleGroup, equipment });

  const clearFilters = () => {
    setSearch('');
    setMuscleGroup('');
    setEquipment('');
  };

  const hasFilters = search || muscleGroup || equipment;

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto">
      <div className="px-2 md:px-0">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">Exercises</h1>
        <p className="text-sm md:text-base text-white/60">Browse and track your exercises</p>
      </div>

      <GlassWidget className="p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-white/60" />
          <h2 className="text-lg font-semibold text-white">Filters</h2>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto text-sm text-white/60 hover:text-white transition-colors flex items-center gap-1"
            >
              <X size={16} />
              Clear
            </button>
          )}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exercises && exercises.length === 0 && (
          <div className="col-span-full">
            <GlassWidget className="p-12 text-center">
              <p className="text-white/40">
                No exercises found. Try adjusting your filters.
              </p>
            </GlassWidget>
          </div>
        )}

        {exercises?.map((exercise) => (
          <GlassWidget
            key={exercise.id}
            className="p-6 cursor-pointer hover:scale-[1.02] transition-transform"
            onClick={() => router.push(`/exercises/${exercise.id}`)}
          >
            <h3 className="text-lg font-semibold text-white mb-2">
              {exercise.name}
            </h3>
            <div className="space-y-1">
              <p className="text-sm text-white/60">
                <span className="text-white/40">Muscle:</span> {exercise.muscleGroup}
              </p>
              {exercise.equipment && (
                <p className="text-sm text-white/60">
                  <span className="text-white/40">Equipment:</span> {exercise.equipment}
                </p>
              )}
              {exercise.isCustom && (
                <span className="inline-block mt-2 px-2 py-1 text-xs bg-white/20 text-white rounded">
                  Custom
                </span>
              )}
            </div>
          </GlassWidget>
        ))}
      </div>

      {/* Invisible spacer to push content above BottomNav overlay */}
      <div className="h-20 md:hidden" aria-hidden="true" />
    </div>
  );
}

