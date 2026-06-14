import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Copy, TrendingUp, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import TagBadge from './TagBadge';
import RatingStars from './RatingStars';
import type { Prompt } from '../../shared/types';

interface PromptCardProps {
  prompt: Prompt;
  isFavorited?: boolean;
  onFavorite?: (promptId: number) => void;
  onCopy?: (promptId: number) => void;
  className?: string;
}

const difficultyConfig = {
  beginner: { label: '入门', color: 'bg-moss-500/10 text-moss-600 border-moss-500/20' },
  intermediate: { label: '进阶', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  advanced: { label: '高级', color: 'bg-vermilion-500/10 text-vermilion-500 border-vermilion-500/20' },
};

export default function PromptCard({
  prompt,
  isFavorited = false,
  onFavorite,
  onCopy,
  className,
}: PromptCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAnimating(true);
    onFavorite?.(prompt.id);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const handleCopyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onCopy?.(prompt.id);
  };

  const difficulty = difficultyConfig[prompt.difficulty];
  const displayTags = prompt.tags?.slice(0, 3) ?? [];

  return (
    <Link
      to={`/prompt/${prompt.id}`}
      className={cn(
        'group relative bg-cream-50 rounded-xl border border-ink-100 shadow-card overflow-hidden transition-all duration-300 hover:shadow-card-hover',
        isHovered && 'translate-y-[-2px] rotate-[0.5deg]',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {prompt.isFeatured && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2 py-1 bg-amber-500 text-cream-50 text-xs font-medium rounded-md">
          <Sparkles className="w-3 h-3" />
          精选
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-lg font-semibold text-ink-900 line-clamp-1 group-hover:text-amber-600 transition-colors">
            {prompt.title}
          </h3>
          <span
            className={cn(
              'flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-md border',
              difficulty.color
            )}
          >
            {difficulty.label}
          </span>
        </div>

        <p className="text-ink-600 text-sm line-clamp-2 mb-4 min-h-[40px]">
          {prompt.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-4 min-h-[28px]">
          {displayTags.map((tag) => (
            <TagBadge key={tag.id} tag={tag} size="sm" />
          ))}
          {prompt.tags && prompt.tags.length > 3 && (
            <span className="px-2 py-0.5 text-xs text-ink-500 bg-ink-100 rounded-md">
              +{prompt.tags.length - 3}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 mb-4">
          <RatingStars
            rating={prompt.rating}
            ratingCount={prompt.ratingCount}
            size="sm"
            showCount={true}
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-ink-100">
          <div className="flex items-center gap-3">
            <img
              src={prompt.author?.avatar}
              alt={prompt.author?.username}
              className="w-8 h-8 rounded-full object-cover border border-ink-200"
            />
            <span className="text-sm text-ink-600 font-medium">
              {prompt.author?.username}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyClick}
              className="flex items-center gap-1 text-ink-500 hover:text-ink-700 transition-colors"
              title="复制"
            >
              <Copy className="w-4 h-4" />
              <span className="text-xs">{prompt.copyCount}</span>
            </button>

            <button
              onClick={handleFavoriteClick}
              className={cn(
                'flex items-center gap-1 transition-colors',
                isFavorited
                  ? 'text-vermilion-500'
                  : 'text-ink-500 hover:text-vermilion-500',
                isAnimating && 'animate-bounce-subtle'
              )}
              title="收藏"
            >
              <Heart
                className={cn('w-4 h-4', isFavorited && 'fill-vermilion-500')}
              />
              <span className="text-xs">
                {prompt.favoriteCount + (isFavorited ? 1 : 0)}
              </span>
            </button>

            <div className="flex items-center gap-1 text-ink-500">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs">{prompt.viewCount}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

interface PromptCardSkeletonProps {
  className?: string;
}

export function PromptCardSkeleton({ className }: PromptCardSkeletonProps) {
  return (
    <div
      className={cn(
        'bg-cream-50 rounded-xl border border-ink-100 shadow-card overflow-hidden',
        className
      )}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="h-6 w-3/4 bg-ink-100 rounded animate-pulse" />
          <div className="h-5 w-12 bg-ink-100 rounded animate-pulse" />
        </div>

        <div className="space-y-2 mb-4">
          <div className="h-4 w-full bg-ink-100 rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-ink-100 rounded animate-pulse" />
        </div>

        <div className="flex gap-2 mb-4">
          <div className="h-6 w-16 bg-ink-100 rounded animate-pulse" />
          <div className="h-6 w-16 bg-ink-100 rounded animate-pulse" />
          <div className="h-6 w-16 bg-ink-100 rounded animate-pulse" />
        </div>

        <div className="h-5 w-32 bg-ink-100 rounded animate-pulse mb-4" />

        <div className="flex items-center justify-between pt-4 border-t border-ink-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-ink-100 rounded-full animate-pulse" />
            <div className="h-4 w-20 bg-ink-100 rounded animate-pulse" />
          </div>

          <div className="flex items-center gap-3">
            <div className="h-4 w-12 bg-ink-100 rounded animate-pulse" />
            <div className="h-4 w-12 bg-ink-100 rounded animate-pulse" />
            <div className="h-4 w-12 bg-ink-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
