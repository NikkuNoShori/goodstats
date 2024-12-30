import React from 'react';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Divider,
  Stack,
  useTheme,
  alpha
} from '@mui/material';
import {
  AdminPanelSettings,
  LoginOutlined
} from '@mui/icons-material';
import { AppTheme } from '../theme/types';

const SignInPage: React.FC = () => {
  const theme = useTheme<AppTheme>();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`,
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            p: 4,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
            backdropFilter: 'blur(10px)',
            border: '1px solid',
            borderColor: 'primary.main',
            borderRadius: 2,
          }}
        >
          <Stack spacing={4} alignItems="center">
            <Typography
              variant="h4"
              fontWeight="bold"
              sx={{
                background: `linear-gradient(120deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Welcome Back
            </Typography>

            <Stack spacing={3} sx={{ width: '100%' }}>
              <TextField
                fullWidth
                label="Email"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: alpha(theme.palette.primary.main, 0.2),
                    },
                    '&:hover fieldset': {
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                }}
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: alpha(theme.palette.primary.main, 0.2),
                    },
                    '&:hover fieldset': {
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                }}
              />
              <Button
                variant="contained"
                size="large"
                fullWidth
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  py: 1.5,
                }}
              >
                Sign In
              </Button>
            </Stack>

            <Box sx={{ width: '100%', position: 'relative', my: 2 }}>
              <Divider>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'text.secondary',
                    px: 2,
                  }}
                >
                  or continue with
                </Typography>
              </Divider>
            </Box>

            <Stack spacing={2} sx={{ width: '100%' }}>
              <Button
                variant="outlined"
                size="large"
                startIcon={<LoginOutlined />}
                sx={{
                  borderColor: alpha(theme.palette.primary.main, 0.5),
                  color: 'text.primary',
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    background: alpha(theme.palette.primary.main, 0.05),
                  },
                }}
              >
                Sign in with Goodreads
              </Button>
              <Button
                variant="outlined"
                size="large"
                startIcon={<AdminPanelSettings />}
                sx={{
                  borderColor: alpha(theme.palette.secondary.main, 0.5),
                  color: 'text.primary',
                  '&:hover': {
                    borderColor: theme.palette.secondary.main,
                    background: alpha(theme.palette.secondary.main, 0.05),
                  },
                }}
              >
                Admin Login
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default SignInPage; 