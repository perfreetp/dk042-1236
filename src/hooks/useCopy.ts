import { useState, useCallback } from 'react';
import { useToast } from './useToast';

interface UseCopyOptions {
  successMessage?: string;
  errorMessage?: string;
  showToast?: boolean;
}

interface UseCopyReturn {
  isCopied: boolean;
  isError: boolean;
  copy: (text: string) => Promise<boolean>;
  reset: () => void;
}

export const useCopy = (options: UseCopyOptions = {}): UseCopyReturn => {
  const [isCopied, setIsCopied] = useState(false);
  const [isError, setIsError] = useState(false);
  const { toast } = useToast();

  const {
    successMessage = '复制成功',
    errorMessage = '复制失败，请手动复制',
    showToast = true,
  } = options;

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      try {
        setIsCopied(false);
        setIsError(false);

        if (!navigator.clipboard) {
          throw new Error('Clipboard API is not available');
        }

        await navigator.clipboard.writeText(text);
        setIsCopied(true);

        if (showToast) {
          toast.success(successMessage);
        }

        setTimeout(() => {
          setIsCopied(false);
        }, 2000);

        return true;
      } catch (err) {
        setIsError(true);
        setIsCopied(false);

        if (showToast) {
          toast.error(errorMessage);
        }

        return false;
      }
    },
    [toast, successMessage, errorMessage, showToast]
  );

  const reset = useCallback(() => {
    setIsCopied(false);
    setIsError(false);
  }, []);

  return {
    isCopied,
    isError,
    copy,
    reset,
  };
};

export default useCopy;
