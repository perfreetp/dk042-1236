import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageSquare, Flag, ChevronDown, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Comment } from '../../shared/types';

interface CommentItemProps {
  comment: Comment;
  replies?: Comment[];
  onLike?: (commentId: number) => void;
  onReply?: (commentId: number) => void;
  onReport?: (commentId: number) => void;
  isAuthenticated?: boolean;
  className?: string;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins} 分钟前`;
  if (diffHours < 24) return `${diffHours} 小时前`;
  if (diffDays < 7) return `${diffDays} 天前`;
  return date.toLocaleDateString('zh-CN');
}

export default function CommentItem({
  comment,
  replies = [],
  onLike,
  onReply,
  onReport,
  isAuthenticated = false,
  className,
}: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [isLiked, setIsLiked] = useState(comment.isLiked);
  const [likeCount, setLikeCount] = useState(comment.likeCount);

  const handleLike = () => {
    if (!isAuthenticated) return;
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
    onLike?.(comment.id);
  };

  const handleReply = () => {
    onReply?.(comment.id);
  };

  const handleReport = () => {
    onReport?.(comment.id);
    setShowMenu(false);
  };

  return (
    <div className={cn('animate-fade-in-up', className)}>
      <div className="flex gap-4">
        <Link to={`/users/${comment.userId}`}>
          <img
            src={comment.user?.avatar}
            alt={comment.user?.username}
            className="w-10 h-10 rounded-full object-cover border border-ink-200 flex-shrink-0"
          />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to={`/users/${comment.userId}`}
                className="font-semibold text-ink-900 hover:text-amber-600 transition-colors"
              >
                {comment.user?.username}
              </Link>
              <span className="text-ink-400 text-sm">
                {formatDate(comment.createdAt)}
              </span>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-ink-400 hover:text-ink-600 transition-colors rounded-md"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-1 w-32 bg-cream-50 rounded-lg shadow-card-hover border border-ink-100 py-1 z-10 animate-scale-in">
                  <button
                    onClick={handleReport}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-ink-700 hover:bg-ink-100 transition-colors"
                  >
                    <Flag className="w-4 h-4" />
                    举报
                  </button>
                </div>
              )}
            </div>
          </div>

          <p className="text-ink-700 mt-1 leading-relaxed whitespace-pre-wrap">
            {comment.content}
          </p>

          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={handleLike}
              className={cn(
                'flex items-center gap-1 text-sm transition-colors',
                isAuthenticated
                  ? isLiked
                    ? 'text-vermilion-500'
                    : 'text-ink-500 hover:text-vermilion-500'
                  : 'text-ink-400 cursor-not-allowed'
              )}
              disabled={!isAuthenticated}
            >
              <Heart
                className={cn('w-4 h-4', isLiked && 'fill-vermilion-500')}
              />
              <span>{likeCount}</span>
            </button>

            <button
              onClick={handleReply}
              className={cn(
                'flex items-center gap-1 text-sm transition-colors',
                isAuthenticated
                  ? 'text-ink-500 hover:text-amber-600'
                  : 'text-ink-400 cursor-not-allowed'
              )}
              disabled={!isAuthenticated}
            >
              <MessageSquare className="w-4 h-4" />
              <span>回复</span>
            </button>

            {replies.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center gap-1 text-sm text-ink-500 hover:text-amber-600 transition-colors"
              >
                <ChevronDown
                  className={cn(
                    'w-4 h-4 transition-transform',
                    !showReplies && '-rotate-90'
                  )}
                />
                <span>{replies.length} 条回复</span>
              </button>
            )}
          </div>

          {replies.length > 0 && showReplies && (
            <div className="mt-4 ml-4 pl-4 border-l-2 border-ink-100 space-y-4">
              {replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onLike={onLike}
                  onReply={onReply}
                  onReport={onReport}
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface CommentSkeletonProps {
  hasReplies?: boolean;
}

export function CommentSkeleton({ hasReplies = false }: CommentSkeletonProps) {
  return (
    <div className="animate-pulse">
      <div className="flex gap-4">
        <div className="w-10 h-10 bg-ink-100 rounded-full flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-4 w-24 bg-ink-100 rounded" />
            <div className="h-3 w-16 bg-ink-100 rounded" />
          </div>
          <div className="space-y-2 mb-3">
            <div className="h-4 w-full bg-ink-100 rounded" />
            <div className="h-4 w-5/6 bg-ink-100 rounded" />
          </div>
          <div className="flex gap-4">
            <div className="h-4 w-12 bg-ink-100 rounded" />
            <div className="h-4 w-12 bg-ink-100 rounded" />
          </div>

          {hasReplies && (
            <div className="mt-4 ml-4 pl-4 border-l-2 border-ink-100">
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-ink-100 rounded-full flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-4 w-20 bg-ink-100 rounded mb-2" />
                  <div className="h-4 w-full bg-ink-100 rounded" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
