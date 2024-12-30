import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import SignInPage from './components/SignInPage';
import Dashboard from './components/Dashboard';
import SettingsPage from './components/Settings/SettingsPage';
import { userService } from './services/userService';
import ErrorBoundary from './components/common/ErrorBoundary';
import AuthCallback from './components/Auth/AuthCallback';

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = userService.isAuthenticated();
  return isAuthenticated ? <>{children}</> : <Navigate to="/signin" />;
};

const App: React.FC = () => {
  return (
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
  );
};

export default App; 