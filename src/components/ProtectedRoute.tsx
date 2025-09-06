import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback 
}) => {
  const navigate = useNavigate();
  const { authState, isLoading, isTokenExpired } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="protected-route-loading">
        <div className="loading-container">
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated and token is not expired
  const isAuthenticated = authState.isAuthenticated && !isTokenExpired();

  if (!isAuthenticated) {
    // Show custom fallback or redirect to login
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="protected-route-unauthorized">
        <div className="unauthorized-container">
          <h2>Authentication Required</h2>
          <p>You need to be logged in to access this page.</p>
          <div className="unauthorized-actions">
            <button 
              type="button"
              onClick={() => navigate('/login')}
              className="btn btn-primary"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated, render protected content
  return <>{children}</>;
};

export default ProtectedRoute;