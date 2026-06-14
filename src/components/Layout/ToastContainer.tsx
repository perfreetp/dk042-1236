import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Toast } from '../../hooks/useToast';

interface ToastItemProps {
  toast: Toast;
  onClose: (id: string) => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const duration = toast.duration ?? 3000;
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose(toast.id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(toast.id), 300);
  };

  const variantConfig = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-moss-500',
      borderColor: 'border-moss-600',
      iconColor: 'text-cream-50',
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-vermilion-500',
      borderColor: 'border-vermilion-600',
      iconColor: 'text-cream-50',
    },
    info: {
      icon: Info,
      bgColor: 'bg-ink-700',
      borderColor: 'border-ink-800',
      iconColor: 'text-cream-50',
    },
  };

  const config = variantConfig[toast.variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-center gap-3 min-w-[300px] max-w-md p-4 rounded-xl shadow-card-hover border backdrop-blur-sm transition-all duration-300',
        config.bgColor,
        config.borderColor,
        isExiting
          ? 'opacity-0 translate-x-full'
          : 'opacity-100 translate-x-0 animate-slide-up'
      )}
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0', config.iconColor)} />
      <p className="flex-1 text-cream-50 text-sm font-medium">{toast.message}</p>
      <button
        onClick={handleClose}
        className="p-1 text-cream-50/70 hover:text-cream-50 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export default function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-3">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onRemove} />
      ))}
    </div>
  );
}
