import { cn } from '@/lib/utils';
import type { Tag } from '../../shared/types';

interface TagBadgeProps {
  tag: Tag;
  size?: 'sm' | 'md';
  onClick?: (tag: Tag) => void;
  selected?: boolean;
  className?: string;
}

const categoryColors: Record<Tag['category'], string> = {
  purpose: 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200',
  model: 'bg-ink-100 text-ink-800 border-ink-200 hover:bg-ink-200',
  language: 'bg-cream-200 text-ink-800 border-cream-300 hover:bg-cream-300',
  difficulty: 'bg-moss-500/10 text-moss-600 border-moss-500/20 hover:bg-moss-500/20',
};

const categoryColorsSelected: Record<Tag['category'], string> = {
  purpose: 'bg-amber-500 text-cream-50 border-amber-500',
  model: 'bg-ink-700 text-cream-50 border-ink-700',
  language: 'bg-ink-800 text-cream-50 border-ink-800',
  difficulty: 'bg-moss-500 text-cream-50 border-moss-500',
};

export default function TagBadge({
  tag,
  size = 'md',
  onClick,
  selected = false,
  className,
}: TagBadgeProps) {
  const isInteractive = !!onClick;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  const colorClass = selected
    ? categoryColorsSelected[tag.category]
    : categoryColors[tag.category];

  const Component = isInteractive ? 'button' : 'span';

  return (
    <Component
      type={isInteractive ? 'button' : undefined}
      onClick={isInteractive ? () => onClick?.(tag) : undefined}
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-md border transition-colors',
        sizeClasses[size],
        colorClass,
        isInteractive && 'cursor-pointer',
        className
      )}
    >
      <span>{tag.name}</span>
      {tag.promptCount !== undefined && size !== 'sm' && (
        <span className="opacity-60">({tag.promptCount})</span>
      )}
    </Component>
  );
}
