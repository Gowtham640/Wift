import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Profile } from '@/lib/db';

export function useProfile() {
  const profile = useLiveQuery(() => db.profiles.get(1));

  const updateProfile = async (data: Partial<Omit<Profile, 'id'>>) => {
    await db.profiles.put({
      id: 1,
      name: profile?.name || '',
      heightCm: profile?.heightCm || 170,
      weightKg: profile?.weightKg || 70,
      ...data,
      updatedAt: Date.now()
    });
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

