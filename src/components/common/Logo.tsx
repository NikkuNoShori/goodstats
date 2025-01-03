import { Box, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  gradient?: boolean;
  linkTo?: string;
}

const Logo = ({ size = 'medium', showText = true, gradient = false, linkTo = '/' }: LogoProps) => {
  const sizes = {
    small: { height: 24, fontSize: 'h6' },
    medium: { height: 32, fontSize: 'h5' },
    large: { height: 48, fontSize: 'h4' },
  };

  return (
    <Box
      component={Link}
      to={linkTo}
      role="button"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        textDecoration: 'none',
        color: 'white',
        cursor: 'pointer',
        position: 'relative',
        zIndex: 1200,
        '&:hover': {
          textDecoration: 'none',
        },
        '&:active': {
          transform: 'scale(0.98)',
        },
      }}
    >
      <Box
        component="img"
        src="/logo.svg"
        alt="GoodStats Logo"
        sx={{
          height: sizes[size].height,
          display: 'block',
          pointerEvents: 'none',
        }}
      />
      {showText && (
        <Typography
          variant={sizes[size].fontSize as any}
          component="span"
          sx={{
            color: 'white',
            fontWeight: 'bold',
            display: 'block',
            pointerEvents: 'none',
            ...(gradient && {
              background: 'linear-gradient(120deg, #7e3af2, #9f7aea)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }),
          }}
        >
          GoodStats
        </Typography>
      )}
    </Box>
  );
};

export default Logo;
