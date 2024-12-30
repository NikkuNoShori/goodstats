import { Box, Typography, Breadcrumbs, Link as MuiLink, Button } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { Settings } from '@mui/icons-material';
import Logo from './Logo';
import { supabase } from '../../services/supabase';
import { useEffect, useState } from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBreadcrumbs?: boolean;
  isLandingPage?: boolean;
}

const Header = ({ title, subtitle, showBreadcrumbs = true, isLandingPage = false }: HeaderProps) => {
  const location = useLocation();
  const theme = useTheme();
  const pathnames = location.pathname.split('/').filter(x => x);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();
  }, []);

  const isAuthPage = ['/signin', '/signup'].includes(location.pathname);

  return (
    <>
      {/* Marketing Header */}
      <Box 
        sx={{ 
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          py: 1.5,
          px: 2,
        }}
      >
        <Box 
          sx={{ 
            width: '100%',
            mx: 'auto',
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Logo size="small" gradient />
          
          {isLandingPage ? (
            // Landing page buttons
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                component={Link}
                to="/signin"
                variant="text"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&:hover': {
                    color: 'white',
                  },
                }}
              >
                Sign In
              </Button>
              <Button
                component={Link}
                to="/signup"
                variant="contained"
                sx={{
                  backgroundColor: '#7e3af2',
                  '&:hover': {
                    backgroundColor: '#6c2bd9',
                  },
                }}
              >
                Get Started
              </Button>
            </Box>
          ) : isAuthenticated && !isAuthPage ? (
            // Navigation for authenticated pages
            <Box sx={{ display: 'flex', gap: 3 }}>
              <MuiLink 
                component={Link} 
                to="/settings"
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: 'rgba(255, 255, 255, 0.7)',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s',
                  '&:hover': {
                    color: theme.palette.primary.main
                  }
                }}
              >
                <Settings fontSize="small" />
                Settings
              </MuiLink>
            </Box>
          ) : null}
        </Box>
      </Box>

      {/* Page Content Header */}
      {!isLandingPage && (
        <Box sx={{ mb: 3, px: 2, pt: 3 }}>
          <Box sx={{ width: '100%', mx: 'auto' }}>
            {showBreadcrumbs && pathnames.length > 0 && (
              <Breadcrumbs 
                sx={{ 
                  mb: 1,
                  '& .MuiBreadcrumbs-separator': {
                    color: 'rgba(255, 255, 255, 0.3)'
                  }
                }}
              >
                <MuiLink 
                  component={Link} 
                  to="/"
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.5)',
                    textDecoration: 'none',
                    '&:hover': {
                      color: '#7e3af2'
                    }
                  }}
                >
                  Home
                </MuiLink>
                {pathnames.map((name, index) => {
                  const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
                  const isLast = index === pathnames.length - 1;

                  return isLast ? (
                    <Typography 
                      key={name} 
                      sx={{ 
                        color: 'rgba(255, 255, 255, 0.7)',
                        textTransform: 'capitalize'
                      }}
                    >
                      {name}
                    </Typography>
                  ) : (
                    <MuiLink
                      key={name}
                      component={Link}
                      to={routeTo}
                      sx={{ 
                        color: 'rgba(255, 255, 255, 0.5)',
                        textDecoration: 'none',
                        textTransform: 'capitalize',
                        '&:hover': {
                          color: '#7e3af2'
                        }
                      }}
                    >
                      {name}
                    </MuiLink>
                  );
                })}
              </Breadcrumbs>
            )}

            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                color: 'white',
                fontWeight: 'bold',
                mb: subtitle ? 1 : 0
              }}
            >
              {title}
            </Typography>
            
            {subtitle && (
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '1.1rem'
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      )}
    </>
  );
};

export default Header; 