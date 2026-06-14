import { Search, Heart, FileText, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

type EmptyStateVariant = 'no-results' | 'no-favorites' | 'no-prompts';

interface EmptyStateProps {
  variant: EmptyStateVariant;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

const variantConfig: Record<EmptyStateVariant, {
  icon: typeof Search;
  title: string;
  description: string;
  defaultAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}> = {
  'no-results': {
    icon: Search,
    title: '没有找到相关结果',
    description: '尝试使用其他关键词搜索，或调整筛选条件',
    defaultAction: {
      label: '清除筛选',
      href: '/',
    },
  },
  'no-favorites': {
    icon: Heart,
    title: '还没有收藏的提示词',
    description: '浏览发现更多优质提示词，收藏你喜欢的内容',
    defaultAction: {
      label: '去浏览',
      href: '/categories',
    },
  },
  'no-prompts': {
    icon: FileText,
    title: '还没有发布的提示词',
    description: '分享你的第一个提示词，帮助更多人',
    defaultAction: {
      label: '创建提示词',
      href: '/prompts/new',
    },
  },
};

export default function EmptyState({
  variant,
  action,
  className,
}: EmptyStateProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;
  const actionConfig = action || config.defaultAction;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in-up',
        className
      )}
    >
      <div className="w-20 h-20 bg-ink-100 rounded-full flex items-center justify-center mb-6">
        <Icon className="w-10 h-10 text-ink-400" />
      </div>

      <h3 className="text-xl font-semibold text-ink-900 mb-2 font-display">
        {config.title}
      </h3>
      <p className="text-ink-500 max-w-sm mb-8">{config.description}</p>

      {actionConfig &&
        (actionConfig.onClick ? (
          <button
            onClick={actionConfig.onClick}
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-cream-50 rounded-lg font-medium hover:bg-amber-600 transition-colors shadow-button hover:shadow-button-hover"
          >
            <Plus className="w-4 h-4" />
            {actionConfig.label}
          </button>
        ) : actionConfig.href ? (
          <Link
            to={actionConfig.href}
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-cream-50 rounded-lg font-medium hover:bg-amber-600 transition-colors shadow-button hover:shadow-button-hover"
          >
            <Plus className="w-4 h-4" />
            {actionConfig.label}
          </Link>
        ) : null)}
    </div>
  );
}
