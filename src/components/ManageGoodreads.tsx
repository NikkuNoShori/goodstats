import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Card,
  CardContent,
  Skeleton,
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { Session } from '@supabase/supabase-js';

interface GoodreadsProfile {
  id: string;
  goodreads_user_id: string;
  created_at: string;
  updated_at: string;
  last_sync?: string;
}

export default function ManageGoodreads() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [goodreadsUrl, setGoodreadsUrl] = useState('');
  const queryClient = useQueryClient();

  // Get current user ID
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session as Session | null;
    }
  });

  const userId = session?.user?.id;

  // Fetch Goodreads profile data
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['goodreads-profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data as GoodreadsProfile;
    },
    enabled: !!userId
  });

  const extractGoodreadsId = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      for (const part of pathParts) {
        if (/^\d+$/.test(part)) {
          return part;
        }
      }
      return null;
    } catch (err) {
      return null;
    }
  };

  const handleUrlSubmit = async () => {
    if (!userId) return;

    const goodreadsId = extractGoodreadsId(goodreadsUrl);
    if (!goodreadsId) {
      setError('Invalid Goodreads URL. Please provide a valid profile URL.');
      return;
    }

    try {
      setIsLoading(true);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          goodreads_user_id: goodreadsId,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      setDialogOpen(false);
      setGoodreadsUrl('');
      queryClient.invalidateQueries({ queryKey: ['goodreads-profile', userId] });
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          goodreads_user_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ['goodreads-profile', userId] });
    } catch (err) {
      console.error('Profile disconnect error:', err);
      setError(err instanceof Error ? err.message : 'Failed to disconnect profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearData = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Call cleanup endpoint with user ID using POST
      const response = await fetch(`http://localhost:3000/api/cleanup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: userId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cleanup database');
      }

      // Clear React Query cache for this user's data
      queryClient.removeQueries(['books', userId]);
      queryClient.removeQueries(['goodreads-profile', userId]);

      // Force refetch to ensure UI updates
      await Promise.all([
        queryClient.refetchQueries(['books', userId]),
        queryClient.refetchQueries(['goodreads-profile', userId])
      ]);

      // Show success message
      setError(null);
    } catch (error) {
      console.error('Error clearing data:', error);
      setError(error instanceof Error ? error.message : 'Failed to clear data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ 
      pt: '64px', // Height of the AppBar
      px: 3,
      minHeight: '100vh',
      bgcolor: 'background.default'
    }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom color="text.primary">
              Manage Goodreads
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Connect and manage your Goodreads account
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {/* Profile Section */}
        <Card sx={{ bgcolor: 'background.paper' }}>
          <CardContent>
            {profileLoading ? (
              <>
                <Skeleton variant="text" sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                <Skeleton variant="text" sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                <Skeleton variant="text" sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
              </>
            ) : profile?.goodreads_user_id ? (
              <>
                <Typography variant="h6" gutterBottom color="text.primary">
                  Connected Goodreads Account
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Goodreads ID: {profile.goodreads_user_id}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Connected since: {new Date(profile.created_at).toLocaleDateString()}
                  </Typography>
                  {profile.last_sync && (
                    <Typography variant="body2" color="text.secondary">
                      Last synced: {new Date(profile.last_sync).toLocaleString()}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    onClick={() => setDialogOpen(true)}
                    disabled={isLoading}
                  >
                    Update Connection
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleDisconnect}
                    disabled={isLoading}
                  >
                    Disconnect
                  </Button>
                </Box>
              </>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" gutterBottom color="text.primary">
                  No Goodreads Account Connected
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }} color="text.secondary">
                  Connect your Goodreads account to start syncing your reading history
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    onClick={() => setDialogOpen(true)}
                    disabled={isLoading}
                  >
                    Connect Goodreads
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleClearData}
                    disabled={isLoading}
                  >
                    Clear Data
                  </Button>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Goodreads URL Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => {
          setDialogOpen(false);
          setError(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {profile?.goodreads_user_id ? 'Update Goodreads Connection' : 'Connect Your Goodreads Account'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Please enter your Goodreads profile URL to {profile?.goodreads_user_id ? 'update your' : 'sync your'} reading history.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Goodreads Profile URL"
            type="url"
            fullWidth
            variant="outlined"
            value={goodreadsUrl}
            onChange={(e) => setGoodreadsUrl(e.target.value)}
            placeholder="https://www.goodreads.com/user/show/YOUR_ID"
            error={!!error}
            helperText={error}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDialogOpen(false);
            setError(null);
          }}>
            Cancel
          </Button>
          <Button 
            onClick={handleUrlSubmit}
            variant="contained"
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Connect'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 