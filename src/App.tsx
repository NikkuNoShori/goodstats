import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './services/supabase';
import Dashboard from './components/Dashboard';
import SignInPage from './components/Auth/SignInPage';
import SignUpPage from './components/Auth/SignUpPage';
import LandingPage from './components/LandingPage';
import ManageGoodreads from './components/ManageGoodreads';
import { Session } from '@supabase/supabase-js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import theme from './theme/theme';
import { SupabaseProvider } from './context/SupabaseProvider';
import Header from './components/common/Header';

// Create a client
const queryClient = new QueryClient();

// Layout component
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return null; // or a loading spinner
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SupabaseProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route
                  path="/"
                  element={
                    session ? <Navigate to="/dashboard" /> : <LandingPage />
                  }
                />
                <Route
                  path="/signin"
                  element={
                    session ? <Navigate to="/dashboard" /> : <SignInPage />
                  }
                />
                <Route
                  path="/signup"
                  element={
                    session ? <Navigate to="/dashboard" /> : <SignUpPage />
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    !session ? <Navigate to="/signin" /> : <Dashboard />
                  }
                />
                <Route
                  path="/manage-goodreads"
                  element={
                    !session ? <Navigate to="/signin" /> : <ManageGoodreads />
                  }
                />
              </Routes>
            </Layout>
          </BrowserRouter>
        </QueryClientProvider>
      </SupabaseProvider>
    </ThemeProvider>
  );
}

export default App;
