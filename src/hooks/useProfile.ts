import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  const { data: profile, isLoading, error } = useQuery<Profile>({
    queryKey: ['profile'],
    queryFn: async () => {
      try {
        // First try to get the session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        // If no session, try to refresh
        if (!session) {
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError || !refreshedSession) {
            navigate('/login');
            throw new Error('Session expired. Please log in again.');
          }
        }

        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          navigate('/login');
          throw new Error('No authenticated user found.');
        }

        // Get the user's profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        if (!profile) {
          throw new Error('Profile not found');
        }

        return profile;
      } catch (error) {
        // If any error occurs, redirect to login
        navigate('/login');
        throw error;
      }
    },
    retry: 1, // Only retry once
    retryDelay: 1000, // Wait 1 second between retries
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    cacheTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

  return {
    profile,
    isLoading,
    error,
  };
}; 