import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography, Container, Alert } from '@mui/material';
import { goodreadsService } from '../../services/goodreadsService';
import { userService } from '../../services/userService';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const oauthToken = searchParams.get('oauth_token');
      const oauthVerifier = searchParams.get('oauth_verifier');
      const error = searchParams.get('error');

      if (error) {
        setError(error);
        setTimeout(() => navigate('/signin', { state: { error } }), 2000);
        return;
      }

      if (!oauthToken || !oauthVerifier) {
        setError('Invalid OAuth response');
        setTimeout(() => navigate('/signin', { state: { error: 'Authentication failed' } }), 2000);
        return;
      }

      try {
        const authResult = await goodreadsService.completeAuth(oauthToken, oauthVerifier);
        userService.setProfile({
          id: authResult.userId,
          goodreadsId: authResult.goodreadsId,
          accessToken: authResult.accessToken,
          refreshToken: authResult.refreshToken,
          tokenExpiry: Date.now() + authResult.expiresIn * 1000
        });
        navigate('/dashboard');
      } catch (err) {
        setError('Failed to complete authentication');
        setTimeout(() => navigate('/signin', { state: { error: 'Authentication failed' } }), 2000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Typography color="text.secondary">
            Redirecting back to sign in...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography>
          Completing authentication...
        </Typography>
      </Box>
    </Container>
  );
};

export default AuthCallback; 