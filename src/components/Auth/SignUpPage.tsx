import { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Link as MuiLink,
  CircularProgress,
  Container,
  Paper,
} from '@mui/material';
import { supabase } from '../../services/supabase';
import { usePageTitle } from '../../utils/usePageTitle';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { useQueryClient } from '@tanstack/react-query';

const SignUpForm = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      });

      if (error) throw error;

      setSuccess(true);
      queryClient.invalidateQueries(['profile']);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
      setSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pt: 8,
          pb: 6,
        }}
      >
        <RouterLink to="/" style={{ textDecoration: 'none' }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(to right, #8B5CF6, #EC4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 4,
            }}
          >
            GoodStats
          </Typography>
        </RouterLink>

        <Paper
          elevation={0}
          sx={{
            p: 4,
            width: '100%',
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Typography variant="h5" textAlign="center" fontWeight={600} mb={3}>
            Create Your Account
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              mb: 3,
              textAlign: 'center'
            }}
          >
            We'll send you a magic link to get started - no password needed.
          </Typography>

          {(error || success) && (
            <Alert 
              severity={success ? 'success' : 'error'}
              sx={{ mb: 3 }}
            >
              {success ? 'Magic link sent! Check your email to verify your account.' : error}
            </Alert>
          )}

          <form onSubmit={handleSignUp}>
            <TextField
              fullWidth
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={success || isLoading}
              required
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={!email || success || isLoading}
              sx={{
                py: 1.5,
                mb: 3,
                background: 'linear-gradient(to right, #8B5CF6, #EC4899)',
                '&:hover': {
                  background: 'linear-gradient(to right, #7C3AED, #DB2777)',
                },
              }}
            >
              {isLoading ? <CircularProgress size={24} /> : success ? 'Check Your Email' : 'Create Account'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <MuiLink
                  component={RouterLink}
                  to="/signin"
                  sx={{
                    color: '#8B5CF6',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Sign in
                </MuiLink>
              </Typography>
            </Box>

            {success && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(255, 255, 255, 0.03)', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Can't find the email? Check your spam folder or{' '}
                  <MuiLink
                    component="button"
                    onClick={() => {
                      setSuccess(false);
                      setError(null);
                    }}
                    sx={{
                      color: '#8B5CF6',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    try again
                  </MuiLink>
                </Typography>
              </Box>
            )}
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

const SignUpPage = () => {
  usePageTitle('Sign Up');

  const handleError = (error: Error) => {
    console.error('Sign Up Error:', error);
    return (
      <Box sx={{ p: 3, textAlign: 'center', color: 'white' }}>
        <Typography variant="h6">Something went wrong</Typography>
        <Button
          component={RouterLink}
          to="/"
          sx={{ mt: 2 }}
          variant="contained"
        >
          Return Home
        </Button>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#111827',
        backgroundImage: 'radial-gradient(circle at top right, rgba(139, 92, 246, 0.1), transparent 40%), radial-gradient(circle at bottom left, rgba(236, 72, 153, 0.1), transparent 40%)',
        display: 'flex',
      }}
    >
      <ErrorBoundary FallbackComponent={({ error }) => handleError(error)}>
        <SignUpForm />
      </ErrorBoundary>
    </Box>
  );
};

export default SignUpPage;
