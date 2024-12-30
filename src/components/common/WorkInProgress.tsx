import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import { Container, Typography, Box, Paper, Stack } from '@mui/material';
import React from 'react';

const WorkInProgress: React.FC = () => {
  return (
    <Container
      maxWidth="md"
      sx={{
        py: 8,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: { xs: 4, md: 6 },
          backgroundColor: 'background.paper',
          borderRadius: 4,
          width: '100%',
          background: theme =>
            `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
          boxShadow: theme => `0 8px 32px -8px ${theme.palette.primary.main}40`,
        }}
      >
        <Stack spacing={4} alignItems="center">
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              backgroundColor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <AutoStoriesIcon sx={{ fontSize: 40, color: 'background.paper' }} />
          </Box>

          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontFamily: 'Playfair Display, serif',
              fontWeight: 700,
              textAlign: 'center',
              background: theme =>
                `linear-gradient(120deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              mb: 2,
            }}
          >
            Coming Soon
          </Typography>

          <Typography
            variant="h5"
            sx={{
              color: 'text.secondary',
              textAlign: 'center',
              maxWidth: '600px',
              lineHeight: 1.6,
              mb: 3,
            }}
          >
            We're crafting a cozy corner where your reading journey comes to life through beautiful
            statistics and insights.
          </Typography>

          <Box
            sx={{
              p: 3,
              bgcolor: 'background.default',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'primary.main',
              maxWidth: '500px',
              width: '100%',
            }}
          >
            <Typography
              variant="body1"
              sx={{
                color: 'text.primary',
                textAlign: 'center',
                fontStyle: 'italic',
              }}
            >
              "A reader lives a thousand lives before he dies... The man who never reads lives only
              one."
              <Typography component="span" display="block" sx={{ color: 'primary.main', mt: 1 }}>
                — George R.R. Martin
              </Typography>
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
};

export default WorkInProgress;
