import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Tables, TablesInsert } from '@/types/database';
import { useAuth } from './useAuth';

type ProgramShare = Tables<'program_shares'>;
type ProgramShareInsert = TablesInsert<'program_shares'>;

export function useProgramShares() {
  const [shares, setShares] = useState<ProgramShare[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchShares = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('program_shares')
        .select(`
          *,
          programs:program_id (
            id,
            name,
            description,
            focus_area
          ),
          shared_by:shared_by_user_id (
            id,
            username,
            full_name
          ),
          shared_with:shared_with_user_id (
            id,
            username,
            full_name
          )
        `)
        .or(`shared_by_user_id.eq.${user.id},shared_with_user_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShares(data || []);
    } catch (error) {
      console.error('Error fetching program shares:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchShares();
    }
  }, [user, fetchShares]);

  const shareProgram = async (programId: string, sharedWithUserId: string) => {
    if (!user) return { success: false, message: "User not authenticated" };

    // Check if already shared
    const { data: existingShare, error: checkError } = await supabase
      .from('program_shares')
      .select('id')
      .eq('program_id', programId)
      .eq('shared_with_user_id', sharedWithUserId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error checking existing share:', checkError);
      return { success: false, message: "Error checking share status" };
    }

    if (existingShare) {
      return { success: false, message: "This program is already shared with this user" };
    }

    try {
      const shareData: ProgramShareInsert = {
        program_id: programId,
        shared_by_user_id: user.id,
        shared_with_user_id: sharedWithUserId,
      };

      const { data, error } = await supabase
        .from('program_shares')
        .insert(shareData)
        .select()
        .single();

      if (error) throw error;

      await fetchShares(); // Refresh the list
      return { success: true, message: "Program shared successfully", data };
    } catch (error) {
      console.error('Error sharing program:', error);
      return { success: false, message: "Failed to share program" };
    }
  };

  const unshareProgram = async (shareId: string) => {
    try {
      const { error } = await supabase
        .from('program_shares')
        .delete()
        .eq('id', shareId);

      if (error) throw error;

      await fetchShares(); // Refresh the list
      return true;
    } catch (error) {
      console.error('Error unsharing program:', error);
      return false;
    }
  };

  return {
    shares,
    loading,
    shareProgram,
    unshareProgram,
    refetch: fetchShares,
  };
}