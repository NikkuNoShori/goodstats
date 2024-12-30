import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { Link } from 'react-router-dom';
import { AppTheme } from '../../theme/types';
import { AutoStories } from '@mui/icons-material';

const Logo: React.FC = () => {
  const theme = useTheme<AppTheme>();

  return (
    <Link to="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AutoStories 
          sx={{ 
            fontSize: 32,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            borderRadius: 1,
            p: 0.5,
            color: 'white'
          }} 
        />
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 'bold',
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          }}
        >
          GoodStats
        </Typography>
      </Box>
    </Link>
  );
};

export default Logo; 