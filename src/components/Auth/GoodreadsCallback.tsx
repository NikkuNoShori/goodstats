import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';

const GoodreadsCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const oauthToken = params.get('oauth_token');
        const oauthVerifier = params.get('oauth_verifier');

        if (!oauthToken || !oauthVerifier) {
          throw new Error('Missing OAuth parameters');
        }

        const response = await fetch(`http://localhost:3000/api/auth/callback?oauth_token=${oauthToken}&oauth_verifier=${oauthVerifier}`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to complete authentication');
        }

        navigate('/dashboard');
      } catch (error) {
        console.error('Auth callback failed:', error);
        navigate('/dashboard?error=auth_failed');
      }
    };

    handleCallback();
  }, [navigate, location]);

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#1a1f2e',
        color: 'white'
      }}
    >
      <CircularProgress sx={{ mb: 2 }} />
      <Typography>
        Completing authentication...
      </Typography>
    </Box>
  );
};

export default GoodreadsCallback; 