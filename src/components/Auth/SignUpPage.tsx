import {
  Box,
  Typography,
  Button,
  TextField,
  Stack,
  useTheme,
  CircularProgress,
  Link as MuiLink,
  Alert,
  Container,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import { supabase } from '../../services/supabase';
import { AppTheme } from '../../theme/types';
import { usePageTitle } from '../../utils/usePageTitle';
import Header from '../common/Header';

interface AuthError {
  message: string;
  status?: number;
}

const SignUpPage = () => {
  usePageTitle('Sign Up');
  const theme = useTheme<AppTheme>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (!formData.email) {
        throw new Error('Email is required');
      }

      if (!formData.email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (formData.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      const hasUpperCase = /[A-Z]/.test(formData.password);
      const hasLowerCase = /[a-z]/.test(formData.password);
      const hasNumbers = /\d/.test(formData.password);
      
      if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
        throw new Error('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      }

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (signUpError) {
        const error = signUpError as AuthError;
        switch (error.message) {
          case 'User already registered':
            throw new Error('This email is already registered. Please sign in instead.');
          case 'Password should be at least 6 characters':
            throw new Error('Password must be at least 6 characters long');
          case 'Unable to validate email address: invalid format':
            throw new Error('Please enter a valid email address');
          case 'Password is too weak':
            throw new Error('Please choose a stronger password');
          case 'Rate limit exceeded':
            throw new Error('Too many attempts. Please try again later.');
          case 'Network error':
            throw new Error('Network error. Please check your internet connection.');
          default:
            console.error('Unexpected signup error:', error);
            throw new Error(error.message || 'Failed to create account');
        }
      }

      if (!authData.user) {
        throw new Error('No user data returned');
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            email: authData.user.email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            email_confirmed: false,
          }
        ]);

      if (profileError) {
        console.error('Profile creation error:', profileError);
        if (profileError.message.includes('duplicate key')) {
          throw new Error('An account with this email already exists');
        }
        throw new Error('Failed to create user profile');
      }

      setSuccessMessage('Account created successfully! Please check your email to verify your account.');
      
      setTimeout(() => {
        navigate('/dashboard', { 
          state: { 
            emailPending: true,
            message: 'Please verify your email to access all features'
          }
        });
      }, 3000);

    } catch (err) {
      console.error('Sign up error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign up');
      setFormData(prev => ({
        ...prev,
        password: '',
        confirmPassword: '',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ background: '#1a1f2e', minHeight: '100vh' }}>
      <Header title="Sign Up" showBreadcrumbs={false} />
      
      <Box 
        sx={{ 
          position: 'fixed',  // This will position relative to viewport
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none', // Allow clicking through to header
        }}
      >
        <Container maxWidth="sm" sx={{ pointerEvents: 'auto' }}>
          <Box sx={{ 
            maxWidth: 400,
            width: '100%',
            mx: 'auto',
          }}>
            {successMessage && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {successMessage}
              </Alert>
            )}
            
            {error && (
              <Alert 
                severity="error"
                sx={{ mb: 2 }}
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Stack spacing={2.5}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255, 255, 255, 0.7)',
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
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  autoComplete="new-password"
                  helperText="Must be at least 8 characters long"
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
                    '& .MuiFormHelperText-root': {
                      color: 'rgba(255, 255, 255, 0.5)',
                    },
                  }}
                />
                <TextField
                  fullWidth
                  label="Confirm Password"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  autoComplete="new-password"
                  error={formData.password !== formData.confirmPassword && formData.confirmPassword !== ''}
                  helperText={
                    formData.password !== formData.confirmPassword && formData.confirmPassword !== '' 
                      ? 'Passwords do not match'
                      : ' '
                  }
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
                    '& .MuiFormHelperText-root': {
                      color: theme.palette.error.main,
                    },
                  }}
                />
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
                    'Sign Up'
                  )}
                </Button>
              </Stack>
            </form>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Already have an account?{' '}
                <MuiLink
                  component={Link}
                  to="/signin"
                  sx={{
                    color: '#7e3af2',
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
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default SignUpPage;
