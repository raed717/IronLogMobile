import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface WorkoutSetInput {
  setNumber: number;
  weight: number;
  reps: number;
}

export function useSaveWorkout() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveWorkout = async (
    exerciseId: string,
    sets: WorkoutSetInput[],
    sessionDate?: string
  ) => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const workoutDate = sessionDate || new Date().toISOString().split('T')[0];

      // 1. Create or get workout session for today
      const { data: existingSession, error: sessionError } = await supabase
        .from('workout_sessions')
        .select('id')
        .eq('user_id', user.id)
        .eq('session_date', workoutDate)
        .single();

      if (sessionError && sessionError.code !== 'PGRST116') {
        throw new Error(`Failed to fetch session: ${sessionError.message}`);
      }

      let sessionId: string;

      if (existingSession) {
        sessionId = existingSession.id;
      } else {
        // Create new session
        const { data: newSession, error: createSessionError } = await supabase
          .from('workout_sessions')
          .insert([
            {
              user_id: user.id,
              session_date: workoutDate,
              session_name: 'Workout',
            },
          ])
          .select('id')
          .single();

        if (createSessionError) {
          throw new Error(`Failed to create session: ${createSessionError.message}`);
        }

        sessionId = newSession.id;
      }

      // 2. Create workout log
      const { data: logData, error: logError } = await supabase
        .from('workout_logs')
        .insert([
          {
            user_id: user.id,
            exercise_id: exerciseId,
            workout_session_id: sessionId,
          },
        ])
        .select('id')
        .single();

      if (logError) {
        throw new Error(`Failed to create workout log: ${logError.message}`);
      }

      // 3. Create workout sets
      const setsToInsert = sets.map(set => ({
        user_id: user.id,
        workout_log_id: logData.id,
        set_number: set.setNumber,
        weight: set.weight,
        reps: set.reps,
        is_completed: true,
      }));

      const { error: setsError } = await supabase
        .from('workout_sets')
        .insert(setsToInsert);

      if (setsError) {
        throw new Error(`Failed to save sets: ${setsError.message}`);
      }

      setLoading(false);
      return { success: true, logId: logData.id };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save workout';
      setError(errorMessage);
      setLoading(false);
      return null;
    }
  };

  return { saveWorkout, loading, error };
}
