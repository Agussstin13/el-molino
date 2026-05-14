import React, { createContext, useContext, useState, useCallback } from 'react';
import { CustomAlert, AlertType } from '../components/CustomAlert';

interface AlertOptions {
  type: AlertType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  showSuccess: (title: string, message: string) => void;
  showError: (title: string, message: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alert, setAlert] = useState<AlertOptions | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const showAlert = useCallback((options: AlertOptions) => {
    setAlert(options);
    setIsOpen(true);
  }, []);

  const showSuccess = useCallback((title: string, message: string) => {
    showAlert({ type: 'success', title, message });
  }, [showAlert]);

  const showError = useCallback((title: string, message: string) => {
    showAlert({ type: 'error', title, message });
  }, [showAlert]);

  const showConfirm = useCallback((title: string, message: string, onConfirm: () => void) => {
    showAlert({ type: 'confirm', title, message, onConfirm, confirmText: 'Confirmar' });
  }, [showAlert]);

  const handleClose = () => {
    setIsOpen(false);
    // We don't null the alert immediately to allow exit animation
  };

  return (
    <AlertContext.Provider value={{ showAlert, showSuccess, showError, showConfirm }}>
      {children}
      {alert && (
        <CustomAlert
          isOpen={isOpen}
          type={alert.type}
          title={alert.title}
          message={alert.message}
          confirmText={alert.confirmText}
          cancelText={alert.cancelText}
          onConfirm={() => {
            alert.onConfirm?.();
            handleClose();
          }}
          onCancel={() => {
            alert.onCancel?.();
            handleClose();
          }}
          onClose={handleClose}
        />
      )}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}
