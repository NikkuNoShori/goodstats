import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../services/supabase';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const navigate = useNavigate();

  const { data: session, isLoading } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    }
  });

  useEffect(() => {
    if (!isLoading && !session) {
      navigate('/auth/signin');
    }
  }, [session, isLoading, navigate]);

  if (isLoading) {
    return null;
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 