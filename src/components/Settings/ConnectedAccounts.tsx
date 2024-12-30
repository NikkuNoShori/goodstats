import {
  Paper,
  Typography,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  useTheme,
  alpha,
} from '@mui/material';
import React from 'react';

import { AppTheme } from '../../theme/types';

interface ConnectedAccount {
  id: string;
  provider: string;
  email: string;
  connected: string;
}

const ConnectedAccounts: React.FC = () => {
  const theme = useTheme<AppTheme>();
  const [accounts, setAccounts] = React.useState<ConnectedAccount[]>([
    {
      id: '1',
      provider: 'Goodreads',
      email: 'user@example.com',
      connected: '2024-01-01',
    },
  ]);

  const handleDisconnect = (id: string) => {
    setAccounts(accounts.filter(account => account.id !== id));
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Connected Accounts
      </Typography>

      <List>
        {accounts.map(account => (
          <ListItem key={account.id} divider>
            <Avatar
              sx={{
                mr: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              }}
            >
              {account.provider[0]}
            </Avatar>
            <ListItemText
              primary={account.provider}
              secondary={`Connected on ${new Date(account.connected).toLocaleDateString()}`}
            />
            <ListItemSecondaryAction>
              <Button
                variant="outlined"
                color="error"
                onClick={() => handleDisconnect(account.id)}
                sx={{
                  borderColor: theme.palette.error.main,
                  color: theme.palette.error.main,
                  '&:hover': {
                    borderColor: theme.palette.error.dark,
                    backgroundColor: alpha(theme.palette.error.main, 0.1),
                  },
                }}
              >
                Disconnect
              </Button>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default ConnectedAccounts;
