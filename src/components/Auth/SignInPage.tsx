import { AutoStories } from '@mui/icons-material';
import {
  Container,
  Box,
  Typography,
  Button,
  TextField,
  Stack,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Link as MuiLink,
  Alert,
  Divider,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import { supabase } from '../../services/supabase';
import { usePageTitle } from '../../utils/usePageTitle';
import Header from '../common/Header';

const SignInPage = () => {
  usePageTitle('Sign In');
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Handle specific error cases
        if (error.message.includes('Email not confirmed')) {
          const { error: resendError } = await supabase.auth.resend({
            type: 'signup',
            email,
          });
          
          if (resendError) throw resendError;
          throw new Error('Please check your email to confirm your account. A new confirmation email has been sent.');
        }
        throw error;
      }

      if (data.user) {
        // Send token to extension if installed
        try {
          const extensionId = 'YOUR_EXTENSION_ID'; // Get this from chrome://extensions
          chrome.runtime.sendMessage(extensionId, {
            type: 'setToken',
            token: data.session?.access_token
          });
        } catch (err) {
          // Extension not installed, ignore
        }
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestAccess = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email: import.meta.env.VITE_GUEST_EMAIL,
        password: import.meta.env.VITE_GUEST_PASSWORD,
      });

      if (error) throw error;
      if (user) {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to access as guest');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ background: '#1a1f2e', minHeight: '100vh' }}>
      <Header title="Sign In" showBreadcrumbs={false} />
      
      <Box 
        sx={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <Container maxWidth="sm" sx={{ 
          pointerEvents: 'auto',
          display: 'flex',
          justifyContent: 'center',
          px: 3,
          py: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 2,
          backdropFilter: 'blur(8px)',
          border: '1px solid',
          borderColor: 'rgba(255, 255, 255, 0.1)'
        }}>
          <Box sx={{ 
            width: '100%',
            maxWidth: 400,
          }}>
            {error && (
              <Alert 
                severity="error" 
                sx={{ mb: 2 }}
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            )}

            <form onSubmit={handleEmailLogin}>
              <Stack spacing={2.5}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#7e3af2',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255, 255, 255, 0.7)',
                      '&.Mui-focused': {
                        color: '#7e3af2',
                      },
                    },
                    '& .MuiOutlinedInput-input': {
                      color: 'white',
                    },
                  }}
                />
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="new-password"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#7e3af2',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255, 255, 255, 0.7)',
                      '&.Mui-focused': {
                        color: '#7e3af2',
                      },
                    },
                    '& .MuiOutlinedInput-input': {
                      color: 'white',
                    },
                  }}
                />
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        disabled={isLoading}
                        sx={{
                          color: 'rgba(255, 255, 255, 0.7)',
                          '&.Mui-checked': {
                            color: '#7e3af2',
                          },
                        }}
                      />
                    }
                    label={
                      <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Remember me
                      </Typography>
                    }
                  />
                  <MuiLink
                    component={Link}
                    to="/forgot-password"
                    sx={{
                      color: '#7e3af2',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Forgot password?
                  </MuiLink>
                </Box>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                  sx={{
                    py: 1.5,
                    backgroundColor: '#7e3af2',
                    '&:hover': {
                      backgroundColor: '#6c2bd9',
                    },
                  }}
                >
                  {isLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </Stack>
            </form>

            <Box sx={{ position: 'relative', my: 3 }}>
              <Divider sx={{ 
                '&::before, &::after': {
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                }
              }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.5)',
                    px: 1,
                  }}
                >
                  OR
                </Typography>
              </Divider>
            </Box>

            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={handleGuestAccess}
              disabled={isLoading}
              startIcon={<AutoStories />}
              sx={{
                py: 1.5,
                borderColor: 'rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': {
                  borderColor: '#7e3af2',
                  backgroundColor: 'rgba(126, 58, 242, 0.08)',
                },
              }}
            >
              Continue as Guest
            </Button>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Don't have an account?{' '}
                <MuiLink
                  component={Link}
                  to="/signup"
                  sx={{
                    color: '#7e3af2',
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
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default SignInPage;
