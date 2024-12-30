import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Alert } from '@mui/material';
import { supabase } from '../../services/supabase';

const EmailConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get the token and email from URL
        const token = searchParams.get('token');
        const email = searchParams.get('email'); // Make sure email is included in confirmation URL
        const type = searchParams.get('type');

        if (!token || !email || type !== 'signup') {
          throw new Error('Invalid confirmation link');
        }

        // First verify the token
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup',
          email: email
        });

        if (verifyError) throw verifyError;

        // Then sign in the user
        const { data: { session }, error: signInError } = await supabase.auth.getSession();
        
        if (signInError) throw signInError;

        if (!session) {
          // If no session exists, create one
          const { error: autoSignInError } = await supabase.auth.signInWithOtp({
            email: email,
            options: {
              shouldCreateUser: false
            }
          });

          if (autoSignInError) throw autoSignInError;
        }

        // Update the profile to mark email as confirmed
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('profiles')
            .update({ 
              email_confirmed: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
        }

        // Navigate to dashboard
        navigate('/dashboard', {
          replace: true,
          state: { 
            message: 'Email confirmed successfully! Welcome to GoodStats!' 
          }
        });
      } catch (err) {
        console.error('Email confirmation error:', err);
        setError(err instanceof Error ? err.message : 'Failed to confirm email');
        // Redirect to sign in page after a delay if there's an error
        setTimeout(() => {
          navigate('/signin', {
            state: { 
              error: 'Please try signing in again.' 
            }
          });
        }, 3000);
      }
    };

    handleEmailConfirmation();
  }, [navigate, searchParams]);

  if (error) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh',
          background: '#1a1f2e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3 
        }}
      >
        <Alert 
          severity="error"
          sx={{ 
            maxWidth: 400,
            width: '100%'
          }}
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#1a1f2e',
      }}
    >
      <CircularProgress sx={{ color: '#7e3af2' }} />
    </Box>
  );
};

export default EmailConfirmation; 