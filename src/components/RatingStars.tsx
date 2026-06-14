import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  rating: number;
  ratingCount?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRate?: (rating: number) => void;
  showCount?: boolean;
  className?: string;
}

export default function RatingStars({
  rating,
  ratingCount,
  size = 'md',
  interactive = false,
  onRate,
  showCount = true,
  className,
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const displayRating = hoverRating ?? rating;

  const handleClick = (value: number) => {
    if (interactive && onRate) {
      onRate(value);
    }
  };

  const renderStar = (index: number) => {
    const starValue = index + 1;
    const isFull = displayRating >= starValue;
    const isHalf = !isFull && displayRating >= starValue - 0.5;

    return (
      <button
        key={index}
        type="button"
        onClick={() => handleClick(starValue)}
        onMouseEnter={() => interactive && setHoverRating(starValue)}
        onMouseLeave={() => interactive && setHoverRating(null)}
        className={cn(
          'relative transition-transform',
          interactive && 'cursor-pointer hover:scale-110',
          !interactive && 'cursor-default'
        )}
        disabled={!interactive}
      >
        <Star
          className={cn(
            sizeClasses[size],
            isFull
              ? 'text-amber-500 fill-amber-500'
              : isHalf
              ? 'text-ink-200'
              : 'text-ink-200'
          )}
        />
        {isHalf && (
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <Star
              className={cn(sizeClasses[size], 'text-amber-500 fill-amber-500')}
            />
          </div>
        )}
      </button>
    );
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center">
        {[0, 1, 2, 3, 4].map(renderStar)}
      </div>
      {showCount && (
        <span className="text-ink-500 text-sm ml-1">
          {rating.toFixed(1)}
          {ratingCount !== undefined && ` (${ratingCount})`}
        </span>
      )}
    </div>
  );
}
