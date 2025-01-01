import { Box, Typography } from '@mui/material';
import Header from '../common/Header';
import { usePageTitle } from '../../utils/usePageTitle';

const SettingsPage = () => {
  usePageTitle('Settings');

  return (
    <>
      <Header title="" />
      <Box sx={{ 
        background: '#1a1f2e', 
        minHeight: '100vh',
        pt: '88px',
        px: 2
      }}>
        <Box sx={{ 
          maxWidth: '1200px',
          width: '100%',
          mx: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}>
          {/* Header Section */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mt: 3,
          }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.5)',
                  }}
                >
                  Home
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.5)',
                  }}
                >
                  /
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.5)',
                  }}
                >
                  Settings
                </Typography>
              </Box>
              <Typography
                variant="h4"
                sx={{
                  color: 'white',
                  fontWeight: 600,
                  mb: 0.5,
                  lineHeight: 1.2,
                }}
              >
                Settings
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  lineHeight: 1.2,
                }}
              >
                Manage your account settings and preferences
              </Typography>
            </Box>
          </Box>

          {/* Settings content will go here */}
        </Box>
      </Box>
    </>
  );
};

export default SettingsPage;
