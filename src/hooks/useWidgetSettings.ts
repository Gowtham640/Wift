import { useLiveQuery } from 'dexie-react-hooks';
import { db, type WidgetSettings } from '@/lib/db';

export function useWidgetSettings(widgetId: string) {
  const settings = useLiveQuery(
    () => db.widget_settings.get(widgetId),
    [widgetId]
  );

  const updateGlowColor = async (widgetId: string, glowColor: string) => {
    await db.widget_settings.put({
      id: widgetId,
      glowColor,
      updatedAt: Date.now()
    });
  };

  return {
    settings,
    glowColor: settings?.glowColor || '#ffffff',
    updateGlowColor
  };
}

