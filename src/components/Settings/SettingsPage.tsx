import React from 'react';
import { Container, Grid, Paper } from '@mui/material';
import { PageHeader } from '../common/PageHeader';
import { ProfileSettings } from './ProfileSettings';
import { ConnectedAccounts } from './ConnectedAccounts';
import { usePageTitle } from '../../utils/usePageTitle';
import { ErrorBoundary } from '../common/ErrorBoundary';

export const SettingsPage: React.FC = () => {
  usePageTitle('Settings');

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PageHeader title="Settings" />
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <ErrorBoundary>
            <ProfileSettings />
          </ErrorBoundary>
        </Grid>
        <Grid item xs={12} md={6}>
          <ErrorBoundary>
            <ConnectedAccounts />
          </ErrorBoundary>
        </Grid>
      </Grid>
    </Container>
  );
}; 