import { CircularProgress, Alert, Box } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { supabase } from '../../services/supabase';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const oauthToken = params.get('oauth_token');
        const oauthVerifier = params.get('oauth_verifier');

        if (!oauthToken || !oauthVerifier) {
          throw new Error('Missing OAuth parameters');
        }

        // Store the tokens in user profile
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        await supabase
          .from('profiles')
          .update({
            goodreads_token: oauthToken,
            // Store other relevant data
          })
          .eq('id', user.id);

        navigate('/dashboard');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to complete authentication');
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
      }}
    >
      <CircularProgress />
    </Box>
  );
};

export default AuthCallback;
