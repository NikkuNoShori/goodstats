import { Routes, Route, Navigate } from 'react-router-dom';
import { useProfile } from './hooks/useProfile';
import LandingPage from './components/LandingPage';
import SignInPage from './components/Auth/SignInPage';
import SignUpPage from './components/Auth/SignUpPage';
import Dashboard from './components/Dashboard';
import ManageGoodreads from './components/ManageGoodreads';

const AppRoutes = () => {
  const { profile, isLoading } = useProfile();
  const isAuthenticated = !!profile?.id;

  if (isLoading) {
    return null; // or a loading spinner
  }

  return (
    <Routes>
      <Route
        path="/"
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <LandingPage />}
      />
      <Route
        path="/signin"
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <SignInPage />}
      />
      <Route
        path="/signup"
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <SignUpPage />}
      />
      <Route
        path="/dashboard"
        element={!isAuthenticated ? <Navigate to="/signin" /> : <Dashboard />}
      />
      <Route
        path="/manage-goodreads"
        element={!isAuthenticated ? <Navigate to="/signin" /> : <ManageGoodreads />}
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRoutes; 