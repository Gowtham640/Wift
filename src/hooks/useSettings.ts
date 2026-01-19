import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Settings } from '@/lib/db';

export function useSettings() {
  const settings = useLiveQuery(async () => {
    return await db.settings.get(1);
  });

  const updateSettings = async (data: Partial<Omit<Settings, 'id'>>) => {
    const currentSettings = await db.settings.get(1);
    await db.settings.put({
      id: 1,
      previousDataType: currentSettings?.previousDataType || 'routine_best',
      ...data,
      updatedAt: Date.now()
    });
  };

  const initializeSettings = async () => {
    const existing = await db.settings.get(1);
    if (!existing) {
      await db.settings.add({
        id: 1,
        previousDataType: 'routine_best',
        updatedAt: Date.now()
      });
    }
  };

  return {
    settings,
    updateSettings,
    initializeSettings
  };
}