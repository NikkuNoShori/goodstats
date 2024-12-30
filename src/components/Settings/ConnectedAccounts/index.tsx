import { AutoStories } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  LinearProgress,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { goodreadsService } from '../../../services/goodreadsService';
import { supabase } from '../../../services/supabase';

import { AccountInfoModal } from './AccountInfoModal';

interface SyncStatus {
  book_count: number;
  last_sync: string;
}

interface NotificationType {
  message: string;
  type: 'success' | 'error';
}

export const ConnectedAccounts = () => {
  const queryClient = useQueryClient();
  const [notification, setNotification] = useState<NotificationType | null>(null);
  const [showAccountInfo, setShowAccountInfo] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      return supabase.from('profiles').select('*').eq('id', user.id).single();
    }
  });

  const { data: syncStatus, isLoading: isSyncStatusLoading } = useQuery({
    queryKey: ['syncStatus'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      return supabase.rpc('get_sync_status', { p_user_id: user.id }) as Promise<SyncStatus>;
    }
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['syncStatus'] });
      setNotification({ message: 'Books synced successfully', type: 'success' });
      setSyncProgress(0);
    },
    onError: () => {
      setNotification({
        message: 'Failed to sync books. Please try again.',
        type: 'error',
      });
      setSyncProgress(0);
    }
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      await supabase.from('profiles').update({
        goodreads_id: null,
        goodreads_token: null,
        goodreads_refresh_token: null,
      }).eq('id', user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setNotification({ message: 'Account disconnected successfully', type: 'success' });
    }
  });

  const handleConnect = async () => {
    try {
      const authUrl = await goodreadsService.initializeAuth();
      window.location.href = authUrl;
    } catch {
      setNotification({
        message: 'Failed to start Goodreads authentication',
        type: 'error',
      });
    }
  };

  const handleDisconnect = () => {
    if (window.confirm('Are you sure? This will remove all your synced books.')) {
      disconnectMutation.mutate();
    }
  };

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
                <Button size="small" onClick={() => setShowAccountInfo(true)}>
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
                    ? `Connected · ${syncStatus?.book_count || 0} books synced`
                    : 'Not connected'}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                onClick={profile?.data?.goodreads_id ? handleDisconnect : handleConnect}
                disabled={syncMutation.isPending || disconnectMutation.isPending}
              >
                {profile?.data?.goodreads_id ? 'Disconnect' : 'Connect'}
              </Button>
              {profile?.data?.goodreads_id && (
                <Button
                  variant="contained"
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending || disconnectMutation.isPending}
                >
                  {syncMutation.isPending ? 'Syncing...' : 'Sync Books'}
                </Button>
              )}
            </Box>

            {syncStatus?.data?.last_sync && (
              <Typography variant="body2" color="text.secondary">
                Last synced: {new Date(syncStatus.data.last_sync).toLocaleString()}
              </Typography>
            )}

            {(syncMutation.isPending) && (
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
          </Stack>
        </CardContent>
      </Card>

      <AccountInfoModal open={showAccountInfo} onClose={() => setShowAccountInfo(false)} />

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
