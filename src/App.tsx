import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import AuthCallback from './components/Auth/AuthCallback';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import { SettingsPage } from './components/Settings/SettingsPage';
import SignInPage from './components/SignInPage';
import ErrorBoundary from './components/common/ErrorBoundary';
import { userService } from './services/userService';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = userService.isAuthenticated();
  return isAuthenticated ? <>{children}</> : <Navigate to="/signin" />;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      onError: (error: unknown) => {
        // Global error handling
        console.error('Query error:', error);
      },
    },
    mutations: {
      retry: 1,
      onError: (error: unknown) => {
        console.error('Mutation error:', error);
      },
    },
  },
});

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </QueryClientProvider>
);

export default App;
