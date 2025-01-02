import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

export interface Profile {
  id: string;
  email: string;
  goodreads_user_id?: string;
  last_sync?: string;
  created_at?: string;
  updated_at?: string;
}

export const useProfile = () => {
  const { data: profile, isLoading, error } = useQuery<Profile>({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        throw error;
      }

      return profile;
    },
    retry: false,
  });

  return {
    profile,
    isLoading,
    error,
  };
}; 