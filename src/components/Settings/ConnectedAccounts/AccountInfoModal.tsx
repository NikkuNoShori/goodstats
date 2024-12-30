import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  useTheme,
} from '@mui/material';
import { AppTheme } from '../../../theme/types';

interface AccountInfoModalProps {
  open: boolean;
  onClose: () => void;
  account: {
    id: string;
    provider: string;
    email: string;
    connected: string;
    addedBy: string;
    lastUsed: string;
    tokenStatus: 'active' | 'expired';
  };
}

const AccountInfoModal: React.FC<AccountInfoModalProps> = ({ open, onClose, account }) => {
  const theme = useTheme<AppTheme>();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Connected Account Details
      </DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">Provider</Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>{account.provider}</Typography>

          <Typography variant="subtitle2" color="text.secondary">Email</Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>{account.email}</Typography>

          <Typography variant="subtitle2" color="text.secondary">Connected On</Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {new Date(account.connected).toLocaleDateString()}
          </Typography>

          <Typography variant="subtitle2" color="text.secondary">Added By</Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>{account.addedBy}</Typography>

          <Typography variant="subtitle2" color="text.secondary">Last Used</Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {new Date(account.lastUsed).toLocaleDateString()}
          </Typography>

          <Typography variant="subtitle2" color="text.secondary">Token Status</Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: account.tokenStatus === 'active' ? 'success.main' : 'error.main'
            }}
          >
            {account.tokenStatus.charAt(0).toUpperCase() + account.tokenStatus.slice(1)}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AccountInfoModal; 