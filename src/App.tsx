import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';

import AuthCallback from './components/Auth/AuthCallback';
import SignInPage from './components/Auth/SignInPage';
import SignUpPage from './components/Auth/SignUpPage';
import GoodreadsCallback from './components/Auth/GoodreadsCallback';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import SettingsPage from './components/Settings/SettingsPage';
import EmailConfirmation from './components/Auth/EmailConfirmation';
import { SupabaseProvider } from './context/SupabaseProvider';
import theme from './theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
});

function App() {
  return (
    <ErrorBoundary
      fallback={
        <div style={{ padding: 20, textAlign: 'center', color: 'white' }}>
          <h1>Something went wrong</h1>
          <button onClick={() => window.location.reload()}>Refresh Page</button>
        </div>
      }
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <BrowserRouter>
            <SupabaseProvider>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/signin" element={<SignInPage />} />
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/auth/confirm" element={<EmailConfirmation />} />
                <Route path="/auth/goodreads/callback" element={<GoodreadsCallback />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </SupabaseProvider>
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
