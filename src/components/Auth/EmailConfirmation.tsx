import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { supabase } from '../../services/supabase';
import { usePageTitle } from '../../utils/usePageTitle';

const EmailConfirmation = () => {
  const navigate = useNavigate();
  usePageTitle('Confirming Email');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session) {
          // Successfully authenticated
          navigate('/', { replace: true });
        } else {
          // No session, redirect to sign in
          navigate('/auth/signin', { replace: true });
        }
      } catch (err) {
        console.error('Error during email confirmation:', err);
        navigate('/auth/signin', { replace: true });
      }
    };

    handleEmailConfirmation();
  }, [navigate]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a1f2e',
        gap: 2
      }}
    >
      <CircularProgress size={40} />
      <Typography
        variant="h6"
        sx={{
          color: 'white',
          textAlign: 'center'
        }}
      >
        Confirming your email...
      </Typography>
    </Box>
  );
};

export default EmailConfirmation; 