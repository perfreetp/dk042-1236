import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Filter, SortAsc, Grid3X3, List, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePromptStore } from '@/store/promptStore';
import { useToast } from '@/hooks/useToast';
import FilterPanel from '@/components/FilterPanel';
import PromptCard, { PromptCardSkeleton } from '@/components/PromptCard';
import Pagination from '@/components/Pagination';
import EmptyState from '@/components/EmptyState';
import { SORT_OPTIONS } from '@/utils/constants';
import { formatNumber } from '@/utils/formatters';
import { apiClient } from '@/lib/apiClient';
import type { Tag, Prompt } from '../../shared/types';

type ViewMode = 'grid' | 'list';

export default function Category() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { prompts, loading, pagination, fetchPrompts, copyPrompt, setFilters } = usePromptStore();
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  const selectedTags = useMemo(() => {
    const tagParam = searchParams.get('tags');
    return tagParam ? tagParam.split(',').map(Number).filter(Boolean) : [];
  }, [searchParams]);

  const sortBy = searchParams.get('sort') || 'createdAt';
  const currentPage = Number(searchParams.get('page')) || 1;
  const purpose = searchParams.get('purpose') ? decodeURIComponent(searchParams.get('purpose')!) : undefined;
  const model = searchParams.get('model') || undefined;
  const language = searchParams.get('language') || undefined;
  const difficulty = searchParams.get('difficulty') || undefined;

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    const filters = {
      purpose,
      model,
      language,
      difficulty,
      sort: sortBy,
      page: currentPage,
      pageSize: 12,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      status: 'approved',
    };
    setFilters(filters);
    fetchPrompts(filters);
  }, [purpose, model, language, difficulty, sortBy, currentPage, selectedTags, fetchPrompts, setFilters]);

  const fetchTags = async () => {
    setTagsLoading(true);
    try {
      const response = await apiClient.get<Tag[]>('/tags');
      if (response.success && response.data) {
        setTags(response.data);
      }
    } catch (error) {
      toast.error('加载标签失败');
    } finally {
      setTagsLoading(false);
    }
  };

  const handleTagToggle = (tagId: number) => {
    const newSelectedTags = selectedTags.includes(tagId)
      ? selectedTags.filter((id) => id !== tagId)
      : [...selectedTags, tagId];

    const newParams = new URLSearchParams(searchParams);
    if (newSelectedTags.length > 0) {
      newParams.set('tags', newSelectedTags.join(','));
    } else {
      newParams.delete('tags');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleSortChange = (sort: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', sort);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleReset = () => {
    setSearchParams({});
  };

  const handlePageChange = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', page.toString());
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopy = async (promptId: number) => {
    const prompt = prompts.find((p) => p.id === promptId);
    if (prompt) {
      await navigator.clipboard.writeText(prompt.content);
      await copyPrompt(promptId);
      toast.success('复制成功');
    }
  };

  const handleFavorite = (_promptId: number) => {
  };

  const activeFilterCount =
    selectedTags.length +
    (purpose ? 1 : 0) +
    (model ? 1 : 0) +
    (language ? 1 : 0) +
    (difficulty ? 1 : 0);

  return (
    <div className="min-h-screen bg-cream-100 pt-8 pb-16">
      <div className="container">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-ink-900 mb-2">
            {purpose ? `浏览：${purpose} 提示词` : '浏览提示词'}
          </h1>
          <p className="text-ink-500 text-lg">
            {purpose ? `探索${purpose}领域的优质提示词` : '按分类和标签筛选，找到最适合你的提示词'}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="lg:sticky lg:top-24">
              {tagsLoading ? (
                <div className="bg-cream-50 rounded-xl border border-ink-100 p-6 animate-pulse">
                  <div className="h-6 w-24 bg-ink-100 rounded mb-4" />
                  <div className="space-y-3">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="h-8 bg-ink-100 rounded" />
                    ))}
                  </div>
                </div>
              ) : (
                <FilterPanel
                  tags={tags}
                  selectedTags={selectedTags}
                  sortBy={sortBy}
                  onTagToggle={handleTagToggle}
                  onSortChange={handleSortChange}
                  onReset={handleReset}
                />
              )}
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <span className="text-ink-600">
                  找到 <span className="font-semibold text-ink-900">{formatNumber(pagination.total)}</span> 个结果
                </span>
                {activeFilterCount > 0 && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-sm rounded-full">
                    {activeFilterCount} 个筛选
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-cream-50 border border-ink-200 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      'p-2 rounded-md transition-colors',
                      viewMode === 'grid'
                        ? 'bg-amber-500 text-cream-50'
                        : 'text-ink-500 hover:text-ink-700'
                    )}
                    title="网格视图"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      'p-2 rounded-md transition-colors',
                      viewMode === 'list'
                        ? 'bg-amber-500 text-cream-50'
                        : 'text-ink-500 hover:text-ink-700'
                    )}
                    title="列表视图"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="px-4 py-2 bg-cream-50 border border-ink-200 rounded-lg text-ink-700 focus:outline-none focus:border-amber-500 transition-colors"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div
                className={cn(
                  'gap-6',
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                    : 'space-y-4'
                )}
              >
                {[...Array(6)].map((_, i) => (
                  <PromptCardSkeleton key={i} />
                ))}
              </div>
            ) : prompts.length > 0 ? (
              <>
                <div
                  className={cn(
                    'gap-6 animate-stagger',
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                      : 'space-y-4'
                  )}
                >
                  {prompts.map((prompt) => (
                    <PromptCard
                      key={prompt.id}
                      prompt={prompt}
                      onCopy={handleCopy}
                      onFavorite={handleFavorite}
                      className={viewMode === 'list' ? 'w-full' : ''}
                    />
                  ))}
                </div>

                {pagination.totalPages > 1 && (
                  <div className="mt-12">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={pagination.totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                variant="no-results"
                action={{
                  label: '清除筛选',
                  onClick: handleReset,
                }}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
