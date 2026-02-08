import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type { WorkoutLog as DbWorkoutLog, WorkoutSet as DbWorkoutSet } from './useWorkoutData';
import type { ExerciseStats } from './useStats';

/**
 * Batch fetches exercise stats for multiple exercises in a single query
 * This significantly reduces database queries compared to calling useExerciseStats individually
 */
export function useExerciseStatsBatch(exerciseIds: string[]): Map<string, ExerciseStats> {
  const { user } = useAuth();
  const [statsMap, setStatsMap] = useState<Map<string, ExerciseStats>>(new Map());
  const [loading, setLoading] = useState(false);

  // Create a stable key for memoization
  const exerciseIdsKey = useMemo(() => exerciseIds.sort().join(','), [exerciseIds]);

  useEffect(() => {
    if (!user || exerciseIds.length === 0) {
      setStatsMap(new Map());
      return;
    }

    const fetchBatchStats = async () => {
      setLoading(true);
      try {
        // Fetch all workout logs for these exercises in one query
        const { data: logs, error: logsError } = await supabase
          .from('workout_logs')
          .select('id, exercise_id, created_at')
          .eq('user_id', user.id)
          .in('exercise_id', exerciseIds)
          .order('created_at', { ascending: false });

        if (logsError) throw logsError;

        if (!logs || logs.length === 0) {
          // Initialize all exercises with empty stats
          const emptyStatsMap = new Map<string, ExerciseStats>();
          exerciseIds.forEach(id => {
            emptyStatsMap.set(id, {
              exerciseId: id,
              totalSets: 0,
              totalReps: 0,
              maxWeight: 0,
              avgWeight: 0,
              lastWorkout: 'Never',
            });
          });
          setStatsMap(emptyStatsMap);
          return;
        }

        // Get all log IDs
        const logIds = (logs as DbWorkoutLog[]).map(log => log.id);

        // Fetch all sets for these logs in one query
        const { data: sets, error: setsError } = await supabase
          .from('workout_sets')
          .select('*')
          .in('workout_log_id', logIds);

        if (setsError) throw setsError;

        // Group sets by workout_log_id
        const setsByLogId = new Map<string, DbWorkoutSet[]>();
        (sets as DbWorkoutSet[] || []).forEach(set => {
          const logId = set.workout_log_id as string;
          if (!setsByLogId.has(logId)) {
            setsByLogId.set(logId, []);
          }
          setsByLogId.get(logId)!.push(set);
        });

        // Group logs by exercise_id
        const logsByExerciseId = new Map<string, DbWorkoutLog[]>();
        (logs as DbWorkoutLog[]).forEach(log => {
          const exerciseId = log.exercise_id as string;
          if (!logsByExerciseId.has(exerciseId)) {
            logsByExerciseId.set(exerciseId, []);
          }
          logsByExerciseId.get(exerciseId)!.push(log);
        });

        // Calculate stats for each exercise
        const statsMapResult = new Map<string, ExerciseStats>();

        exerciseIds.forEach(exerciseId => {
          const exerciseLogs = logsByExerciseId.get(exerciseId) || [];
          
          if (exerciseLogs.length === 0) {
            statsMapResult.set(exerciseId, {
              exerciseId,
              totalSets: 0,
              totalReps: 0,
              maxWeight: 0,
              avgWeight: 0,
              lastWorkout: 'Never',
            });
            return;
          }

          // Get all sets for this exercise's logs
          const exerciseSets: DbWorkoutSet[] = [];
          exerciseLogs.forEach(log => {
            const logSets = setsByLogId.get(log.id) || [];
            exerciseSets.push(...logSets);
          });

          const totalSets = exerciseSets.length;
          const totalReps = exerciseSets.reduce((acc, set) => acc + (set.reps || 0), 0);
          const maxWeight = exerciseSets.length > 0 
            ? Math.max(...exerciseSets.map(s => Number(s.weight || 0))) 
            : 0;
          const avgWeight = exerciseSets.length > 0
            ? Math.round((exerciseSets.reduce((acc, s) => acc + Number(s.weight || 0), 0) / exerciseSets.length) * 10) / 10
            : 0;

          // Get the most recent workout date
          const mostRecentLog = exerciseLogs[0]; // Already ordered by created_at DESC
          const lastWorkoutStr = mostRecentLog?.created_at 
            ? new Date(mostRecentLog.created_at).toLocaleDateString() 
            : 'Never';

          statsMapResult.set(exerciseId, {
            exerciseId,
            totalSets,
            totalReps,
            maxWeight,
            avgWeight,
            lastWorkout: lastWorkoutStr,
          });
        });

        setStatsMap(statsMapResult);
      } catch (err) {
        console.error('Error fetching batch exercise stats:', err);
        // Initialize with empty stats on error
        const emptyStatsMap = new Map<string, ExerciseStats>();
        exerciseIds.forEach(id => {
          emptyStatsMap.set(id, {
            exerciseId: id,
            totalSets: 0,
            totalReps: 0,
            maxWeight: 0,
            avgWeight: 0,
            lastWorkout: 'Never',
          });
        });
        setStatsMap(emptyStatsMap);
      } finally {
        setLoading(false);
      }
    };

    fetchBatchStats();
  }, [user, exerciseIdsKey]);

  return statsMap;
}
