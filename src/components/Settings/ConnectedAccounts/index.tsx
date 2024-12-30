import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Stack,
  useTheme,
  alpha,
  Alert,
  CircularProgress,
} from '@mui/material';
import { AppTheme } from '../../../theme/types';
import { goodreadsService } from '../../../services/goodreadsService';
import { userService } from '../../../services/userService';

const ConnectedAccounts: React.FC = () => {
  const theme = useTheme<AppTheme>();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(userService.hasGoodreadsToken());

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const authData = await goodreadsService.initializeAuth();
      // Redirect to Goodreads OAuth page
      window.location.href = authData.authorizeUrl;
    } catch (err) {
      setError('Failed to connect to Goodreads. Please try again.');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    userService.removeGoodreadsToken();
    setIsConnected(false);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Connected Accounts
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={3}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            borderRadius: 1,
            border: '1px solid',
            borderColor: alpha(theme.palette.primary.main, 0.2),
          }}
        >
          <Box>
            <Typography variant="subtitle1">Goodreads</Typography>
            <Typography variant="body2" color="text.secondary">
              {isConnected
                ? 'Connected to your Goodreads account'
                : 'Connect to import your reading data'}
            </Typography>
          </Box>
          <Button
            variant={isConnected ? 'outlined' : 'contained'}
            onClick={isConnected ? handleDisconnect : handleConnect}
            disabled={isConnecting}
            sx={{
              minWidth: 120,
              background: isConnected
                ? 'none'
                : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            }}
          >
            {isConnecting ? (
              <CircularProgress size={24} />
            ) : isConnected ? (
              'Disconnect'
            ) : (
              'Connect'
            )}
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
};

export default ConnectedAccounts; 