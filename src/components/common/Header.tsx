import { AppBar, Box, Button, Container, Stack, Toolbar } from '@mui/material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useProfile } from '../../hooks/useProfile';
import Logo from './Logo';

interface HeaderProps {
  isLandingPage?: boolean;
  onManageGoodreads?: () => void;
  selectedShelf?: string;
  onShelfSelect?: (shelf: string) => void;
}

const Header = ({ 
  isLandingPage = false,
  onManageGoodreads,
  selectedShelf,
  onShelfSelect
}: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, isLoading } = useProfile();
  const isLoggedIn = !!profile?.id;
  const isDashboard = location.pathname === '/dashboard';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <AppBar 
      position="fixed" 
      color="transparent" 
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        zIndex: 1100,
        background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
        backdropFilter: 'blur(8px)'
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <Logo 
            size="medium" 
            gradient={isLandingPage} 
            linkTo={isLoggedIn ? '/dashboard' : '/'} 
          />
          <Box sx={{ flexGrow: 1 }} />

          {!isLoading && (
            <Stack direction="row" spacing={2}>
              {isLoggedIn ? (
                isDashboard ? (
                  // Dashboard-specific navigation
                  <>
                    <Button
                      variant="text"
                      color="inherit"
                      sx={{ 
                        textTransform: 'none',
                        fontWeight: selectedShelf === 'all' ? 700 : 400,
                        color: 'white',
                        opacity: 0.9,
                        '&:hover': {
                          opacity: 1
                        }
                      }}
                      onClick={() => onShelfSelect?.('all')}
                    >
                      Dashboard
                    </Button>
                    <Button
                      variant="text"
                      color="inherit"
                      sx={{ 
                        textTransform: 'none', 
                        color: 'white',
                        opacity: 0.9,
                        '&:hover': {
                          opacity: 1
                        }
                      }}
                      onClick={onManageGoodreads}
                    >
                      Manage Goodreads
                    </Button>
                    <Button
                      variant="text"
                      color="inherit"
                      component={Link}
                      to="/settings"
                      sx={{ 
                        textTransform: 'none', 
                        color: 'white',
                        opacity: 0.9,
                        '&:hover': {
                          opacity: 1
                        }
                      }}
                    >
                      Settings
                    </Button>
                    <Button
                      color="error"
                      variant="text"
                      onClick={handleLogout}
                      sx={{ 
                        color: 'error.light',
                        '&:hover': {
                          color: 'error.main',
                          bgcolor: 'error.dark',
                          bgcolor: 'rgba(244, 67, 54, 0.08)'
                        }
                      }}
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  // Regular logged-in navigation
                  <>
                    <Button
                      color="inherit"
                      component={Link}
                      to="/dashboard"
                      sx={{ 
                        color: 'white',
                        opacity: 0.9,
                        '&:hover': {
                          opacity: 1
                        }
                      }}
                    >
                      Dashboard
                    </Button>
                    <Button
                      color="inherit"
                      component={Link}
                      to="/manage-goodreads"
                      sx={{ 
                        color: 'white',
                        opacity: 0.9,
                        '&:hover': {
                          opacity: 1
                        }
                      }}
                    >
                      Manage Goodreads
                    </Button>
                    <Button
                      color="error"
                      variant="text"
                      onClick={handleLogout}
                      sx={{ 
                        color: 'error.light',
                        '&:hover': {
                          color: 'error.main',
                          bgcolor: 'error.dark',
                          bgcolor: 'rgba(244, 67, 54, 0.08)'
                        }
                      }}
                    >
                      Logout
                    </Button>
                  </>
                )
              ) : !isLandingPage && (
                <>
                  <Button
                    color="inherit"
                    component={Link}
                    to="/signin"
                    sx={{ 
                      color: 'white',
                      opacity: 0.9,
                      '&:hover': {
                        opacity: 1
                      }
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="contained"
                    component={Link}
                    to="/signup"
                    sx={{
                      background: 'linear-gradient(120deg, #7e3af2, #9f7aea)',
                      '&:hover': {
                        background: 'linear-gradient(120deg, #6c2bd9, #9061ea)',
                      },
                    }}
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </Stack>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header; 