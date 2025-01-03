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
  Divider,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { supabase } from '../../services/supabase';
import { usePageTitle } from '../../utils/usePageTitle';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { useQueryClient } from '@tanstack/react-query';

interface AlertState {
  message: string;
  type: 'error' | 'success';
}

const SignInForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAlert(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        // Wait for session to be established
        await supabase.auth.setSession(data.session);
        queryClient.invalidateQueries(['profile']);
        navigate('/dashboard');
      } else {
        throw new Error('No session returned after sign in');
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setAlert({
        message: err instanceof Error ? err.message : 'Failed to sign in',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async () => {
    setIsLoading(true);
    setAlert(null);
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      });

      if (error) throw error;

      setAlert({
        message: 'Magic link sent! Check your email to sign in.',
        type: 'success'
      });
    } catch (err) {
      setAlert({
        message: err instanceof Error ? err.message : 'Failed to send magic link',
        type: 'error'
      });
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
          <Typography variant="h5" textAlign="center" fontWeight={600} mb={4}>
            Welcome Back
          </Typography>

          {alert && (
            <Alert 
              severity={alert.type}
              sx={{ mb: 3 }}
            >
              {alert.message}
            </Alert>
          )}

          <form 
            onSubmit={handleSignIn}
            id="login-form"
            method="post"
            autoComplete="on"
          >
            <Box sx={{ mb: 4 }}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ 
                  '& .MuiInputBase-root': {
                    bgcolor: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '8px',
                    height: '52px',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    transform: 'translate(14px, -24px) scale(0.75)',
                    fontSize: '1.15rem',
                    fontWeight: 500,
                    letterSpacing: '0.02em',
                    '&.Mui-focused': {
                      color: '#8B5CF6',
                    },
                    '&.MuiFormLabel-filled, &.Mui-focused': {
                      transform: 'translate(14px, -24px) scale(0.75)',
                    },
                    '& .MuiFormLabel-asterisk': {
                      display: 'none',
                    },
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    '& legend': {
                      width: '0px !important',
                    },
                  },
                  '& input': {
                    color: 'white',
                    padding: '14px 16px',
                    fontSize: '1.05rem',
                  },
                  '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus': {
                    '-webkit-box-shadow': '0 0 0 30px rgba(30, 41, 59, 0.8) inset !important',
                    '-webkit-text-fill-color': 'white !important',
                    'caret-color': 'white',
                  },
                }}
                required
                name="email"
                id="email"
                autoComplete="username email"
                InputLabelProps={{
                  shrink: true
                }}
                inputProps={{
                  autoCapitalize: "none",
                  form: "login-form"
                }}
              />
            </Box>

            <Box sx={{ mb: 4 }}>
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                name="password"
                id="password"
                autoComplete="current-password"
                sx={{ 
                  '& .MuiInputBase-root': {
                    bgcolor: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '8px',
                    height: '52px',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    transform: 'translate(14px, -24px) scale(0.75)',
                    fontSize: '1.15rem',
                    fontWeight: 500,
                    letterSpacing: '0.02em',
                    '&.Mui-focused': {
                      color: '#8B5CF6',
                    },
                    '&.MuiFormLabel-filled, &.Mui-focused': {
                      transform: 'translate(14px, -24px) scale(0.75)',
                    },
                    '& .MuiFormLabel-asterisk': {
                      display: 'none',
                    },
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    '& legend': {
                      width: '0px !important',
                    },
                  },
                  '& input': {
                    color: 'white',
                    padding: '14px 16px',
                    fontSize: '1.05rem',
                  },
                  '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus': {
                    '-webkit-box-shadow': '0 0 0 30px rgba(30, 41, 59, 0.8) inset !important',
                    '-webkit-text-fill-color': 'white !important',
                    'caret-color': 'white',
                  },
                }}
                InputLabelProps={{
                  shrink: true
                }}
                inputProps={{
                  form: "login-form"
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        aria-label={showPassword ? "hide password" : "show password"}
                        tabIndex={-1}
                        sx={{ 
                          color: 'rgba(255, 255, 255, 0.7)',
                          mr: 0.5
                        }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isLoading}
              form="login-form"
              sx={{
                py: 1.5,
                mb: 2,
                background: 'linear-gradient(to right, #8B5CF6, #EC4899)',
                '&:hover': {
                  background: 'linear-gradient(to right, #7C3AED, #DB2777)',
                },
              }}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
          </form>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>

          <Button
            fullWidth
            variant="outlined"
            onClick={handleMagicLink}
            disabled={!email || isLoading}
            sx={{
              py: 1.5,
              mb: 3,
              borderColor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.3)',
              },
            }}
          >
            Continue with Magic Link
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Don't have an account?{' '}
              <MuiLink
                component={RouterLink}
                to="/signup"
                sx={{
                  color: '#8B5CF6',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Sign up
              </MuiLink>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

const SignInPage = () => {
  usePageTitle('Sign In');

  const handleError = (error: Error) => {
    console.error('Sign In Error:', error);
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
        flexDirection: 'column',
      }}
    >
      <ErrorBoundary FallbackComponent={({ error }) => handleError(error)}>
        <SignInForm />
      </ErrorBoundary>
    </Box>
  );
};

export default SignInPage;
