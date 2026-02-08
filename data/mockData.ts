import { WorkoutLog, GlobalStats, ExerciseStats, ProgressPoint } from "@/types/workout";

// Generate mock workout history for demonstration
export const generateMockWorkoutLogs = (): WorkoutLog[] => {
  const logs: WorkoutLog[] = [];
  const exerciseIds = ["bench-press", "squat", "deadlift", "lat-pulldown", "overhead-press", "barbell-curl"];
  
  // Generate 30 days of workout data
  for (let i = 30; i >= 0; i -= 2) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    exerciseIds.forEach((exerciseId, idx) => {
      if (Math.random() > 0.3) { // 70% chance of having done this exercise
        const baseWeight = getBaseWeight(exerciseId);
        const progression = (30 - i) * 0.5; // Simulate progression
        
        logs.push({
          id: `log-${i}-${idx}`,
          date: date.toISOString().split('T')[0],
          exerciseId,
          sets: [
            { id: `set-1-${i}-${idx}`, setNumber: 1, weight: baseWeight + progression, reps: 10, completed: true },
            { id: `set-2-${i}-${idx}`, setNumber: 2, weight: baseWeight + progression, reps: 8, completed: true },
            { id: `set-3-${i}-${idx}`, setNumber: 3, weight: baseWeight + progression, reps: 6, completed: true },
          ],
        });
      }
    });
  }
  
  return logs;
};

const getBaseWeight = (exerciseId: string): number => {
  const weights: Record<string, number> = {
    "bench-press": 60,
    "squat": 80,
    "deadlift": 100,
    "lat-pulldown": 50,
    "overhead-press": 40,
    "barbell-curl": 25,
  };
  return weights[exerciseId] || 40;
};

export const generateMockGlobalStats = (): GlobalStats => ({
  totalWorkouts: 42,
  totalSets: 524,
  totalReps: 4892,
  totalVolume: 187500,
  currentStreak: 5,
  longestStreak: 12,
  weeklyWorkouts: [4, 3, 5, 4, 4, 3, 5],
});

export const generateMockExerciseStats = (exerciseId: string, logs: WorkoutLog[]): ExerciseStats => {
  const exerciseLogs = logs.filter(log => log.exerciseId === exerciseId);
  
  const totalSets = exerciseLogs.reduce((acc, log) => acc + log.sets.length, 0);
  const totalReps = exerciseLogs.reduce(
    (acc, log) => acc + log.sets.reduce((setAcc, set) => setAcc + set.reps, 0), 
    0
  );
  
  const allWeights = exerciseLogs.flatMap(log => log.sets.map(set => set.weight));
  const maxWeight = Math.max(...allWeights, 0);
  const avgWeight = allWeights.length > 0 ? allWeights.reduce((a, b) => a + b, 0) / allWeights.length : 0;
  
  const progressData: ProgressPoint[] = exerciseLogs.map(log => ({
    date: log.date,
    weight: Math.max(...log.sets.map(s => s.weight)),
    reps: log.sets.reduce((acc, s) => acc + s.reps, 0),
    volume: log.sets.reduce((acc, s) => acc + s.weight * s.reps, 0),
  }));
  
  return {
    exerciseId,
    totalSets,
    totalReps,
    maxWeight,
    avgWeight: Math.round(avgWeight * 10) / 10,
    lastWorkout: exerciseLogs[exerciseLogs.length - 1]?.date || "Never",
    progressData,
  };
};

export const getLastWorkout = (exerciseId: string, logs: WorkoutLog[]): WorkoutLog | undefined => {
  return logs
    .filter(log => log.exerciseId === exerciseId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
};
