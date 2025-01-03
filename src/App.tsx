import { Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SupabaseProvider } from './context/SupabaseProvider';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import ManageGoodreads from './components/ManageGoodreads';
import theme from './theme/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      retry: 2,
      retryDelay: 1000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SupabaseProvider>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/manage" element={<ManageGoodreads />} />
          </Routes>
        </SupabaseProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
