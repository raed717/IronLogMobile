import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { Exercise } from '@/types/workout';

export interface RecentExercise extends Exercise {
  lastPerformed?: string;
  totalWorkouts: number;
}

export function useRecentExercises(limit: number = 6) {
  const { user } = useAuth();
  const [recentExercises, setRecentExercises] = useState<RecentExercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRecentExercises([]);
      setLoading(false);
      return;
    }

    fetchRecentExercises();
  }, [user]);

  const fetchRecentExercises = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get all workout logs for the user, ordered by most recent
      const { data: logs, error: logsError } = await supabase
        .from('workout_logs')
        .select('exercise_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (logsError) throw logsError;

      if (!logs || logs.length === 0) {
        setRecentExercises([]);
        return;
      }

      // Get unique exercise IDs with their most recent date
      const exerciseMap = new Map<string, { lastPerformed: string; count: number }>();
      
      logs.forEach((log: { exercise_id: string; created_at: string }) => {
        const exerciseId = log.exercise_id;
        if (!exerciseMap.has(exerciseId)) {
          exerciseMap.set(exerciseId, {
            lastPerformed: log.created_at,
            count: 1,
          });
        } else {
          const existing = exerciseMap.get(exerciseId)!;
          existing.count += 1;
          // Keep the most recent date
          if (new Date(log.created_at) > new Date(existing.lastPerformed)) {
            existing.lastPerformed = log.created_at;
          }
        }
      });

      // Get exercise details
      const exerciseIds = Array.from(exerciseMap.keys()).slice(0, limit);
      const { data: exercises, error: exercisesError } = await supabase
        .from('exercises')
        .select('*')
        .in('id', exerciseIds);

      if (exercisesError) throw exercisesError;

      // Combine exercise data with workout stats
      const recent: RecentExercise[] = exercises.map((exercise) => {
        const stats = exerciseMap.get(exercise.id)!;
        return {
          ...exercise,
          lastPerformed: stats.lastPerformed,
          totalWorkouts: stats.count,
        };
      });

      // Sort by most recently performed
      recent.sort((a, b) => {
        const dateA = new Date(a.lastPerformed || 0).getTime();
        const dateB = new Date(b.lastPerformed || 0).getTime();
        return dateB - dateA;
      });

      setRecentExercises(recent);
    } catch (error) {
      console.error('Error fetching recent exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    recentExercises,
    loading,
    refetch: fetchRecentExercises,
  };
}
