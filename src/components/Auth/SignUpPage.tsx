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
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { supabase } from '../../services/supabase';
import { usePageTitle } from '../../utils/usePageTitle';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { useQueryClient } from '@tanstack/react-query';

const SignUpForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.email) return 'Email is required';
    if (!formData.password) return 'Password is required';
    if (formData.password.length < 6) return 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
    return null;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const { data: { user }, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username || undefined,
          }
        }
      });

      if (error) throw error;

      if (user) {
        queryClient.invalidateQueries(['profile']);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
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
            Create Your Account
          </Typography>

          {error && (
            <Alert 
              severity="error"
              sx={{ mb: 3 }}
            >
              {error}
            </Alert>
          )}

          <form 
            onSubmit={handleSignUp}
            id="signup-form"
            method="post"
            autoComplete="on"
          >
            <Box sx={{ mb: 4 }}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
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
                autoComplete="username email"
              />
            </Box>

            <Box sx={{ mb: 4 }}>
              <TextField
                fullWidth
                label="Username (optional)"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
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
              />
            </Box>

            <Box sx={{ mb: 4 }}>
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
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
                autoComplete="new-password"
              />
            </Box>

            <Box sx={{ mb: 4 }}>
              <TextField
                fullWidth
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
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
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                        aria-label={showConfirmPassword ? "hide password" : "show password"}
                        tabIndex={-1}
                        sx={{ 
                          color: 'rgba(255, 255, 255, 0.7)',
                          mr: 0.5
                        }}
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                autoComplete="new-password"
              />
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isLoading}
              sx={{
                py: 1.5,
                mb: 3,
                background: 'linear-gradient(to right, #8B5CF6, #EC4899)',
                '&:hover': {
                  background: 'linear-gradient(to right, #7C3AED, #DB2777)',
                },
              }}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Create Account'}
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
