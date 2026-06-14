import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, X, Clock, TrendingUp, Filter, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePromptStore } from '@/store/promptStore';
import { useToast } from '@/hooks/useToast';
import FilterPanel from '@/components/FilterPanel';
import PromptCard, { PromptCardSkeleton } from '@/components/PromptCard';
import Pagination from '@/components/Pagination';
import EmptyState from '@/components/EmptyState';
import TagBadge from '@/components/TagBadge';
import { formatNumber } from '@/utils/formatters';
import { apiClient } from '@/lib/apiClient';
import type { Tag, Prompt } from '../../shared/types';

const searchHistoryKey = 'search-history';
const maxHistoryItems = 10;

const hotSearches = [
  '产品营销文案',
  'Python代码优化',
  '英语翻译',
  '简历修改',
  '学术论文润色',
  '数据分析报告',
];

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { prompts, loading, pagination, fetchPrompts, copyPrompt, setFilters } = usePromptStore();
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [searchTime, setSearchTime] = useState<number | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const query = searchParams.get('q') || '';

  const selectedTags = useMemo(() => {
    const tagParam = searchParams.get('tags');
    return tagParam ? tagParam.split(',').map(Number).filter(Boolean) : [];
  }, [searchParams]);

  const sortBy = searchParams.get('sort') || 'createdAt';
  const currentPage = Number(searchParams.get('page')) || 1;
  const purpose = searchParams.get('purpose') || undefined;
  const model = searchParams.get('model') || undefined;
  const language = searchParams.get('language') || undefined;
  const difficulty = searchParams.get('difficulty') || undefined;

  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const allSuggestions = [...hotSearches, ...searchHistory];
    return allSuggestions
      .filter((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 6);
  }, [searchQuery, searchHistory]);

  useEffect(() => {
    const saved = localStorage.getItem(searchHistoryKey);
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch {
        setSearchHistory([]);
      }
    }
    fetchTags();
  }, []);

  useEffect(() => {
    setSearchQuery(query);
  }, [query]);

  useEffect(() => {
    if (query.trim()) {
      performSearch();
    }
  }, [query, selectedTags, sortBy, currentPage, purpose, model, language, difficulty]);

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

  const performSearch = async () => {
    const startTime = performance.now();
    const filters = {
      q: query,
      sort: sortBy,
      page: currentPage,
      pageSize: 12,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      purpose,
      model,
      language,
      difficulty,
      status: 'approved',
    };
    setFilters(filters);
    await fetchPrompts(filters);
    const endTime = performance.now();
    setSearchTime(endTime - startTime);
  };

  const addToHistory = (term: string) => {
    const newHistory = [term, ...searchHistory.filter((h) => h !== term)].slice(0, maxHistoryItems);
    setSearchHistory(newHistory);
    localStorage.setItem(searchHistoryKey, JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem(searchHistoryKey);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      addToHistory(searchQuery.trim());
      const newParams = new URLSearchParams(searchParams);
      newParams.set('q', searchQuery.trim());
      newParams.set('page', '1');
      setSearchParams(newParams);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    addToHistory(suggestion);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('q', suggestion);
    newParams.set('page', '1');
    setSearchParams(newParams);
    setShowSuggestions(false);
  };

  const handleClearQuery = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
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
    navigate('/search');
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

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-amber-200 text-ink-900 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
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
        <div className="max-w-4xl mx-auto mb-8 animate-fade-in-up">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-ink-900 mb-6 text-center">
            搜索提示词
          </h1>

          <div className="relative">
            <form onSubmit={handleSearch} className="relative">
              <div className="relative flex items-center">
                <SearchIcon className="absolute left-5 w-5 h-5 text-ink-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="输入关键词搜索提示词..."
                  className="w-full pl-14 pr-24 py-4 bg-cream-50 border-2 border-ink-200 rounded-xl text-lg text-ink-900 placeholder-ink-400 focus:border-amber-500 focus:outline-none transition-colors shadow-card hover:shadow-card-hover"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearQuery}
                    className="absolute right-20 p-1.5 text-ink-400 hover:text-ink-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
                <button
                  type="submit"
                  className="absolute right-2 px-6 py-2.5 bg-amber-500 text-cream-50 rounded-lg font-medium hover:bg-amber-600 transition-colors shadow-button hover:shadow-button-hover"
                >
                  搜索
                </button>
              </div>

              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-cream-50 border border-ink-100 rounded-xl shadow-card-hover overflow-hidden z-20 animate-scale-in">
                  {searchQuery.trim() && suggestions.length > 0 ? (
                    <div className="p-2">
                      <p className="px-3 py-2 text-xs font-medium text-ink-500 uppercase">
                        搜索建议
                      </p>
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full px-3 py-2 text-left text-ink-700 hover:bg-ink-100 transition-colors flex items-center gap-3 rounded-lg"
                        >
                          <SearchIcon className="w-4 h-4 text-ink-400" />
                          <span>{highlightText(suggestion, searchQuery)}</span>
                        </button>
                      ))}
                    </div>
                  ) : !searchQuery.trim() ? (
                    <div className="p-4">
                      {searchHistory.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between px-2 mb-2">
                            <p className="text-xs font-medium text-ink-500 uppercase flex items-center gap-2">
                              <Clock className="w-3 h-3" />
                              搜索历史
                            </p>
                            <button
                              type="button"
                              onClick={clearHistory}
                              className="text-xs text-ink-400 hover:text-ink-600 transition-colors"
                            >
                              清除
                            </button>
                          </div>
                          <div className="space-y-1">
                            {searchHistory.map((item, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => handleSuggestionClick(item)}
                                className="w-full px-3 py-2 text-left text-ink-700 hover:bg-ink-100 transition-colors flex items-center gap-3 rounded-lg"
                              >
                                <Clock className="w-4 h-4 text-ink-400" />
                                <span>{item}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="px-2 mb-2 text-xs font-medium text-ink-500 uppercase flex items-center gap-2">
                          <TrendingUp className="w-3 h-3" />
                          热门搜索
                        </p>
                        <div className="space-y-1">
                          {hotSearches.map((item, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => handleSuggestionClick(item)}
                              className="w-full px-3 py-2 text-left text-ink-700 hover:bg-ink-100 transition-colors flex items-center gap-3 rounded-lg"
                            >
                              <span className="w-5 h-5 rounded bg-amber-100 text-amber-600 text-xs font-medium flex items-center justify-center">
                                {index + 1}
                              </span>
                              <span>{item}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </form>
          </div>
        </div>

        {query.trim() ? (
          <>
            <div className="flex flex-col lg:flex-row gap-8">
              <aside className="w-full lg:w-72 flex-shrink-0">
                <div className="lg:sticky lg:top-24">
                  <button
                    onClick={() => setShowFilter(!showFilter)}
                    className="lg:hidden flex items-center gap-2 w-full px-4 py-3 bg-cream-50 border border-ink-200 rounded-lg text-ink-700 mb-4"
                  >
                    <Filter className="w-4 h-4" />
                    筛选条件
                    {activeFilterCount > 0 && (
                      <span className="px-2 py-0.5 bg-amber-500 text-cream-50 text-xs rounded-full">
                        {activeFilterCount}
                      </span>
                    )}
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 ml-auto transition-transform',
                        showFilter && 'rotate-180'
                      )}
                    />
                  </button>

                  <div className={cn('lg:block', showFilter ? 'block' : 'hidden lg:block')}>
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
                </div>
              </aside>

              <main className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="text-ink-600">
                      找到 <span className="font-semibold text-ink-900">{formatNumber(pagination.total)}</span> 个结果
                      {searchTime !== null && (
                        <span className="text-ink-400 text-sm ml-1">
                          ({(searchTime / 1000).toFixed(2)} 秒)
                        </span>
                      )}
                    </span>
                    {activeFilterCount > 0 && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-sm rounded-full">
                        {activeFilterCount} 个筛选
                      </span>
                    )}
                    {selectedTags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedTags.map((tagId) => {
                          const tag = tags.find((t) => t.id === tagId);
                          if (!tag) return null;
                          return (
                            <TagBadge
                              key={tagId}
                              tag={tag}
                              size="sm"
                              selected
                              onClick={() => handleTagToggle(tagId)}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <PromptCardSkeleton key={i} />
                    ))}
                  </div>
                ) : prompts.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-stagger">
                      {prompts.map((prompt) => (
                        <div key={prompt.id} className="relative">
                          <PromptCard
                            prompt={prompt}
                            onCopy={handleCopy}
                            onFavorite={handleFavorite}
                          />
                        </div>
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
          </>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="bg-cream-50 rounded-2xl border border-ink-100 p-8 text-center animate-fade-in-up">
              <div className="w-16 h-16 bg-ink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <SearchIcon className="w-8 h-8 text-ink-400" />
              </div>
              <h3 className="font-display text-xl font-semibold text-ink-900 mb-2">
                开始搜索
              </h3>
              <p className="text-ink-500 mb-6">
                在上方搜索框输入关键词，开始探索优质提示词
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {hotSearches.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(item)}
                    className="px-4 py-2 bg-cream-100 text-ink-700 rounded-full hover:bg-amber-100 hover:text-amber-700 transition-colors text-sm"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
