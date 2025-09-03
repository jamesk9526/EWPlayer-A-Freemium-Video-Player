import React from 'react';

export type ToastKind = 'success' | 'error' | 'info' | 'warning';

type Toast = { id: number; message: string; kind: ToastKind };

type ToastCtx = {
  toasts: Toast[];
  show: (message: string, kind?: ToastKind) => void;
  remove: (id: number) => void;
};

const Ctx = React.createContext<ToastCtx | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const idRef = React.useRef(1);

  const remove = React.useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const show = React.useCallback((message: string, kind: ToastKind = 'info') => {
    const id = idRef.current++;
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => remove(id), 3500);
  }, [remove]);

  return (
    <Ctx.Provider value={{ toasts, show, remove }}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`}>
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
};

export const useToast = () => {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
