import React, { useEffect } from 'react';
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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (!isAuthenticated) {
    // Show custom fallback or return null while redirecting
    if (fallback) {
      return <>{fallback}</>;
    }

    // Return null while redirect is happening
    return null;
  }

  // User is authenticated, render protected content
  return <>{children}</>;
};

export default ProtectedRoute;