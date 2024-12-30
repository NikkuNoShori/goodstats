import React from 'react';
import {
  Container,
  Paper,
  Box,
  Grid,
  useTheme,
  alpha,
} from '@mui/material';
import ProfileSettings from './ProfileSettings/index';
import ConnectedAccounts from './ConnectedAccounts/index';
import { AppTheme } from '../../theme/types';
import { usePageTitle } from '../../utils/usePageTitle';
import PageHeader from '../common/PageHeader';

const SettingsPage: React.FC = () => {
  usePageTitle('Settings');
  const theme = useTheme<AppTheme>();

  return (
    <Box sx={{ 
      minHeight: '100vh',
      py: 4,
      background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`
    }}>
      <Container maxWidth="lg">
        <PageHeader />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <ProfileSettings />
          </Grid>
          <Grid item xs={12} md={6}>
            <ConnectedAccounts />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default SettingsPage; 