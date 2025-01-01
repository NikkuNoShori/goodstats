import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './services/supabase';
import Dashboard from './components/Dashboard';
import SignInPage from './components/Auth/SignInPage';
import SignUpPage from './components/Auth/SignUpPage';
import LandingPage from './components/LandingPage';
import ManageGoodreads from './components/ManageGoodreads';
import { Session } from '@supabase/supabase-js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Create a client
const queryClient = new QueryClient();

function Root() {
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

  // Handle route protection
  const pathname = window.location.pathname;
  const element = pathname === "/" && session ? (
    <Navigate to="/dashboard" />
  ) : pathname === "/dashboard" && !session ? (
    <Navigate to="/signin" />
  ) : pathname.match(/^\/(signin|signup)/) && session ? (
    <Navigate to="/dashboard" />
  ) : pathname.match(/^\/manage-goodreads/) && !session ? (
    <Navigate to="/signin" />
  ) : null;

  return element || <Outlet />;
}

// Configure router
const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <QueryClientProvider client={queryClient}>
        <Root />
      </QueryClientProvider>
    ),
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: "signin",
        element: <SignInPage />,
      },
      {
        path: "signup",
        element: <SignUpPage />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "manage-goodreads",
        element: <ManageGoodreads />,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
