import { Card, CardContent, Typography, Stack, TextField, Button, Alert } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { supabase } from '../../../services/supabase';
import { userService } from '../../../services/userService';

interface UpdateProfileData {
  email?: string;
  password?: string;
}

const ProfileSettings = () => {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => userService.getProfile()
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: UpdateProfileData) => {
      if (updates.email) {
        const { error } = await supabase.auth.updateUser({ email: updates.email });
        if (error) throw error;
      }
      if (updates.password) {
        const { error } = await supabase.auth.updateUser({ password: updates.password });
        if (error) throw error;
      }
      if (updates.email) {
        await userService.updateProfile({ email: updates.email });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setPassword('');
      setConfirmPassword('');
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updates: UpdateProfileData = {};

    if (email && email !== profile?.email) {
      updates.email = email;
    }

    if (password) {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
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
            {error && <Alert severity="error">{error}</Alert>}
            {updateMutation.isSuccess && (
              <Alert severity="success">Profile updated successfully</Alert>
            )}
            <TextField
              label="Email"
              type="email"
              value={email || profile?.email || ''}
              onChange={e => setEmail(e.target.value)}
              fullWidth
            />
            <TextField
              label="New Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              fullWidth
            />
            <TextField
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              fullWidth
              error={password !== confirmPassword}
              helperText={password !== confirmPassword ? 'Passwords do not match' : ''}
            />
            <Button type="submit" variant="contained" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </Stack>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProfileSettings;
