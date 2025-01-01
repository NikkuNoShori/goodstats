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
import Header from './common/Header';
import { Session } from '@supabase/supabase-js';

interface GoodreadsProfile {
  id: string;
  goodreads_user_id: string;
  created_at: string;
  updated_at: string;
  last_sync?: string;
}

const ManageGoodreads = () => {
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

  return (
    <>
      <Header title="" />
      <Box sx={{ 
        background: '#1a1f2e', 
        minHeight: '100vh',
        pt: '88px',
        px: 2
      }}>
        <Box sx={{ 
          maxWidth: '1200px',
          width: '100%',
          mx: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}>
          {/* Header Section */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mt: 3,
          }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.5)',
                  }}
                >
                  Home
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.5)',
                  }}
                >
                  /
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.5)',
                  }}
                >
                  Manage Goodreads
                </Typography>
              </Box>
              <Typography
                variant="h4"
                sx={{
                  color: 'white',
                  fontWeight: 600,
                  mb: 0.5,
                  lineHeight: 1.2,
                }}
              >
                Manage Goodreads
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  lineHeight: 1.2,
                }}
              >
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
          <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', color: 'white' }}>
            <CardContent>
              {profileLoading ? (
                <>
                  <Skeleton variant="text" sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                  <Skeleton variant="text" sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                  <Skeleton variant="text" sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                </>
              ) : profile?.goodreads_user_id ? (
                <>
                  <Typography variant="h6" gutterBottom>
                    Connected Goodreads Account
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                      Goodreads ID: {profile.goodreads_user_id}
                    </Typography>
                    <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                      Connected since: {new Date(profile.created_at).toLocaleDateString()}
                    </Typography>
                    {profile.last_sync && (
                      <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
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
                  <Typography variant="h6" gutterBottom>
                    No Goodreads Account Connected
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 3, color: 'rgba(255, 255, 255, 0.7)' }}>
                    Connect your Goodreads account to start syncing your reading history
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => setDialogOpen(true)}
                    disabled={isLoading}
                  >
                    Connect Goodreads
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
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
          <Button onClick={handleUrlSubmit} variant="contained">
            {profile?.goodreads_user_id ? 'Update' : 'Connect'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ManageGoodreads; 