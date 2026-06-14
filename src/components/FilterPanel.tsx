import { useState } from 'react';
import { Filter, X, ChevronDown, ChevronUp, RotateCcw, SortAsc } from 'lucide-react';
import { cn } from '@/lib/utils';
import TagBadge from './TagBadge';
import type { Tag } from '../../shared/types';

interface FilterPanelProps {
  tags: Tag[];
  selectedTags: number[];
  sortBy: string;
  onTagToggle: (tagId: number) => void;
  onSortChange: (sort: string) => void;
  onReset: () => void;
  className?: string;
}

const sortOptions = [
  { value: 'createdAt', label: '最新发布' },
  { value: 'rating', label: '评分最高' },
  { value: 'viewCount', label: '浏览最多' },
  { value: 'copyCount', label: '复制最多' },
  { value: 'favoriteCount', label: '收藏最多' },
];

const filterCategories = [
  { key: 'purpose', label: '用途' },
  { key: 'model', label: '模型' },
  { key: 'language', label: '语言' },
  { key: 'difficulty', label: '难度' },
] as const;

export default function FilterPanel({
  tags,
  selectedTags,
  sortBy,
  onTagToggle,
  onSortChange,
  onReset,
  className,
}: FilterPanelProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    purpose: true,
    model: true,
    language: true,
    difficulty: true,
  });

  const toggleSection = (category: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const getTagsByCategory = (category: Tag['category']) => {
    return tags.filter((tag) => tag.category === category);
  };

  const hasActiveFilters = selectedTags.length > 0 || sortBy !== 'createdAt';

  const FilterContent = () => (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <SortAsc className="w-4 h-4 text-ink-600" />
          <h3 className="font-semibold text-ink-900">排序</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onSortChange(option.value)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-lg border transition-colors',
                sortBy === option.value
                  ? 'bg-amber-500 text-cream-50 border-amber-500'
                  : 'bg-cream-50 text-ink-700 border-ink-200 hover:border-amber-300 hover:text-amber-600'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {filterCategories.map(({ key, label }) => {
        const categoryTags = getTagsByCategory(key);
        if (categoryTags.length === 0) return null;

        return (
          <div key={key}>
            <button
              onClick={() => toggleSection(key)}
              className="flex items-center justify-between w-full mb-3 group"
            >
              <h3 className="font-semibold text-ink-900 group-hover:text-amber-600 transition-colors">
                {label}
              </h3>
              {expandedSections[key] ? (
                <ChevronUp className="w-4 h-4 text-ink-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-ink-500" />
              )}
            </button>

            {expandedSections[key] && (
              <div className="flex flex-wrap gap-2">
                {categoryTags.map((tag) => (
                  <TagBadge
                    key={tag.id}
                    tag={tag}
                    size="sm"
                    selected={selectedTags.includes(tag.id)}
                    onClick={() => onTagToggle(tag.id)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {hasActiveFilters && (
        <button
          onClick={onReset}
          className="flex items-center gap-2 text-ink-600 hover:text-ink-900 transition-colors text-sm"
        >
          <RotateCcw className="w-4 h-4" />
          重置筛选条件
        </button>
      )}
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden flex items-center gap-2 px-4 py-2 bg-cream-50 border border-ink-200 rounded-lg text-ink-700 mb-4"
      >
        <Filter className="w-4 h-4" />
        筛选
        {selectedTags.length > 0 && (
          <span className="px-2 py-0.5 bg-amber-500 text-cream-50 text-xs rounded-full">
            {selectedTags.length}
          </span>
        )}
      </button>

      <div
        className={cn(
          'lg:block',
          isMobileOpen ? 'fixed inset-0 z-50 lg:relative' : 'hidden'
        )}
      >
        {isMobileOpen && (
          <div
            className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}

        <div
          className={cn(
            'bg-cream-50 p-6 rounded-xl border border-ink-100 shadow-card',
            isMobileOpen
              ? 'absolute bottom-0 left-0 right-0 rounded-t-2xl max-h-[80vh] overflow-y-auto animate-slide-up lg:relative lg:animate-none'
              : '',
            className
          )}
        >
          <div className="flex items-center justify-between mb-6 lg:hidden">
            <h2 className="text-lg font-semibold text-ink-900 flex items-center gap-2">
              <Filter className="w-5 h-5" />
              筛选条件
            </h2>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="p-2 text-ink-500 hover:text-ink-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <FilterContent />

          {isMobileOpen && (
            <button
              onClick={() => setIsMobileOpen(false)}
              className="w-full mt-6 py-3 bg-amber-500 text-cream-50 rounded-lg font-medium hover:bg-amber-600 transition-colors lg:hidden"
            >
              应用筛选
            </button>
          )}
        </div>
      </div>
    </>
  );
}
