import {
  AutoStories,
  QueryStats,
  Timeline,
  PieChart,
  TrendingUp,
  MenuBook,
} from '@mui/icons-material';
import {
  Container,
  Box,
  Typography,
  Grid,
  Paper,
  Stack,
  Button,
  useTheme,
  alpha,
} from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import { AppTheme } from '../theme/types';
import { usePageTitle } from '../utils/usePageTitle';
import Header from './common/Header';

const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => {
  const theme = useTheme<AppTheme>();

  return (
    <Paper
      sx={{
        p: 3,
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
        backdropFilter: 'blur(10px)',
        border: '1px solid',
        borderColor: 'primary.main',
        borderRadius: 2,
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
        },
      }}
    >
      <Stack spacing={2}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: theme =>
              `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6" fontWeight="bold">
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {description}
        </Typography>
      </Stack>
    </Paper>
  );
};

const LandingPage: React.FC = () => {
  usePageTitle('GoodStats - Track Your Reading Journey');
  const theme = useTheme<AppTheme>();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/signin');
  };

  return (
    <Box sx={{ background: '#1a1f2e', minHeight: '100vh' }}>
      <Header isLandingPage title={''} />
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`,
          pt: { xs: 8, md: 12 },
          pb: { xs: 8, md: 12 },
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Stack spacing={4}>
                <Typography
                  variant="h2"
                  fontWeight="bold"
                  sx={{
                    background: `linear-gradient(120deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                  }}
                >
                  Track Your Reading Journey
                </Typography>
                <Typography variant="h5" color="text.secondary" sx={{ maxWidth: 500 }}>
                  Transform your Goodreads library into beautiful insights and discover patterns in
                  your reading habits.
                </Typography>
                <Box>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleGetStarted}
                    sx={{
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                      px: 4,
                      py: 1.5,
                    }}
                  >
                    Get Started
                  </Button>
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src="/reading-stats.svg"
                alt="Reading Statistics Dashboard"
                sx={{
                  width: '100%',
                  maxWidth: 600,
                  height: 'auto',
                  filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))',
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container sx={{ py: { xs: 8, md: 12 } }}>
        <Typography variant="h3" textAlign="center" fontWeight="bold" sx={{ mb: 8 }}>
          Features
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <FeatureCard
              icon={<QueryStats sx={{ color: 'white' }} />}
              title="Reading Analytics"
              description="Get detailed statistics about your reading habits, including pages read, books completed, and reading pace."
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FeatureCard
              icon={<Timeline sx={{ color: 'white' }} />}
              title="Progress Tracking"
              description="Track your reading goals and see your progress over time with beautiful visualizations."
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FeatureCard
              icon={<PieChart sx={{ color: 'white' }} />}
              title="Genre Analysis"
              description="Discover your favorite genres and explore your reading preferences through interactive charts."
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FeatureCard
              icon={<TrendingUp sx={{ color: 'white' }} />}
              title="Reading Trends"
              description="Identify patterns in your reading habits and track your improvement over time."
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FeatureCard
              icon={<AutoStories sx={{ color: 'white' }} />}
              title="Library Insights"
              description="Get a deeper understanding of your personal library with comprehensive analytics."
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FeatureCard
              icon={<MenuBook sx={{ color: 'white' }} />}
              title="Reading History"
              description="View your complete reading history with detailed timelines and milestones."
            />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default LandingPage;
