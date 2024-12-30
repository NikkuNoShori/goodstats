import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { goodreadsService } from '../services/goodreadsService';
import { userService } from '../services/userService';
import {
  Container,
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Stack,
  Divider,
  useTheme,
  alpha,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Link as MuiLink,
} from '@mui/material';
import { LoginOutlined, AutoStories } from '@mui/icons-material';
import { AppTheme } from '../theme/types';
import { usePageTitle } from '../utils/usePageTitle';
import { Link } from 'react-router-dom';

interface LocationState {
  error?: string;
}

const SignInPage: React.FC = () => {
  usePageTitle('Sign In');
  const theme = useTheme<AppTheme>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const location = useLocation();
  const state = location.state as LocationState;
  const [isGoodreadsLoading, setIsGoodreadsLoading] = useState(false);

  useEffect(() => {
    if (state?.error) {
      setError(state.error);
    }
  }, [state]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Implement email login logic here
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  const handleGoodreadsLogin = async () => {
    try {
      setIsGoodreadsLoading(true);
      const authUrl = await goodreadsService.initializeAuth();
      window.location.href = authUrl;
    } catch (err) {
      setError('Failed to start authentication. Please try again.');
      setIsGoodreadsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`,
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            p: 4,
            background: alpha(theme.palette.background.paper, 0.4),
            backdropFilter: 'blur(10px)',
            border: '1px solid',
            borderColor: alpha(theme.palette.primary.main, 0.2),
            borderRadius: 2,
          }}
        >
          <Stack spacing={3}>
            <Typography variant="h4" fontWeight="bold" textAlign="center">
              Welcome to GoodStats
            </Typography>

            {error && (
              <Typography color="error" align="center">
                {error}
              </Typography>
            )}

            <form onSubmit={handleEmailLogin}>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center' 
                }}>
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        sx={{ 
                          color: theme.palette.primary.main,
                          '&.Mui-checked': {
                            color: theme.palette.primary.main,
                          },
                        }}
                      />
                    }
                    label="Remember me"
                  />
                  <MuiLink
                    component={Link}
                    to="/forgot-password"
                    sx={{ 
                      color: theme.palette.primary.main,
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    Forgot password?
                  </MuiLink>
                </Box>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  sx={{
                    py: 1.5,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  }}
                >
                  Sign In
                </Button>
              </Stack>
            </form>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <MuiLink
                  component={Link}
                  to="/signup"
                  sx={{ 
                    color: theme.palette.primary.main,
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Sign up
                </MuiLink>
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                OR
              </Typography>
            </Divider>

            <Button
              variant="outlined"
              size="large"
              startIcon={isGoodreadsLoading ? <CircularProgress size={20} /> : <AutoStories />}
              onClick={handleGoodreadsLogin}
              disabled={isGoodreadsLoading}
              sx={{
                py: 1.5,
                borderColor: alpha(theme.palette.primary.main, 0.3),
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  background: alpha(theme.palette.primary.main, 0.05),
                },
              }}
            >
              {isGoodreadsLoading ? 'Connecting...' : 'Connect with Goodreads'}
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default SignInPage; 