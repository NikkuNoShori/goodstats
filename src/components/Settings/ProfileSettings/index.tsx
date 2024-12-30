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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  Collapse,
  LinearProgress,
} from '@mui/material';
import { userService } from '../../../services/userService';
import { AppTheme } from '../../../theme/types';

const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireNumber: true,
  requireSpecial: true,
  requireUppercase: true
};

const calculatePasswordStrength = (password: string): number => {
  if (!password) return 0;
  let strength = 0;

  // Length check
  if (password.length >= PASSWORD_REQUIREMENTS.minLength) strength += 25;
  
  // Number check
  if (/\d/.test(password)) strength += 25;
  
  // Special character check
  if (/[!@#$%^&*]/.test(password)) strength += 25;
  
  // Uppercase check
  if (/[A-Z]/.test(password)) strength += 25;

  return strength;
};

const getStrengthColor = (strength: number) => {
  if (strength <= 25) return 'error.main';
  if (strength <= 50) return 'warning.main';
  if (strength <= 75) return 'info.main';
  return 'success.main';
};

const getStrengthLabel = (strength: number) => {
  if (strength <= 25) return 'Weak';
  if (strength <= 50) return 'Fair';
  if (strength <= 75) return 'Good';
  return 'Strong';
};

const ProfileSettings: React.FC = () => {
  const theme = useTheme<AppTheme>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const validatePassword = (pass: string) => {
    if (pass.length < PASSWORD_REQUIREMENTS.minLength) return false;
    if (PASSWORD_REQUIREMENTS.requireNumber && !/\d/.test(pass)) return false;
    if (PASSWORD_REQUIREMENTS.requireSpecial && !/[!@#$%^&*]/.test(pass)) return false;
    if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(pass)) return false;
    return true;
  };

  const handleUpdateEmail = async () => {
    try {
      const isUnique = await userService.isEmailUnique(email);
      if (!isUnique) {
        setMessage({ type: 'error', text: 'Email is already in use' });
        return;
      }
      await userService.updateEmail(email);
      setMessage({ type: 'success', text: 'Email updated successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update email' });
    }
  };

  const handleUpdatePassword = async () => {
    if (!validatePassword(password)) {
      setMessage({ 
        type: 'error', 
        text: 'Password must be at least 8 characters and include numbers, special characters, and uppercase letters' 
      });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    try {
      await userService.updatePassword(password);
      setMessage({ type: 'success', text: 'Password updated successfully' });
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update password' });
    }
  };

  const passwordStrength = calculatePasswordStrength(password);

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
          <Stack spacing={2}>
            <TextField
              fullWidth
              type="password"
              size="small"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setIsPasswordFocused(true)}
              placeholder="New password"
            />
            {password && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Password Strength
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ color: getStrengthColor(passwordStrength) }}
                  >
                    {getStrengthLabel(passwordStrength)}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={passwordStrength}
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: getStrengthColor(passwordStrength),
                    },
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Password must contain at least 8 characters, including numbers, special characters, and uppercase letters
                </Typography>
              </Box>
            )}
            <Collapse in={isPasswordFocused}>
              <TextField
                fullWidth
                type="password"
                size="small"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                sx={{ mt: 1 }}
              />
            </Collapse>
            <Button
              variant="contained"
              onClick={handleUpdatePassword}
              disabled={!password || (isPasswordFocused && !confirmPassword)}
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              }}
            >
              Update
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
};

export default ProfileSettings; 