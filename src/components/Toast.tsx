import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-200 ${
              isError
                ? 'bg-rose-950/90 text-rose-100 border-rose-800/80 shadow-rose-950/40'
                : isSuccess
                ? 'bg-stone-900/95 text-stone-100 border-stone-800 shadow-stone-950/40'
                : 'bg-stone-900/95 text-stone-100 border-stone-800 shadow-stone-950/40'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {isError && <AlertCircle className="w-4 h-4 text-rose-400" />}
              {!isSuccess && !isError && <Info className="w-4 h-4 text-sky-400" />}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold tracking-tight">{toast.title}</p>
              {toast.message && (
                <p className="mt-1 text-xs text-stone-400 leading-relaxed break-words">{toast.message}</p>
              )}
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 text-stone-500 hover:text-stone-300 transition-colors p-0.5 rounded"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
