import { db } from './db';
import { getLocalDateString } from './utils';

/**
 * Migrates workout dates from UTC format to local date format
 * This fixes the analytics issue where existing workouts weren't showing up
 * because date queries changed from UTC to local format
 */
export async function migrateWorkoutDatesToLocal(): Promise<void> {
  try {
    console.log('Starting workout date migration...');

    const workouts = await db.workouts.toArray();
    let migratedCount = 0;

    for (const workout of workouts) {
      try {
        // Convert stored date string to Date object (assuming it's in YYYY-MM-DD format)
        const dateParts = workout.date.split('-');
        if (dateParts.length === 3) {
          const year = parseInt(dateParts[0]);
          const month = parseInt(dateParts[1]) - 1; // JavaScript months are 0-based
          const day = parseInt(dateParts[2]);

          // Create date at local midnight
          const localDate = new Date(year, month, day);
          const localDateString = getLocalDateString(localDate);

          // Only update if the date actually changes
          if (localDateString !== workout.date) {
            await db.workouts.update(workout.id!, { date: localDateString });
            migratedCount++;
          }
        }
      } catch (error) {
        console.error(`Failed to migrate workout ${workout.id}:`, error);
        // Continue with other workouts
      }
    }

    console.log(`Workout date migration completed: ${migratedCount} workouts updated`);
  } catch (error) {
    console.error('Workout date migration failed:', error);
    // Don't throw error - migration failure shouldn't break the app
  }
}

/**
 * Runs all necessary data migrations
 * Should be called once on app initialization
 */
export async function runDataMigrations(): Promise<void> {
  await migrateWorkoutDatesToLocal();
  // Add future migrations here
}




