import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../services/supabase';
import CrawlbaseAnalytics from './CrawlbaseAnalytics';
import Header from '../common/Header';
import { usePageTitle } from '../../utils/usePageTitle';

const AdminDashboard = () => {
  const navigate = useNavigate();
  usePageTitle('Admin Dashboard');

  // Check if user is admin
  const { data: profile, isLoading } = useQuery({
    queryKey: ['admin-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      return profile;
    }
  });

  // Redirect non-admin users
  useEffect(() => {
    if (!isLoading && profile?.role !== 'admin') {
      navigate('/');
    }
  }, [profile, isLoading, navigate]);

  if (isLoading) {
    return null;
  }

  if (profile?.role !== 'admin') {
    return null;
  }

  return (
    <>
      <Header title="" />
      <Box sx={{ 
        background: '#1a1f2e', 
        minHeight: '100vh',
        pt: '88px',
        px: 2
      }}>
        <Box sx={{ 
          maxWidth: '1200px',
          width: '100%',
          mx: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}>
          {/* Header Section */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mt: 3,
          }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.5)',
                  }}
                >
                  Home
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.5)',
                  }}
                >
                  /
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.5)',
                  }}
                >
                  Admin
                </Typography>
              </Box>
              <Typography
                variant="h4"
                sx={{
                  color: 'white',
                  fontWeight: 600,
                  mb: 0.5,
                  lineHeight: 1.2,
                }}
              >
                Admin Dashboard
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  lineHeight: 1.2,
                }}
              >
                Monitor API usage and system statistics
              </Typography>
            </Box>
          </Box>

          {/* Analytics Section */}
          <CrawlbaseAnalytics />
        </Box>
      </Box>
    </>
  );
};

export default AdminDashboard; 