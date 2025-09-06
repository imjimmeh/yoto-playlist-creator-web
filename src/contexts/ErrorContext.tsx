import React, { createContext, useContext } from 'react';
import { toast } from 'react-hot-toast';
import type { ToastOptions } from 'react-hot-toast';

interface ErrorContextType {
  showError: (message: string, options?: ToastOptions) => void;
  showSuccess: (message: string, options?: ToastOptions) => void;
  showWarning: (message: string, options?: ToastOptions) => void;
  showInfo: (message: string, options?: ToastOptions) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const ErrorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const showError = (message: string, options?: ToastOptions) => {
    toast.error(message, {
      duration: 4000,
      position: 'top-right',
      ...options,
    });
  };

  const showSuccess = (message: string, options?: ToastOptions) => {
    toast.success(message, {
      duration: 3000,
      position: 'top-right',
      ...options,
    });
  };

  const showWarning = (message: string, options?: ToastOptions) => {
    toast(message, {
      duration: 4000,
      position: 'top-right',
      icon: '⚠️',
      ...options,
    });
  };

  const showInfo = (message: string, options?: ToastOptions) => {
    toast(message, {
      duration: 3000,
      position: 'top-right',
      icon: 'ℹ️',
      ...options,
    });
  };

  return (
    <ErrorContext.Provider value={{ showError, showSuccess, showWarning, showInfo }}>
      {children}
    </ErrorContext.Provider>
  );
};

export const useError = (): ErrorContextType => {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};