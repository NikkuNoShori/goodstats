import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../../services/supabase';

interface HeaderProps {
  title?: string;
}

const Header = ({ title }: HeaderProps) => {
  const location = useLocation();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AppBar position="fixed" sx={{ bgcolor: '#1a1f2e', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {title || 'GoodStats'}
        </Typography>
        {location.pathname !== '/signin' && location.pathname !== '/signup' && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              component={Link}
              to="/dashboard"
              color="inherit"
              sx={{
                opacity: location.pathname === '/dashboard' ? 1 : 0.7,
                '&:hover': { opacity: 1 }
              }}
            >
              Dashboard
            </Button>
            <Button
              component={Link}
              to="/manage-goodreads"
              color="inherit"
              sx={{
                opacity: location.pathname === '/manage-goodreads' ? 1 : 0.7,
                '&:hover': { opacity: 1 }
              }}
            >
              Manage Goodreads
            </Button>
            <Button
              color="inherit"
              onClick={handleSignOut}
              sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
            >
              Sign Out
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header; 