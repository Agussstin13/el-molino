import { motion, AnimatePresence } from 'motion/react';
import { X, AlertCircle, CheckCircle2, Info, HelpCircle } from 'lucide-react';
import { createPortal } from 'react-dom';

export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

interface CustomAlertProps {
  isOpen: boolean;
  type: AlertType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  onClose: () => void;
}

export function CustomAlert({
  isOpen,
  type,
  title,
  message,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  onClose,
}: CustomAlertProps) {
  if (typeof document === 'undefined') return null;

  const icons = {
    success: <CheckCircle2 className="w-10 h-10 text-green-500" />,
    error: <AlertCircle className="w-10 h-10 text-destructive" />,
    warning: <AlertCircle className="w-10 h-10 text-amber-500" />,
    info: <Info className="w-10 h-10 text-primary" />,
    confirm: <HelpCircle className="w-10 h-10 text-primary" />,
  };

  const colors = {
    success: 'border-green-600/40',
    error: 'border-destructive/40',
    warning: 'border-amber-600/40',
    info: 'border-primary/40',
    confirm: 'border-primary/40',
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative w-full max-w-sm bg-background rounded-3xl shadow-2xl border-2 ${colors[type]} overflow-hidden`}
          >
            <div className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
                >
                  {icons[type]}
                </motion.div>
              </div>
              
              <h3 className="text-xl font-medium text-foreground mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                {title}
              </h3>
              
              <p className="text-sm text-muted-foreground leading-relaxed">
                {message}
              </p>
            </div>

            <div className="p-4 bg-secondary/10 flex gap-3">
              {(type === 'confirm' || onCancel) && (
                <button
                  onClick={() => {
                    onCancel?.();
                    onClose();
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-secondary transition-colors text-sm font-medium"
                >
                  {cancelText}
                </button>
              )}
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg transition-all active:scale-[0.98] ${
                  type === 'error' 
                    ? 'bg-destructive text-destructive-foreground shadow-destructive/20' 
                    : 'bg-primary text-primary-foreground shadow-primary/20'
                }`}
              >
                {confirmText}
              </button>
            </div>

            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
