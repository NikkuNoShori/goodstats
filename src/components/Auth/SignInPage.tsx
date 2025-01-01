import { useState } from 'react';
import { Box, Button, TextField, Typography, Alert } from '@mui/material';
import { supabase } from '../../services/supabase';
import { usePageTitle } from '../../utils/usePageTitle';

const SignInPage = () => {
  usePageTitle('Sign In');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      });

      if (error) throw error;

      setSuccess(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
      setSuccess(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a1f2e',
        p: 3
      }}
    >
      <Box
        component="form"
        onSubmit={handleSignIn}
        sx={{
          maxWidth: '400px',
          width: '100%',
          p: 4,
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 2,
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        <Typography
          variant="h4"
          sx={{
            color: 'white',
            mb: 1,
            fontWeight: 600
          }}
        >
          Sign In
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            mb: 3
          }}
        >
          Enter your email to receive a magic link
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Check your email for the magic link
          </Alert>
        )}

        <TextField
          fullWidth
          type="email"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              color: 'rgba(255, 255, 255, 0.7)',
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.1)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.2)',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#7e3af2',
              },
            },
            '& .MuiInputLabel-root': {
              color: 'rgba(255, 255, 255, 0.5)',
            },
          }}
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={!email || success}
          sx={{
            py: 1.5,
            background: 'linear-gradient(120deg, #7e3af2, #9f7aea)',
            '&:hover': {
              background: 'linear-gradient(120deg, #6c2bd9, #9061ea)',
            },
          }}
        >
          {success ? 'Check Your Email' : 'Send Magic Link'}
        </Button>
      </Box>
    </Box>
  );
};

export default SignInPage;
