import React, { useState } from 'react';
import { Card, CardContent, Typography, Stack, TextField, Button, Alert } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../services/supabase';
import { userService } from '../../../services/userService';

export const ProfileSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { data: profile, isLoading } = useQuery(['profile'], async () => {
    return userService.getProfile();
  });

  const updateMutation = useMutation(
    async ({ email, password }: { email?: string; password?: string }) => {
      const updates: any = {};
      if (email) updates.email = email;
      if (password) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
      }
      if (Object.keys(updates).length > 0) {
        await userService.updateProfile(updates);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['profile']);
        setPassword('');
        setConfirmPassword('');
      },
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updates: { email?: string; password?: string } = {};
    
    if (email && email !== profile?.email) {
      updates.email = email;
    }
    
    if (password) {
      if (password !== confirmPassword) {
        updateMutation.setError(new Error('Passwords do not match'));
        return;
      }
      updates.password = password;
    }

    if (Object.keys(updates).length > 0) {
      updateMutation.mutate(updates);
    }
  };

  if (isLoading) return null;

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <Typography variant="h6">Profile Settings</Typography>

            {updateMutation.isError && (
              <Alert severity="error">
                {updateMutation.error instanceof Error 
                  ? updateMutation.error.message 
                  : 'Failed to update profile'}
              </Alert>
            )}

            {updateMutation.isSuccess && (
              <Alert severity="success">Profile updated successfully</Alert>
            )}

            <TextField
              label="Email"
              type="email"
              value={email || profile?.email || ''}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
            />

            <TextField
              label="New Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
            />

            <TextField
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
              error={password !== confirmPassword}
              helperText={
                password !== confirmPassword ? 'Passwords do not match' : ''
              }
            />

            <Button
              type="submit"
              variant="contained"
              disabled={updateMutation.isLoading}
            >
              {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </Stack>
        </form>
      </CardContent>
    </Card>
  );
}; 