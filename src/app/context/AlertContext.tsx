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
  acceptOnEnter?: boolean;
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  showSuccess: (title: string, message: string) => void;
  showError: (title: string, message: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
  setAcceptOnEnter: (enabled: boolean) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alert, setAlert] = useState<AlertOptions | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [acceptOnEnter, setAcceptOnEnter] = useState(false);

  const showAlert = useCallback((options: AlertOptions) => {
    setAlert({ ...options, acceptOnEnter: options.acceptOnEnter ?? acceptOnEnter });
    setIsOpen(true);
  }, [acceptOnEnter]);

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
    <AlertContext.Provider value={{ showAlert, showSuccess, showError, showConfirm, setAcceptOnEnter }}>
      {children}
      {alert && (
        <CustomAlert
          isOpen={isOpen}
          type={alert.type}
          title={alert.title}
          message={alert.message}
          confirmText={alert.confirmText}
          cancelText={alert.cancelText}
          acceptOnEnter={alert.acceptOnEnter}
          onConfirm={() => {
            alert.onConfirm?.();
            handleClose();
          }}
          onCancel={alert.type === 'confirm' ? () => {
            alert.onCancel?.();
            handleClose();
          } : undefined}
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