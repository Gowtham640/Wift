'use client';

import { useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useWorkouts } from '@/hooks/useWorkouts';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Activity, User, Ruler, Scale } from 'lucide-react';
import CalendarWidget from '@/components/dashboard/CalendarWidget';
import MetricWidget from '@/components/dashboard/MetricWidget';
import LatestWorkoutWidget from '@/components/dashboard/LatestWorkoutWidget';
import { calculateBMI } from '@/lib/utils';

export default function DashboardPage() {
  const { profile, updateProfile, initializeProfile } = useProfile();
  const { workouts } = useWorkouts();

  useEffect(() => {
    initializeProfile();
  }, []);

  const latestWorkout = useLiveQuery(async () => {
    const workout = await db.workouts.orderBy('date').reverse().first();
    if (!workout) return null;

    const routine = workout.routineId
      ? await db.routines.get(workout.routineId)
      : undefined;

    const workoutExercises = await db.workout_exercises
      .where('workoutId')
      .equals(workout.id!)
      .sortBy('order');

    const exercisesWithDetails = await Promise.all(
      workoutExercises.map(async (we) => {
        const exercise = await db.exercises.get(we.exerciseId);
        const sets = await db.sets
          .where('workoutExerciseId')
          .equals(we.id!)
          .toArray();

        return {
          workoutExercise: we,
          exercise: exercise!,
          sets
        };
      })
    );

    const totalVolume = exercisesWithDetails.reduce(
      (sum, ex) =>
        sum +
        ex.sets
          .filter((s) => s.completed)
          .reduce((vol, s) => vol + s.weight * s.reps, 0),
      0
    );

    return {
      workout,
      routine,
      exercises: exercisesWithDetails,
      totalVolume,
      duration: workout.endTime ? workout.endTime - workout.startTime : undefined
    };
  });

  const workoutDates = workouts?.map((w) => w.date) || [];
  const bmi = profile ? calculateBMI(profile.weightKg, profile.heightCm) : 0;

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto">
      <div className="px-2 md:px-0">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">Dashboard</h1>
        <p className="text-sm md:text-base text-white/60">Welcome back, {profile?.name || 'User'}!</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2">
          <CalendarWidget workoutDates={workoutDates} />
        </div>

        <div className="space-y-4 md:space-y-6">
          <MetricWidget
            widgetId="dashboard-weight"
            title="Weight"
            value={profile?.weightKg || 0}
            unit="kg"
            icon={<Scale size={20} />}
            onUpdate={(value) => updateProfile({ weightKg: value })}
          />

          <MetricWidget
            widgetId="dashboard-height"
            title="Height"
            value={profile?.heightCm || 0}
            unit="cm"
            icon={<Ruler size={20} />}
            onUpdate={(value) => updateProfile({ heightCm: value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <MetricWidget
          widgetId="dashboard-bmi"
          title="BMI"
          value={bmi}
          unit=""
          icon={<Activity size={20} />}
          editable={false}
        />

        <MetricWidget
          widgetId="dashboard-bodyfat"
          title="Body Fat"
          value={profile?.bodyFatPercent || 0}
          unit="%"
          icon={<User size={20} />}
          onUpdate={(value) => updateProfile({ bodyFatPercent: value })}
        />

        <div className="col-span-2 lg:col-span-1">
          <LatestWorkoutWidget workout={latestWorkout || null} />
        </div>
      </div>
    </div>
  );
}
