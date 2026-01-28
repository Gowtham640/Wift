'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import GlassWidget from '@/components/ui/GlassWidget';
import { TimePeriod, getDateRangeForPeriod } from './TimeFilter';
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type WeightEntry } from '@/lib/db';
import { getLocalDateString, getISTDateString, getISTTimestamp } from '@/lib/utils';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Plus, TrendingUp, TrendingDown, ChevronDown, ChevronUp, Edit3, Trash2 } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface WeightData {
  date: string;
  weight: number;
}

interface WeightChartProps {
  timePeriod: TimePeriod;
}

export default function WeightChart({ timePeriod }: WeightChartProps) {
  const [newWeight, setNewWeight] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { updateProfile } = useProfile();
const [recordsExpanded, setRecordsExpanded] = useState(false);
const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
const [editingWeight, setEditingWeight] = useState('');

const allWeightEntries = useLiveQuery(async () => {
  return await db.weight_entries
    .orderBy('createdAt')
    .reverse()
    .toArray();
}, [refreshTrigger]);

  // Debug function for weight entries
  if (typeof window !== 'undefined') {
    (window as any).debugWeight = async () => {
      console.log('⚖️ WEIGHT DEBUG: Checking weight entries...');

      try {
        // Check if table exists
        console.log('🗄️ Weight table exists:', !!db.weight_entries);

        // Get all weight entries
        const allWeights = await db.weight_entries.toArray();
        console.log('⚖️ Total weight entries:', allWeights.length);

        if (allWeights.length > 0) {
          console.log('⚖️ All weight entries:', allWeights);
          console.log('⚖️ Latest entry:', allWeights[allWeights.length - 1]);
        }

        // Test date functions
        console.log('📅 IST Date String:', getISTDateString());
        console.log('⏰ IST Timestamp:', getISTTimestamp());

        // Test a manual insertion
        console.log('🧪 Testing manual weight insertion...');
        const testEntry = {
          weight: 75.5,
          date: getISTDateString(),
          createdAt: getISTTimestamp()
        };
        console.log('🧪 Test entry to insert:', testEntry);

        const testId = await db.weight_entries.add(testEntry);
        console.log('🧪 Test insertion result ID:', testId);

        const retrieved = await db.weight_entries.get(testId);
        console.log('🧪 Retrieved test entry:', retrieved);

        // Clean up test entry
        await db.weight_entries.delete(testId);
        console.log('🧪 Cleaned up test entry');

    } catch (error) {
      console.error('❌ Weight debug failed:', error);
      const errorDetails = error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : { error: String(error) };
      console.error('❌ Error details:', errorDetails);
    }
    };
  }

  // Get weight entries for the time period
  const weightData = useLiveQuery(async () => {
    const { startDate, endDate } = getDateRangeForPeriod(timePeriod);

    const startDateStr = getLocalDateString(startDate);
    const endDateStr = getLocalDateString(endDate);

    // Get all entries first (manual filtering instead of indexed query)
    const allEntries = await db.weight_entries.toArray();

    // Manual filtering for date range
    const weightEntries = allEntries
      .filter(entry => entry.date >= startDateStr && entry.date <= endDateStr)
      .sort((a, b) => a.date.localeCompare(b.date));

    return weightEntries;
  }, [timePeriod, refreshTrigger]);

  const addWeightEntry = async () => {
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight <= 0) return;

    try {
      // Add to weight_entries for analytics tracking
      const result = await db.weight_entries.add({
        weight: weight,
        date: getISTDateString(),
        createdAt: getISTTimestamp()
      });

      // Also update the profile weight so dashboard shows current weight
      await updateProfile({ weightKg: weight });

      // Force refresh to ensure UI updates immediately
      setRefreshTrigger(prev => prev + 1);

      setNewWeight('');
      setShowAddForm(false);

    } catch (error) {
      console.error('Failed to add weight entry:', error);
    }
  };

  const startEditingEntry = (entry: WeightEntry) => {
    if (!entry.id) return;
    setEditingEntryId(entry.id);
    setEditingWeight(entry.weight.toString());
  };

  const cancelEditing = () => {
    setEditingEntryId(null);
    setEditingWeight('');
  };

  const saveEditedEntry = async () => {
    if (!editingEntryId) return;
    const parsed = parseFloat(editingWeight);
    if (isNaN(parsed) || parsed <= 0) return;

    await db.weight_entries.update(editingEntryId, {
      weight: parsed
    });

    setEditingEntryId(null);
    setEditingWeight('');
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleDeleteEntry = async (entryId?: number) => {
    if (!entryId) return;
    await db.weight_entries.delete(entryId);

    if (editingEntryId === entryId) {
      cancelEditing();
    }

    setRefreshTrigger((prev) => prev + 1);
  };

  const currentWeight = weightData && weightData.length > 0
    ? weightData[weightData.length - 1].weight
    : null;

  const startingWeight = weightData && weightData.length > 0
    ? weightData[0].weight
    : null;

  const weightChange = currentWeight && startingWeight
    ? currentWeight - startingWeight
    : 0;

  const data = {
    labels: weightData?.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }) || [],
    datasets: [
      {
        label: 'Weight (kg)',
        data: weightData?.map(d => d.weight) || [],
        borderColor: 'rgba(255, 255, 255, 1)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(255, 255, 255, 1)',
        pointBorderColor: 'rgba(255, 255, 255, 0.8)',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'rgba(255, 255, 255, 1)',
        bodyColor: 'rgba(255, 255, 255, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          title: function(context: any) {
            const index = context[0].dataIndex;
            const weightDataPoint = weightData?.[index];
            if (weightDataPoint) {
              const date = new Date(weightDataPoint.date);
              return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              });
            }
            return '';
          },
          label: function(context: any) {
            return `Weight: ${context.parsed.y} kg`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          callback: function(value: any) {
            return value + ' kg';
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          maxTicksLimit: 7
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    }
  };

  return (
    <GlassWidget widgetId="analytics-weight-chart" showGlow allowColorChange className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-bold text-white">Weight Progress</h2>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1.5 text-sm"
        >
          <Plus size={16} />
          Add Weight
        </Button>
      </div>

      {showAddForm && (
        <div className="mb-4 p-3 bg-white/5 rounded-lg">
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Weight (kg)"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              className="flex-1"
              step="0.1"
              min="1"
            />
            <Button onClick={addWeightEntry} className="px-4">
              Save
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowAddForm(false)}
              className="px-4"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {weightData && weightData.length > 0 && (
        <div className="h-[250px] mb-4">
          <Line data={data} options={options} />
        </div>
      )}

      {currentWeight ? (
        <div className="text-center">
          <div className="text-3xl md:text-4xl font-bold text-white mb-2">
            {currentWeight.toFixed(1)} kg
          </div>
          <div className="flex items-center justify-center gap-2 text-sm mb-4">
            {weightChange !== 0 && (
              <>
                {weightChange > 0 ? (
                  <TrendingUp size={16} className="text-green-400" />
                ) : (
                  <TrendingDown size={16} className="text-red-400" />
                )}
                <span className={weightChange > 0 ? 'text-green-400' : 'text-red-400'}>
                  {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
                </span>
              </>
            )}
          </div>
          <div className="text-white/60 text-sm">
            {weightData?.length || 0} measurements
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-white/40 mb-4">
            No weight entries yet
          </div>
          <Button onClick={() => setShowAddForm(true)}>
            Add Your First Weight
          </Button>
        </div>
      )}

      <div className="mt-6 border-t border-white/10 pt-4 space-y-3">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setRecordsExpanded((prev) => !prev)}
          className="flex items-center justify-between w-full text-sm text-white/80 hover:text-white transition-colors focus:outline-none"
        >
          <span>{recordsExpanded ? 'Hide weight records' : 'Manage all entries'}</span>
          {recordsExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {recordsExpanded && (
          <div className="space-y-3 max-h-[300px] overflow-y-auto pt-2">
            {allWeightEntries === undefined ? (
              <p className="text-xs text-white/50">Loading records...</p>
            ) : allWeightEntries.length === 0 ? (
              <p className="text-xs text-white/50">No records stored yet.</p>
            ) : (
              allWeightEntries.map((entry) => (
                <div
                  key={entry.id ?? entry.createdAt}
                  className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-white/60" onMouseDown={(e) => e.preventDefault()}>
                        {new Date(entry.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-lg font-semibold text-white">
                        {entry.weight.toFixed(1)} kg
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {editingEntryId === entry.id ? (
                        <>
                          <Button
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={saveEditedEntry}
                            className="px-3 py-1 text-xs"
                          >
                            Save
                          </Button>
                          <Button
                            variant="secondary"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={cancelEditing}
                            className="px-3 py-1 text-xs"
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="secondary"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => startEditingEntry(entry)}
                            className="px-3 py-1 text-xs"
                          >
                            <Edit3 size={14} className="mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="px-3 py-1 text-xs"
                          >
                            <Trash2 size={14} className="mr-1" />
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  {editingEntryId === entry.id && (
                    <input
                      type="number"
                      min="1"
                      step="0.1"
                      value={editingWeight}
                      onChange={(e) => setEditingWeight(e.target.value)}
                      className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 text-white focus:border-blue-400 focus:outline-none"
                    />
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </GlassWidget>
  );
}
