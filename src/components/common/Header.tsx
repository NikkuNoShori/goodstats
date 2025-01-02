import { AppBar, Box, Button, Container, IconButton, Stack, Toolbar, Typography } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useProfile } from '../../hooks/useProfile';

const Header = ({ isLandingPage = false, title = 'GoodStats' }) => {
  const navigate = useNavigate();
  const { profile, isLoading } = useProfile();
  const isLoggedIn = !!profile?.id;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <AppBar position="static" color="transparent" elevation={0}>
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              color: 'white',
              textDecoration: 'none',
              fontWeight: 'bold',
              flexGrow: 1,
            }}
          >
            {title}
          </Typography>

          {!isLoading && (
            <Stack direction="row" spacing={2}>
              {isLoggedIn ? (
                <>
                  <Button
                    color="inherit"
                    component={Link}
                    to="/dashboard"
                    sx={{ color: 'white' }}
                  >
                    Dashboard
                  </Button>
                  <Button
                    color="inherit"
                    component={Link}
                    to="/manage-goodreads"
                    sx={{ color: 'white' }}
                  >
                    Manage Goodreads
                  </Button>
                  <Button
                    color="inherit"
                    onClick={handleLogout}
                    sx={{ color: 'white' }}
                  >
                    Logout
                  </Button>
                </>
              ) : !isLandingPage && (
                <>
                  <Button
                    color="inherit"
                    component={Link}
                    to="/signin"
                    sx={{ color: 'white' }}
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