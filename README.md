# Gym Tracker App

A comprehensive gym tracking application built with Next.js, featuring a modern glass morphism UI with coal black theme and customizable widget glows.

## Features

### 📊 Dashboard
- **Calendar Widget**: Visual calendar showing workout dates with highlighted markers
- **Body Metrics**: Track weight, height, BMI, and body fat percentage
- **Customizable Glows**: Each widget has adjustable glow colors
- **Latest Workout**: Quick view of your most recent workout session

### 🏋️ Workouts
- **Active Session Tracking**: Real-time workout timer and volume tracking
- **Exercise Cards**: Beautiful cards for each exercise with set management
- **Smart Auto-fill**: Previous best records pre-fill new sets
- **Volume Indicators**: See percentage increase/decrease for each exercise
- **Set Management**: Add, edit, and delete sets on the fly
- **Free Workouts**: Start workouts without a routine

### 📋 Routines
- **Routine Management**: Create, edit, and delete workout routines
- **Exercise Selection**: Easy exercise picker with search functionality
- **Quick Start**: Start any routine with one click
- **Search & Filter**: Find routines quickly

### 💪 Exercises
- **Exercise Library**: Browse all your exercises with filters
- **Muscle Group Filter**: Filter by muscle groups
- **Equipment Filter**: Filter by equipment type (barbell, dumbbell, etc.)
- **Exercise Analytics**: Detailed stats for each exercise
- **History Tracking**: View all past performances

### 📈 Analytics
- **Workout Frequency**: Pie chart showing workout days vs rest days
- **Muscle Distribution**: Bar chart showing volume per muscle group
- **Exercise Performance**: Sort exercises by workout count and sets
- **Progress Tracking**: Visual representation of your fitness journey

### ⚙️ Admin
- **Exercise CRUD**: Create, update, and delete exercises
- **Bulk Upload**: CSV import for adding multiple exercises at once
- **Search**: Find exercises quickly
- **Custom Exercises**: Add your own exercises with muscle group and equipment

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with custom glass morphism effects
- **Database**: IndexedDB via Dexie.js
- **Charts**: Chart.js with react-chartjs-2
- **Icons**: Lucide React
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or pnpm package manager

### Installation

1. Clone the repository
2. Navigate to the wift directory:
   ```bash
   cd wift
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage Guide

### First Time Setup

1. **Add Exercises** (Admin Page):
   - Navigate to Admin page
   - Add exercises manually or use CSV bulk upload
   - CSV format: `name, muscleGroup, equipment`
   - Example: `Bench Press, Chest, Barbell`

2. **Update Profile** (Dashboard):
   - Click edit icon on any metric widget
   - Enter your weight, height, and body fat percentage
   - BMI is calculated automatically

3. **Create Routines** (Routines Page):
   - Click "Create Routine"
   - Name your routine and add optional notes
   - Add exercises from your library
   - Organize exercises in the order you want

### Starting a Workout

1. Go to Routines page
2. Click "Start Workout" on any routine
3. Or click "Free Workout" to start without a routine
4. Log your sets with weight and reps
5. Check off completed sets
6. Add or remove sets as needed
7. Click "Complete Workout" when done

### CSV Upload Format

Create a CSV file with this structure:

```csv
name,muscleGroup,equipment
Bench Press,Chest,Barbell
Squat,Legs,Barbell
Pull-ups,Back,Bodyweight
Bicep Curl,Biceps,Dumbbell
```

## Design Features

### Mobile-First Responsive Design
- **Mobile**: Bottom navigation bar with icons
- **Tablet/Desktop**: Side navigation bar
- Fully responsive layouts across all pages
- Touch-optimized buttons and controls
- Optimized spacing for different screen sizes

### Glass Morphism
- Frosted glass effect with backdrop blur
- Subtle borders and shadows
- Smooth gradient glows from bottom (no visible lines)
- Hover effects for interactivity

### Customizable Glows
- Each widget has a unique glow color
- Click the palette icon to change colors
- Choose from presets or custom colors
- Smooth gradient blur effect
- Preferences saved in IndexedDB

### Dark Theme
- Coal black background (#0a0a0a)
- High contrast white text
- Color-coded charts and indicators

## Database Schema

The app uses IndexedDB with Dexie.js for client-side storage:

- **profiles**: User profile data
- **exercises**: Exercise library
- **routines**: Workout routines
- **routine_exercises**: Exercise-routine relationships
- **workouts**: Workout sessions
- **workout_exercises**: Exercise-workout relationships
- **sets**: Individual set records
- **widget_settings**: Widget glow color preferences

## Building for Production

```bash
npm run build
npm start
```

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Any browser with IndexedDB support

## License

MIT

## Author

Built with ❤️ for fitness enthusiasts
