import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Profile } from '@/lib/db';
import { getISTDateString, getISTTimestamp } from '@/lib/utils';

type UpdateProfileOptions = {
  recordWeightEntry?: boolean;
};

export function useProfile() {
  const profile = useLiveQuery(() => db.profiles.get(1));

  const updateProfile = async (
    data: Partial<Omit<Profile, 'id'>>,
    options?: UpdateProfileOptions
  ) => {
    const shouldRecordWeightEntry = options?.recordWeightEntry ?? true;

    // Update the profile row first, reusing existing values as fallbacks.
    await db.profiles.put({
      id: 1,
      name: profile?.name || '',
      heightCm: profile?.heightCm || 170,
      weightKg: profile?.weightKg || 70,
      ...data,
      updatedAt: Date.now()
    });

    // Only write a new weight entry when the caller explicitly wants it.
    if (shouldRecordWeightEntry && data.weightKg !== undefined) {
      await db.weight_entries.add({
        weight: data.weightKg,
        date: getISTDateString(),
        createdAt: getISTTimestamp()
      });
    }
  };

  const initializeProfile = async () => {
    const existing = await db.profiles.get(1);
    if (!existing) {
      await db.profiles.add({
        id: 1,
        name: 'User',
        heightCm: 170,
        weightKg: 70,
        updatedAt: Date.now()
      });
    }
  };

  return {
    profile,
    updateProfile,
    initializeProfile
  };
}



