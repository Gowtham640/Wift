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
import TimeFilter, { TimePeriod, getDateRangeForPeriod } from './TimeFilter';
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { getLocalDateString } from '@/lib/utils';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface WeightData {
  date: string;
  weight: number;
}

interface WeightChartProps {
  timePeriod: TimePeriod;
}

export default function WeightChart({ timePeriod }: WeightChartProps) {

  // For now, we'll create mock weight data based on workouts
  // In a real implementation, you'd have a weight_logs table
  const weightData = useLiveQuery(async () => {
    const { startDate, endDate } = getDateRangeForPeriod(timePeriod);
    const workouts = await db.workouts
      .where('date')
      .between(getLocalDateString(startDate), getLocalDateString(endDate))
      .sortBy('date');

    // Get profile for current weight
    const profile = await db.profiles.get(1);

    // Create weight progression data based on workouts
    // This is simplified - in reality you'd have actual weight logs
    const mockData: WeightData[] = [];
    let currentWeight = profile?.weightKg || 70; // Default weight

    workouts.forEach((workout, index) => {
      // Simulate slight weight changes over time
      const weightChange = (Math.random() - 0.5) * 0.5; // Random change between -0.25 and +0.25 kg
      currentWeight = Math.max(currentWeight + weightChange, 50); // Minimum 50kg

      mockData.push({
        date: workout.date,
        weight: Math.round(currentWeight * 10) / 10 // Round to 1 decimal
      });
    });

    return mockData;
  }, [timePeriod]);

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
      <h2 className="text-lg md:text-xl font-bold text-white mb-4">Weight Progress</h2>

      <div className="h-[300px]">
        {weightData && weightData.length > 0 ? (
          <Line data={data} options={options} />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-white/40 mb-2">No weight data available</p>
              <p className="text-white/60 text-sm">Update your weight on the dashboard to see progress</p>
            </div>
          </div>
        )}
      </div>
    </GlassWidget>
  );
}
