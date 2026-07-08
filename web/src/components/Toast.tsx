import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastCtx {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastCtx>({ showToast: () => {} });
export const useToast = () => useContext(ToastContext);

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={20} style={{ color: 'var(--green)', flexShrink: 0 }} />,
  error: <XCircle size={20} style={{ color: 'var(--red)', flexShrink: 0 }} />,
  info: <Info size={20} style={{ color: 'var(--primary-blue)', flexShrink: 0 }} />,
};

const typeCls: Record<ToastType, string> = {
  success: 'toast-success',
  error: 'toast-error',
  info: 'toast-info',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container — bottom-center */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast ${typeCls[t.type]}`}
          >
            {icons[t.type]}
            <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--slate-800)' }}>{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="toast-close-btn"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
