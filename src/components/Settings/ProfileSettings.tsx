import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Stack,
  useTheme,
  alpha,
  Alert,
} from '@mui/material';
import { userService } from '../../services/userService';
import { AppTheme } from '../../theme/types';

const ProfileSettings: React.FC = () => {
  const theme = useTheme<AppTheme>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleUpdateEmail = async () => {
    try {
      await userService.updateEmail(email);
      setMessage({ type: 'success', text: 'Email updated successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update email' });
    }
  };

  const handleUpdatePassword = async () => {
    try {
      await userService.updatePassword(password);
      setMessage({ type: 'success', text: 'Password updated successfully' });
      setPassword('');
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update password' });
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Profile Settings
      </Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }}>
          {message.text}
        </Alert>
      )}

      <Stack spacing={3}>
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Email Address
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              size="small"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="New email address"
            />
            <Button
              variant="contained"
              onClick={handleUpdateEmail}
              disabled={!email}
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              }}
            >
              Update
            </Button>
          </Box>
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Password
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              type="password"
              size="small"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
            />
            <Button
              variant="contained"
              onClick={handleUpdatePassword}
              disabled={!password}
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              }}
            >
              Update
            </Button>
          </Box>
        </Box>
      </Stack>
    </Paper>
  );
};

export default ProfileSettings; 