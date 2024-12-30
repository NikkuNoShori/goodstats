import React from 'react';
import {
  Box,
  Breadcrumbs,
  Typography,
  IconButton,
  useTheme,
  alpha,
  Link as MuiLink,
} from '@mui/material';
import { ArrowBack, Settings } from '@mui/icons-material';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AppTheme } from '../../theme/types';
import Logo from './Logo';

const PageHeader: React.FC = () => {
  const theme = useTheme<AppTheme>();
  const navigate = useNavigate();
  const location = useLocation();

  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  const handleBack = () => {
    navigate(-1);
  };

  const getPathToSegment = (index: number): string => {
    return '/' + pathSegments.slice(0, index + 1).join('/');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 4,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Logo />
        {location.pathname !== '/dashboard' && (
          <IconButton
            onClick={handleBack}
            sx={{
              ml: 3,
              color: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
              },
            }}
          >
            <ArrowBack />
          </IconButton>
        )}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Breadcrumbs
          sx={{
            '& .MuiBreadcrumbs-separator': {
              color: theme.palette.text.secondary,
            },
          }}
        >
          <MuiLink
            component={Link}
            to="/dashboard"
            color="text.secondary"
            sx={{ 
              textDecoration: 'none',
              '&:hover': { color: theme.palette.primary.main }
            }}
          >
            GoodStats
          </MuiLink>
          {pathSegments.map((segment, index) => (
            <MuiLink
              key={segment}
              component={Link}
              to={getPathToSegment(index)}
              color={index === pathSegments.length - 1 ? 'primary.main' : 'text.secondary'}
              sx={{ 
                textDecoration: 'none',
                '&:hover': { color: theme.palette.primary.main }
              }}
            >
              {segment.charAt(0).toUpperCase() + segment.slice(1)}
            </MuiLink>
          ))}
        </Breadcrumbs>
        {location.pathname === '/dashboard' && (
          <IconButton 
            onClick={() => navigate('/settings')}
            sx={{ 
              color: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1)
              }
            }}
          >
            <Settings />
          </IconButton>
        )}
      </Box>
    </Box>
  );
};

export default PageHeader; 