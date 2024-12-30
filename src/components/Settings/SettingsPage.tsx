import { Container, Box } from '@mui/material';

import { usePageTitle } from '../../utils/usePageTitle';
import ErrorBoundary from '../common/ErrorBoundary';
import Header from '../common/Header';
import ProfileSettings from './ProfileSettings';

const SettingsPage = () => {
  usePageTitle('Settings');

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#1a1f2e',
        pt: 4,
      }}
    >
      <Container maxWidth="lg">
        <Header 
          title="Settings" 
          subtitle="Manage your account and preferences"
        />
        <ErrorBoundary>
          <ProfileSettings />
        </ErrorBoundary>
      </Container>
    </Box>
  );
};

export default SettingsPage;
