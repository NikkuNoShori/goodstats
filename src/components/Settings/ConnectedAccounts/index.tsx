import React from 'react';
import { 
  Box, Card, CardContent, Typography, Button, Stack, 
  CircularProgress, Alert, Snackbar, LinearProgress 
} from '@mui/material';
import { AutoStories } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../services/supabase';
import { goodreadsService } from '../../../services/goodreadsService';
import { AccountInfoModal } from './AccountInfoModal';

export const ConnectedAccounts: React.FC = () => {
  const queryClient = useQueryClient();
  const [notification, setNotification] = React.useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [showAccountInfo, setShowAccountInfo] = React.useState(false);
  const [syncProgress, setSyncProgress] = React.useState(0);

  const { data: profile, isLoading, error: profileError } = useQuery(
    ['profile'],
    async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      return supabase.from('profiles').select('*').eq('id', user.id).single();
    }
  );

  const { 
    data: syncStatus, 
    isLoading: isSyncStatusLoading,
    error: syncStatusError 
  } = useQuery(['syncStatus'], async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return supabase.rpc('get_sync_status', { p_user_id: user.id });
  });

  const syncMutation = useMutation(
    async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Start sync
      setSyncProgress(0);
      const syncId = await goodreadsService.startSync();
      
      // Poll for progress
      const interval = setInterval(async () => {
        const { data } = await supabase.rpc('get_sync_progress', { p_sync_id: syncId });
        if (data) {
          setSyncProgress(data.progress);
          if (data.progress >= 100) {
            clearInterval(interval);
          }
        }
      }, 1000);

      await goodreadsService.syncBooks();
      clearInterval(interval);
      setSyncProgress(100);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['syncStatus']);
        setNotification({ message: 'Books synced successfully', type: 'success' });
        setSyncProgress(0);
      },
      onError: (error) => {
        setNotification({ 
          message: 'Failed to sync books. Please try again.', 
          type: 'error' 
        });
        setSyncProgress(0);
      }
    }
  );

  const restoreBackupMutation = useMutation(
    async () => {
      const backup = localStorage.getItem('books_backup');
      if (!backup) throw new Error('No backup found');

      const books = JSON.parse(backup);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Restore books in batches
      const batchSize = 50;
      for (let i = 0; i < books.length; i += batchSize) {
        const batch = books.slice(i, i + batchSize);
        await supabase.from('books').insert(batch);
        setSyncProgress((i + batchSize) / books.length * 100);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['syncStatus']);
        setNotification({ message: 'Backup restored successfully', type: 'success' });
        setSyncProgress(0);
      },
      onError: (error) => {
        setNotification({ 
          message: 'Failed to restore backup. Please try again.', 
          type: 'error' 
        });
        setSyncProgress(0);
      }
    }
  );

  const disconnectMutation = useMutation(
    async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Backup current data
      const { data: books } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', user.id);

      localStorage.setItem('books_backup', JSON.stringify(books));

      await supabase
        .from('profiles')
        .update({
          goodreads_id: null,
          goodreads_token: null,
          goodreads_refresh_token: null,
          goodreads_token_expiry: null
        })
        .eq('id', user.id);

      await supabase
        .from('books')
        .delete()
        .eq('user_id', user.id);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['profile']);
        queryClient.invalidateQueries(['syncStatus']);
        setNotification({ 
          message: 'Goodreads account disconnected successfully', 
          type: 'success' 
        });
      },
      onError: (error) => {
        setNotification({ 
          message: 'Failed to disconnect account. Please try again.', 
          type: 'error' 
        });
      }
    }
  );

  const handleConnect = async () => {
    try {
      const authUrl = await goodreadsService.initializeAuth();
      window.location.href = authUrl;
    } catch (error) {
      setNotification({ 
        message: 'Failed to start Goodreads authentication', 
        type: 'error' 
      });
    }
  };

  const handleDisconnect = async () => {
    if (window.confirm('Are you sure? This will remove all your synced books.')) {
      await disconnectMutation.mutateAsync();
    }
  };

  if (profileError || syncStatusError) {
    return (
      <Alert severity="error">
        Failed to load account information. Please refresh the page.
      </Alert>
    );
  }

  if (isLoading || isSyncStatusLoading) {
    return <CircularProgress />;
  }

  return (
    <>
      <Card>
        <CardContent>
          <Stack spacing={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6">Connected Accounts</Typography>
              {profile?.data?.goodreads_id && (
                <Button 
                  size="small"
                  onClick={() => setShowAccountInfo(true)}
                >
                  View Stats
                </Button>
              )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <AutoStories />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1">Goodreads</Typography>
                <Typography variant="body2" color="text.secondary">
                  {profile?.data?.goodreads_id 
                    ? `Connected · ${syncStatus?.data?.book_count || 0} books synced`
                    : 'Not connected'}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                onClick={profile?.data?.goodreads_id ? handleDisconnect : handleConnect}
                disabled={syncMutation.isLoading || disconnectMutation.isLoading}
              >
                {profile?.data?.goodreads_id ? 'Disconnect' : 'Connect'}
              </Button>
              {profile?.data?.goodreads_id && (
                <Button
                  variant="contained"
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isLoading || disconnectMutation.isLoading}
                >
                  {syncMutation.isLoading ? 'Syncing...' : 'Sync Books'}
                </Button>
              )}
            </Box>

            {syncStatus?.data?.last_sync && (
              <Typography variant="body2" color="text.secondary">
                Last synced: {new Date(syncStatus.data.last_sync).toLocaleString()}
              </Typography>
            )}

            {(syncMutation.isLoading || restoreBackupMutation.isLoading) && (
              <Box sx={{ width: '100%' }}>
                <LinearProgress 
                  variant="determinate" 
                  value={syncProgress} 
                  sx={{ height: 8, borderRadius: 1 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  {syncProgress.toFixed(0)}% Complete
                </Typography>
              </Box>
            )}

            {profile?.data?.goodreads_id && localStorage.getItem('books_backup') && (
              <Button
                variant="outlined"
                color="warning"
                onClick={() => {
                  if (window.confirm('Restore books from last backup?')) {
                    restoreBackupMutation.mutate();
                  }
                }}
                disabled={syncMutation.isLoading || restoreBackupMutation.isLoading}
              >
                Restore Last Backup
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      <AccountInfoModal 
        open={showAccountInfo} 
        onClose={() => setShowAccountInfo(false)} 
      />
      
      <Snackbar
        open={!!notification}
        autoHideDuration={6000}
        onClose={() => setNotification(null)}
      >
        <Alert 
          severity={notification?.type || 'info'} 
          onClose={() => setNotification(null)}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </>
  );
}; 