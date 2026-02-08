import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Tables } from '@/types/database';
import { useAuth } from './useAuth';

export type UserProfile = Tables<'users'>;
export type UserRole = 'user' | 'coach' | 'owner' | 'admin';

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError) throw fetchError;
      setProfile(data);
    } catch (err: any) {
      console.error('Error fetching user profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchProfile();
  };

  return {
    profile,
    loading,
    error,
    refetch,
    role: profile?.role || ('user' as UserRole),
    isAdmin: profile?.role === 'admin',
    isCoach: profile?.role === 'coach' || profile?.role === 'admin',
  };
}
