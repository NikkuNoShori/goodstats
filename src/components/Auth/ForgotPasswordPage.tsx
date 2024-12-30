import React, { useState } from 'react';
import {
  Container, Box, Paper, Typography, Button, TextField,
  Stack, useTheme, alpha, Link as MuiLink
} from '@mui/material';
import { Link } from 'react-router-dom';
import { AppTheme } from '../../theme/types';
import { usePageTitle } from '../../utils/usePageTitle';

const ForgotPasswordPage: React.FC = () => {
  usePageTitle('Reset Password');
  const theme = useTheme<AppTheme>();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Implement password reset logic here
      setSubmitted(true);
    } catch (err) {
      setError('Failed to send reset email');
    }
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
              Reset Password
            </Typography>

            {submitted ? (
              <Stack spacing={2} alignItems="center">
                <Typography>
                  If an account exists with that email, you will receive password reset instructions.
                </Typography>
                <MuiLink component={Link} to="/signin"
                  sx={{ color: theme.palette.primary.main }}>
                  Return to sign in
                </MuiLink>
              </Stack>
            ) : (
              <>
                {error && (
                  <Typography color="error" align="center">{error}</Typography>
                )}

                <form onSubmit={handleSubmit}>
                  <Stack spacing={2}>
                    <TextField
                      fullWidth label="Email" type="email" required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                    <Button type="submit" variant="contained" size="large" fullWidth
                      sx={{ py: 1.5, background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)` }}>
                      Send Reset Link
                    </Button>
                  </Stack>
                </form>

                <Box sx={{ textAlign: 'center' }}>
                  <MuiLink component={Link} to="/signin"
                    sx={{ color: theme.palette.primary.main, textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' } }}>
                    Back to sign in
                  </MuiLink>
                </Box>
              </>
            )}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default ForgotPasswordPage; 