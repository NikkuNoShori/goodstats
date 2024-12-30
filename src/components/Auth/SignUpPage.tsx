import React, { useState, useEffect } from 'react';
import {
  Container, Box, Paper, Typography, Button, TextField,
  Stack, useTheme, alpha, Link as MuiLink, Alert, Grow, Fade
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { AppTheme } from '../../theme/types';
import { usePageTitle } from '../../utils/usePageTitle';
import { validateEmail, validatePassword } from '../../utils/validation';
import { secureStorage } from '../../utils/storage';

interface FormErrors {
  email?: string[];
  password?: string[];
  confirmPassword?: string[];
}

const STORAGE_KEY = 'signup_form_data';

const SignUpPage: React.FC = () => {
  usePageTitle('Sign Up');
  const theme = useTheme<AppTheme>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [verificationSent, setVerificationSent] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [resendTimeout, setResendTimeout] = useState<number>(0);
  const emailRef = React.useRef<HTMLInputElement>(null);

  // Load saved form data with encryption
  useEffect(() => {
    const savedData = secureStorage.get(STORAGE_KEY);
    if (savedData) {
      setFormData(savedData);
    }
  }, []);

  // Save form data with encryption
  useEffect(() => {
    secureStorage.set(STORAGE_KEY, formData);
  }, [formData]);

  // Autofocus email field
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      const form = e.currentTarget.closest('form');
      if (form) {
        const inputs = Array.from(form.querySelectorAll('input'));
        const index = inputs.indexOf(e.target as HTMLInputElement);
        if (index < inputs.length - 1) {
          e.preventDefault();
          inputs[index + 1].focus();
        }
      }
    }
  };

  // Real-time validation
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (formData.email || formData.password || formData.confirmPassword) {
        validateForm();
      }
    }, 500);

    return () => clearTimeout(debounceTimeout);
  }, [formData]);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    let isValid = true;

    // Email validation
    if (!validateEmail(formData.email)) {
      errors.email = ['Please enter a valid email address'];
      isValid = false;
    }

    // Password validation
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors;
      isValid = false;
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = ['Passwords do not match'];
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    try {
      // Implement signup logic here
      // After successful signup, send verification email
      setVerificationSent(true);
    } catch (err) {
      setError('Failed to create account');
    }
  };

  const handleResendVerification = async () => {
    try {
      // Implement resend verification logic here
      setResendTimeout(60); // Start 60 second countdown
      const countdownInterval = setInterval(() => {
        setResendTimeout(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError('Failed to resend verification email');
    }
  };

  // Clean up saved data after successful verification
  useEffect(() => {
    if (verificationSent) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [verificationSent]);

  if (verificationSent) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
        background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`,
        py: 4 }}>
        <Container maxWidth="sm">
          <Paper elevation={24} sx={{ p: 4, background: alpha(theme.palette.background.paper, 0.4),
            backdropFilter: 'blur(10px)', borderRadius: 2 }}>
            <Stack spacing={3} alignItems="center">
              <Typography variant="h4" fontWeight="bold">
                Verify Your Email
              </Typography>
              <Typography align="center" color="text.secondary">
                We've sent a verification link to {formData.email}. 
                Please check your email and click the link to activate your account.
              </Typography>
              <MuiLink component={Link} to="/signin"
                sx={{ color: theme.palette.primary.main }}>
                Return to sign in
              </MuiLink>
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="text"
                  onClick={handleResendVerification}
                  disabled={resendTimeout > 0}
                  sx={{ color: theme.palette.primary.main }}
                >
                  {resendTimeout > 0 
                    ? `Resend in ${resendTimeout}s` 
                    : 'Resend verification email'}
                </Button>
              </Box>
            </Stack>
          </Paper>
        </Container>
      </Box>
    );
  }

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newFormData = {
      ...formData,
      [field]: e.target.value
    };
    setFormData(newFormData);
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
      background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`,
      py: 4 }}>
      <Container maxWidth="sm">
        <Paper elevation={24} sx={{ p: 4, background: alpha(theme.palette.background.paper, 0.4),
          backdropFilter: 'blur(10px)', borderRadius: 2 }}>
          <Stack spacing={3}>
            <Typography variant="h4" fontWeight="bold" textAlign="center">
              Create Account
            </Typography>

            {error && (
              <Typography color="error" align="center">{error}</Typography>
            )}

            <form onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <Grow in={true} timeout={500}>
                  <TextField
                    inputRef={emailRef}
                    fullWidth
                    label="Email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange('email')}
                    error={!!formErrors.email}
                    helperText={
                      <Fade in={!!formErrors.email}>
                        <span>{formErrors.email?.[0]}</span>
                      </Fade>
                    }
                    onKeyDown={handleKeyDown}
                  />
                </Grow>
                <Grow in={true} timeout={700}>
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange('password')}
                    error={!!formErrors.password}
                    helperText={
                      <Fade in={!!formErrors.password}>
                        <span>{formErrors.password?.[0]}</span>
                      </Fade>
                    }
                    onKeyDown={handleKeyDown}
                  />
                </Grow>
                {formErrors.password && formErrors.password.length > 1 && (
                  <Fade in={true}>
                    <Alert severity="info" sx={{ mt: 1 }}>
                      <Typography variant="body2">Password must:</Typography>
                      <ul style={{ margin: '4px 0' }}>
                        {formErrors.password.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </Alert>
                  </Fade>
                )}
                <Grow in={true} timeout={900}>
                  <TextField
                    fullWidth
                    label="Confirm Password"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange('confirmPassword')}
                    error={!!formErrors.confirmPassword}
                    helperText={
                      <Fade in={!!formErrors.confirmPassword}>
                        <span>{formErrors.confirmPassword?.[0]}</span>
                      </Fade>
                    }
                    onKeyDown={handleKeyDown}
                  />
                </Grow>
                <Grow in={true} timeout={1100}>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    size="large" 
                    fullWidth
                    sx={{ py: 1.5, background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)` }}
                  >
                    Sign Up
                  </Button>
                </Grow>
              </Stack>
            </form>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <MuiLink component={Link} to="/signin"
                  sx={{ color: theme.palette.primary.main, textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' } }}>
                  Sign in
                </MuiLink>
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default SignUpPage; 