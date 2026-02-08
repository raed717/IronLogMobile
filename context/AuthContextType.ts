import { createContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { Tables } from '@/types/database';

export type UserProfile = Tables<'users'>;
export type UserRole = 'user' | 'coach' | 'owner' | 'admin';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string, fullName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
