import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Tables } from '@/types/database';
import { toast } from 'sonner';

type User = Tables<'users'>;
export type UserRole = 'user' | 'coach' | 'owner' | 'admin';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setUsers(data || []);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (updateError) throw updateError;
      
      // Update local state
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success('User role updated successfully');
      return true;
    } catch (err: any) {
      console.error('Error updating user role:', err);
      toast.error('Failed to update user role');
      return false;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      // Try to delete from users table first (this will work if RLS allows)
      // Note: Deleting from auth.users requires server-side admin API
      // For client-side, we delete from the users table
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (deleteError) {
        // If RLS prevents deletion, inform the user
        if (deleteError.code === '42501' || deleteError.message.includes('permission')) {
          toast.error('Insufficient permissions. User deletion requires admin privileges on the server.');
          return false;
        }
        throw deleteError;
      }
      
      // Update local state
      setUsers(users.filter(u => u.id !== userId));
      toast.success('User deleted successfully');
      return true;
    } catch (err: any) {
      console.error('Error deleting user:', err);
      toast.error(err.message || 'Failed to delete user');
      return false;
    }
  };

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
    updateUserRole,
    deleteUser,
  };
}