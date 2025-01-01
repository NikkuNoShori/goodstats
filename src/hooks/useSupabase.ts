import { useContext } from 'react';
import { SupabaseContext } from '../context/SupabaseProvider';
import { User } from '@supabase/supabase-js';

export function useSupabaseClient() {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabaseClient must be used within a SupabaseProvider');
  }
  return context.supabase;
}

export function useUser(): User | null {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useUser must be used within a SupabaseProvider');
  }
  return context.user;
} 