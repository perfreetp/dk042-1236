import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Loader2, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void> | void;
  isAuthenticated?: boolean;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

export default function CommentForm({
  onSubmit,
  isAuthenticated = false,
  placeholder = '写下你的评论...',
  maxLength = 500,
  className,
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isLoading || !isAuthenticated) return;

    setIsLoading(true);
    try {
      await onSubmit(content.trim());
      setContent('');
    } finally {
      setIsLoading(false);
    }
  };

  const charCount = content.length;
  const isNearLimit = charCount > maxLength * 0.9;
  const isOverLimit = charCount > maxLength;

  if (!isAuthenticated) {
    return (
      <div
        className={cn(
          'flex items-center justify-between p-4 bg-cream-100 border border-ink-200 rounded-xl',
          className
        )}
      >
        <p className="text-ink-600 flex items-center gap-2">
          <LogIn className="w-4 h-4" />
          登录后可评论
        </p>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 text-ink-700 hover:text-ink-900 transition-colors font-medium"
          >
            登录
          </Link>
          <Link
            to="/register"
            className="px-5 py-2 bg-amber-500 text-cream-50 rounded-lg font-medium hover:bg-amber-600 transition-colors shadow-button hover:shadow-button-hover"
          >
            注册
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'bg-cream-50 border rounded-xl overflow-hidden transition-all duration-200',
        isFocused ? 'border-amber-300 shadow-card' : 'border-ink-200',
        className
      )}
    >
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        rows={4}
        className={cn(
          'w-full px-4 py-3 bg-transparent resize-none focus:outline-none text-ink-900 placeholder-ink-400',
          isOverLimit && 'text-vermilion-500'
        )}
        disabled={isLoading}
      />

      <div className="flex items-center justify-between px-4 py-3 border-t border-ink-100 bg-cream-100/50">
        <span
          className={cn(
            'text-sm',
            isOverLimit ? 'text-vermilion-500' : isNearLimit ? 'text-amber-600' : 'text-ink-400'
          )}
        >
          {charCount}/{maxLength}
        </span>

        <button
          type="submit"
          disabled={!content.trim() || isLoading || isOverLimit}
          className={cn(
            'flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-all',
            !content.trim() || isLoading || isOverLimit
              ? 'bg-ink-200 text-ink-400 cursor-not-allowed'
              : 'bg-amber-500 text-cream-50 hover:bg-amber-600 shadow-button hover:shadow-button-hover'
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              发送中...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              发表评论
            </>
          )}
        </button>
      </div>
    </form>
  );
}
