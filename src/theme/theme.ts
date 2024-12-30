import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#7C3AED', // Deep purple
      light: '#9F67FF',
      dark: '#5B21B6',
    },
    secondary: {
      main: '#EC4899', // Pink
    },
    background: {
      default: '#0F172A', // Dark blue-gray
      paper: '#1E293B',  // Slightly lighter blue-gray
    },
    text: {
      primary: '#F1F5F9', // Light gray
      secondary: '#94A3B8', // Muted gray
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: '1px solid rgba(124, 58, 237, 0.12)',
        },
      },
    },
  },
}); 