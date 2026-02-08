import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type { WorkoutLog as DbWorkoutLog, WorkoutSet as DbWorkoutSet } from './useWorkoutData';

export interface GlobalStats {
  totalWorkouts: number;
  totalSets: number;
  totalReps: number;
  totalVolume: number;
  currentStreak: number;
  longestStreak: number;
  weeklyWorkouts: number[];
  previousWeeklyTotal?: number;
}

export interface ExerciseStats {
  exerciseId: string;
  totalSets: number;
  totalReps: number;
  maxWeight: number;
  avgWeight: number;
  lastWorkout: string;
}

export interface ProgressPoint {
  date: string;
  weight: number;
  reps: number;
  volume: number;
}

// Extend ExerciseStats with historical progress data
export interface ExerciseStatsWithProgress extends ExerciseStats {
  progressData: ProgressPoint[];
}

export function useGlobalStats(): GlobalStats {
  const { user } = useAuth();
  const [stats, setStats] = useState<GlobalStats>({
    totalWorkouts: 0,
    totalSets: 0,
    totalReps: 0,
    totalVolume: 0,
    currentStreak: 0,
    longestStreak: 0,
    weeklyWorkouts: [0, 0, 0, 0, 0, 0, 0],
  });

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        // Fetch all workout sets for the user
        const { data: sets, error: setsError } = await supabase
          .from('workout_sets')
          .select('weight, reps, created_at')
          .eq('user_id', user.id);

        if (setsError) throw setsError;

        // Fetch all workout logs for the user
        const { data: logs, error: logsError } = await supabase
          .from('workout_logs')
          .select('workout_session_id, created_at')
          .eq('user_id', user.id);

        if (logsError) throw logsError;

        // Calculate stats
        const totalSets = sets?.length || 0;
        const totalReps = sets?.reduce((acc, set) => acc + set.reps, 0) || 0;
        const totalVolume = sets?.reduce((acc, set) => acc + (set.weight * set.reps), 0) || 0;

        // Count unique sessions
        const uniqueSessions = new Set(logs?.map(log => log.workout_session_id) || []);
        const totalWorkouts = uniqueSessions.size;

        // Calculate weekly workouts (last 7 days) and previous week total
        const now = new Date();
        const weeklyWorkouts = Array(7).fill(0);
        let previousWeeklyTotal = 0;
        logs?.forEach(log => {
          const logDate = new Date(log.created_at);
          const daysAgo = Math.floor((now.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysAgo < 7) {
            weeklyWorkouts[6 - daysAgo]++;
          } else if (daysAgo >= 7 && daysAgo < 14) {
            previousWeeklyTotal++;
          }
        });

        setStats({
          totalWorkouts,
          totalSets,
          totalReps,
          totalVolume,
          currentStreak: 0, // Calculate based on consecutive days
          longestStreak: 0, // Calculate from historical data
          weeklyWorkouts,
          previousWeeklyTotal,
        });
      } catch (err) {
        console.error('Error fetching global stats:', err);
      }
    };

    fetchStats();
  }, [user]);

  return stats;
}

export function useExerciseStats(exerciseId: string): ExerciseStatsWithProgress {
  const { user } = useAuth();
  const [stats, setStats] = useState<ExerciseStatsWithProgress>({
    exerciseId,
    totalSets: 0,
    totalReps: 0,
    maxWeight: 0,
    avgWeight: 0,
    lastWorkout: 'Never',
    progressData: [],
  });

  useEffect(() => {
    if (!user || !exerciseId) return;

    const fetchStats = async () => {
      try {
        // Fetch workout logs for this exercise
        const { data: logs, error: logsError } = await supabase
          .from('workout_logs')
          .select('id, created_at')
          .eq('user_id', user.id)
          .eq('exercise_id', exerciseId)
          .order('created_at', { ascending: false });

        if (logsError) throw logsError;

        if (!logs || logs.length === 0) {
          setStats(prev => ({ ...prev, lastWorkout: 'Never' }));
          return;
        }

        // Get all sets for these logs
        const logIds = (logs as DbWorkoutLog[]).map((log) => log.id);
        const { data: sets, error: setsError } = await supabase
          .from('workout_sets')
          .select('*')
          .in('workout_log_id', logIds);

        if (setsError) throw setsError;

        const totalSets = (sets as DbWorkoutSet[] )?.length || 0;
        const totalReps = (sets as DbWorkoutSet[] )?.reduce((acc, set) => acc + (set.reps || 0), 0) || 0;
        const maxWeight = (sets as DbWorkoutSet[] ) && sets.length > 0 ? Math.max(...(sets as DbWorkoutSet[]).map(s => Number(s.weight))) : 0;
        const avgWeight = (sets as DbWorkoutSet[] ) && sets.length > 0
          ? Math.round(((sets as DbWorkoutSet[]).reduce((acc, s) => acc + Number(s.weight), 0) / (sets as DbWorkoutSet[]).length) * 10) / 10
          : 0;

        // Build progressData grouped by log (date)
        const setsByLog: Record<string, DbWorkoutSet[]> = {};
        (sets as DbWorkoutSet[] | undefined)?.forEach((s) => {
          const lid = s.workout_log_id as string;
          if (!setsByLog[lid]) setsByLog[lid] = [];
          setsByLog[lid].push(s);
        });

        const progressData: ProgressPoint[] = (logs as DbWorkoutLog[] | undefined || []).map((log) => {
          const logSets = setsByLog[log.id] || [];
          const totalRepsForLog = logSets.reduce((acc, s) => acc + (s.reps || 0), 0);
          const maxWeightForLog = logSets.length > 0 ? Math.max(...logSets.map(s => Number(s.weight || 0))) : 0;
          const totalVolumeForLog = logSets.reduce((acc, s) => acc + ((Number(s.weight || 0)) * (s.reps || 0)), 0);
          return {
            date: log.created_at,
            weight: maxWeightForLog,
            reps: totalRepsForLog,
            volume: totalVolumeForLog,
          };
        }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const lastWorkoutStr = (logs as DbWorkoutLog[])[0]?.created_at ? new Date((logs as DbWorkoutLog[])[0].created_at).toLocaleDateString() : 'Never';

        setStats({
          exerciseId,
          totalSets,
          totalReps,
          maxWeight,
          avgWeight,
          lastWorkout: lastWorkoutStr,
          progressData,
        });
      } catch (err) {
        console.error('Error fetching exercise stats:', err);
      }
    };

    fetchStats();
  }, [user, exerciseId]);

  return stats;
}
