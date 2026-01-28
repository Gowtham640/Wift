'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import GlassWidget from '@/components/ui/GlassWidget';
import SetRow from './SetRow';
import VolumeIndicator from './VolumeIndicator';
import { useSets } from '@/hooks/useWorkouts';
import { type Exercise, type Set, db } from '@/lib/db';
import { calculateTotalVolume, calculateVolumeIncrease } from '@/lib/utils';

interface ExerciseCardProps {
  workoutExerciseId: number;
  exercise: Exercise;
  previousSets: Set[];
  previousVolume?: number;
}

export default function ExerciseCard({
  workoutExerciseId,
  exercise,
  previousSets,
  previousVolume = 0
}: ExerciseCardProps) {
  const router = useRouter();
  const { sets, addSet, updateSet, deleteSet } = useSets(workoutExerciseId);
  const [deleteMode, setDeleteMode] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Shared values for cascading updates - use the first set's values as defaults
  const [sharedWeight, setSharedWeight] = useState<number | undefined>(previousSets?.[0]?.weight);
  const [sharedReps, setSharedReps] = useState<number | undefined>(previousSets?.[0]?.reps);

  // Update shared values when previousSets changes
  useEffect(() => {
    if (previousSets && previousSets.length > 0) {
      setSharedWeight(previousSets[0].weight);
      setSharedReps(previousSets[0].reps);
    }
  }, [previousSets]);

  // Handle value changes from any set (cascading effect)
  const handleValueChange = (field: 'weight' | 'reps', value: number) => {
    if (field === 'weight') {
      setSharedWeight(value);
    } else {
      setSharedReps(value);
    }
  };

  const currentVolume = sets ? calculateTotalVolume(sets) : 0;
  const volumeIncrease = calculateVolumeIncrease(currentVolume, previousVolume);
  const setVolumes = sets?.map((set) => set.weight * set.reps) ?? [];
  const maxSetVolume = setVolumes.length > 0 ? Math.max(1, ...setVolumes) : 1;

  interface ExerciseHistoryRecord {
    workoutId: number;
    date: string;
    volume: number;
    topWeight: number;
    totalReps: number;
  }

  const lastRecords = useLiveQuery(async () => {
    if (!exercise.id) return [];

    const currentWorkoutExercise = await db.workout_exercises.get(workoutExerciseId);
    const currentWorkoutId = currentWorkoutExercise?.workoutId;

    const relatedExercises = await db.workout_exercises
      .where('exerciseId')
      .equals(exercise.id)
      .toArray();

    const history: ExerciseHistoryRecord[] = [];

    for (const related of relatedExercises) {
      if (!related.id || related.workoutId === currentWorkoutId) continue;
      const workout = await db.workouts.get(related.workoutId);
      if (!workout) continue;
      const completedSets = await db.sets
        .where('workoutExerciseId')
        .equals(related.id)
        .and((set) => set.completed)
        .toArray();
      if (completedSets.length === 0) continue;

      const volume = completedSets.reduce((sum, set) => sum + set.weight * set.reps, 0);
      const topWeight = Math.max(...completedSets.map((set) => set.weight));
      const totalReps = completedSets.reduce((sum, set) => sum + set.reps, 0);

      history.push({
        workoutId: related.workoutId,
        date: workout.date,
        volume,
        topWeight,
        totalReps
      });
    }

    return history
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
  }, [exercise.id, workoutExerciseId]);

  useEffect(() => {
    if (sets && sets.length > 0) {
      const firstCompleted = sets.find(s => s.completed);
      if (firstCompleted && firstCompleted.weight > 0 && firstCompleted.reps > 0) {
        // Could store first set values if needed
      }
    }
  }, [sets]);

  const handleAddSet = async () => {
    const defaultValues = previousSets?.[0] ? { weight: previousSets[0].weight, reps: previousSets[0].reps } : undefined;
    await addSet(workoutExerciseId, defaultValues);
  };

  const handleDeleteSet = async (setId: number) => {
    if (sets && sets.length > 1) {
      await deleteSet(setId);
    }
  };

  const getDefaultValues = (index: number) => {
    // Return the set at the corresponding index from previous workout, or first set if not available
    const previousSet = previousSets?.[index] || previousSets?.[0];
    return previousSet ? { weight: previousSet.weight, reps: previousSet.reps } : undefined;
  };

  return (
    <GlassWidget className="p-2 md:p-4">
      <div className="flex items-start justify-between mb-3 md:mb-4 gap-2">
        <div className="flex-1 min-w-0">
          <h3
            className="text-lg md:text-xl font-semibold text-blue-400 truncate cursor-pointer hover:text-blue-300 transition-colors select-none"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/exercises/${exercise.id}`);
            }}
          >
            {exercise.name}
          </h3>
          <p className="text-xs md:text-sm text-white/60">{exercise.muscleGroup}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <VolumeIndicator percentage={volumeIncrease} />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setIsExpanded((prev) => !prev)}
            className="flex items-center gap-1 text-xs text-white/70 hover:text-white focus:outline-none"
          >
            {isExpanded ? 'Hide details' : 'Show details'}
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      <div className="space-y-2 md:space-y-2">
        {/* Table Headers */}
        <div className="grid grid-cols-5 gap-2 mb-3 text-sm text-white/60 font-medium bg-white/5 rounded-lg p-3">
          <div className="text-center">Set</div>
          <div className="text-center">Previous</div>
          <div className="text-center">Weight</div>
          <div className="text-center">Reps</div>
          <div className="text-center">Done</div>
        </div>

        <div className="space-y-1">
          {sets?.map((set, index) => (
            <div key={set.id} className="grid grid-cols-5 gap-2 items-center bg-white/5 rounded-lg p-2">
              <SetRow
                setNumber={index + 1}
                set={set}
                previousBest={getDefaultValues(index)}
                sharedWeight={sharedWeight}
                sharedReps={sharedReps}
                onUpdate={(updates) => updateSet(set.id!, updates)}
                onValueChange={handleValueChange}
              />
              <div className="flex justify-center">
                {deleteMode && sets.length > 1 && (
                  <button
                    onClick={() => handleDeleteSet(set.id!)}
                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-3">
          <button
            onClick={handleAddSet}
            className="flex-1 btn btn-secondary py-2 md:py-3 text-sm"
          >
            <Plus size={16} />
            Add Set
          </button>

          {sets && sets.length > 1 && (
            <button
              onClick={() => setDeleteMode(!deleteMode)}
              className={`flex-1 btn py-2 md:py-3 text-sm ${deleteMode ? 'btn-danger' : 'btn-secondary'
                }`}
            >
              <Trash2 size={16} />
              {deleteMode ? 'Done' : 'Remove'}
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm uppercase tracking-wide text-white/60">Volume chart</h4>
              <span className="text-xs text-white/50">per set</span>
            </div>
            {sets && sets.length > 0 ? (
              <div className="space-y-2">
                {sets.map((set, index) => {
                  const volume = setVolumes[index] ?? 0;
                  const barWidth = maxSetVolume > 0 ? Math.min(100, (volume / maxSetVolume) * 100) : 0;
                  return (
                    <div key={set.id} className="flex items-center gap-3">
                      <span className="text-xs text-white/60 w-12 text-right">Set {index + 1}</span>
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-300"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <span className="text-xs text-white/70 w-14 text-right">{volume.toFixed(1)} kg</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-white/50">Log your sets to see the volume trend.</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm uppercase tracking-wide text-white/60">Last 3 records</h4>
              <span className="text-xs text-white/50">previous workouts</span>
            </div>
            {lastRecords === undefined ? (
              <p className="text-xs text-white/50">Loading previous workouts...</p>
            ) : lastRecords.length === 0 ? (
              <p className="text-xs text-white/50">No completed records yet for this exercise.</p>
            ) : (
              <div className="space-y-2">
                {lastRecords.map((record) => (
                  <div
                    key={`${record.workoutId}-${record.date}`}
                    className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2"
                  >
                    <div>
                      <p
                        className="text-sm text-white"
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        {new Date(record.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-xs text-white/60">
                        Top weight {record.topWeight.toFixed(1)} kg • {record.totalReps} reps
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-white">{record.volume.toFixed(0)} kg</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-white/10">
        <div className="flex justify-between text-xs md:text-sm">
          <span className="text-white/60">Total Volume:</span>
          <span className="text-white font-semibold">{currentVolume.toFixed(0)} kg</span>
        </div>
      </div>
    </GlassWidget>
  );
}

