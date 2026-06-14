import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Sparkles,
  TrendingUp,
  Clock,
  Zap,
  Code2,
  PenTool,
  Briefcase,
  BookOpen,
  Palette,
  BarChart3,
  ChevronRight,
  Flame,
  Star,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePromptStore } from '@/store/promptStore';
import { useToast } from '@/hooks/useToast';
import PromptCard, { PromptCardSkeleton } from '@/components/PromptCard';
import { formatNumber } from '@/utils/formatters';
import apiClient from '@/lib/apiClient';
import type { Prompt, Tag, PaginatedResponse } from '../../shared/types';

const categories = [
  { id: '内容创作', name: '写作', icon: PenTool, color: 'bg-amber-100 text-amber-700' },
  { id: '代码开发', name: '编程', icon: Code2, color: 'bg-ink-100 text-ink-700' },
  { id: '营销文案', name: '商业', icon: Briefcase, color: 'bg-moss-500/10 text-moss-600' },
  { id: '教育学习', name: '教育', icon: BookOpen, color: 'bg-amber-100 text-amber-700' },
  { id: '设计创意', name: '创意', icon: Palette, color: 'bg-cream-200 text-ink-700' },
  { id: '数据分析', name: '分析', icon: BarChart3, color: 'bg-moss-500/10 text-moss-600' },
];

const searchSuggestions = [
  '文案写作',
  'Python代码生成',
  '产品分析报告',
  '英语翻译',
  '营销策划',
  '简历优化',
];

export default function Home() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { featuredPrompts, loading, fetchFeatured, copyPrompt } =
    usePromptStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const sectionsRef = useRef<Record<string, HTMLElement | null>>({});
  const [latestPromptsList, setLatestPromptsList] = useState<Prompt[]>([]);
  const [trendingPromptsList, setTrendingPromptsList] = useState<Prompt[]>([]);

  useEffect(() => {
    fetchFeatured();
    apiClient.get<PaginatedResponse<Prompt>>('/prompts?sort=createdAt&pageSize=8&status=approved').then(res => {
      if (res.success && res.data) setLatestPromptsList(res.data.items);
    });
    apiClient.get<PaginatedResponse<Prompt>>('/prompts?sort=viewCount&pageSize=6&status=approved').then(res => {
      if (res.success && res.data) setTrendingPromptsList(res.data.items);
    });
  }, [fetchFeatured]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.1 }
    );

    Object.values(sectionsRef.current).forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = searchSuggestions.filter((s) =>
        s.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSuggestions(filtered.length > 0 ? filtered : searchSuggestions);
    } else {
      setFilteredSuggestions(searchSuggestions);
    }
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    navigate(`/search?q=${encodeURIComponent(suggestion)}`);
  };

  const handleCopy = async (promptId: number) => {
    const prompt = [...featuredPrompts, ...latestPromptsList, ...trendingPromptsList].find((p) => p.id === promptId);
    if (prompt) {
      await navigator.clipboard.writeText(prompt.content);
      await copyPrompt(promptId);
      toast.success('复制成功');
    }
  };

  const handleFavorite = (_promptId: number) => {
  };

  const setSectionRef = (id: string) => (el: HTMLElement | null) => {
    sectionsRef.current[id] = el;
  };

  const trendingPrompts = [...trendingPromptsList]
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 5);

  const latestPrompts = [...latestPromptsList]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const displayedFeatured = featuredPrompts.slice(0, 6);

  return (
    <div className="min-h-screen bg-cream-100">
      <section className="relative grid-pattern-bg overflow-hidden pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="absolute inset-0 bg-gradient-to-b from-cream-100/80 to-cream-100 pointer-events-none" />
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              <span>发现优质 AI 提示词，提升创作效率</span>
            </div>

            <h1 className="font-display text-4xl md:text-6xl font-bold text-ink-900 mb-6 leading-tight">
              让每个 <span className="text-amber-500">灵感</span>
              <br className="hidden md:block" />
              都成为杰作
            </h1>

            <p className="text-lg md:text-xl text-ink-600 mb-10 max-w-2xl mx-auto">
              探索数千个精心设计的 AI 提示词，覆盖写作、编程、设计等多个领域。
              分享你的创作，与社区共同成长。
            </p>

            <div className="relative max-w-2xl mx-auto">
              <form onSubmit={handleSearch} className="relative">
                <div className="relative flex items-center">
                  <Search className="absolute left-5 w-5 h-5 text-ink-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="搜索提示词，例如：产品营销文案、Python代码优化..."
                    className="w-full pl-14 pr-32 py-4 bg-cream-50 border-2 border-ink-200 rounded-xl text-lg text-ink-900 placeholder-ink-400 focus:border-amber-500 focus:outline-none transition-colors shadow-card hover:shadow-card-hover"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 px-6 py-2.5 bg-amber-500 text-cream-50 rounded-lg font-medium hover:bg-amber-600 transition-colors shadow-button hover:shadow-button-hover"
                  >
                    搜索
                  </button>
                </div>

                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-cream-50 border border-ink-100 rounded-xl shadow-card-hover overflow-hidden z-20 animate-scale-in">
                    {filteredSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full px-5 py-3 text-left text-ink-700 hover:bg-ink-100 transition-colors flex items-center gap-3"
                      >
                        <Search className="w-4 h-4 text-ink-400" />
                        <span>{suggestion}</span>
                      </button>
                    ))}
                  </div>
                )}
              </form>

              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                <span className="text-ink-400 text-sm">热门搜索：</span>
                {searchSuggestions.slice(0, 4).map((tag, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(tag)}
                    className="px-3 py-1 text-sm bg-cream-50 text-ink-600 border border-ink-200 rounded-full hover:border-amber-300 hover:text-amber-600 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-16">
              <div className="text-center">
                <div className="font-display text-3xl md:text-4xl font-bold text-ink-900">10k+</div>
                <div className="text-ink-500 mt-1">精选提示词</div>
              </div>
              <div className="text-center">
                <div className="font-display text-3xl md:text-4xl font-bold text-ink-900">5k+</div>
                <div className="text-ink-500 mt-1">活跃用户</div>
              </div>
              <div className="text-center">
                <div className="font-display text-3xl md:text-4xl font-bold text-ink-900">500k+</div>
                <div className="text-ink-500 mt-1">累计使用</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="categories"
        ref={setSectionRef('categories')}
        className={cn(
          'py-16 transition-all duration-700',
          visibleSections.has('categories') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        )}
      >
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="section-title">浏览分类</h2>
              <p className="section-subtitle mb-0">按领域探索，找到适合你的提示词</p>
            </div>
            <Link
              to="/categories"
              className="hidden md:flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium transition-colors"
            >
              查看全部 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-4 animate-stagger">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.id}
                  to={`/categories?purpose=${encodeURIComponent(category.id)}`}
                  className="flex flex-col items-center gap-3 p-4 bg-cream-50 rounded-xl border border-ink-100 hover:border-amber-300 hover:shadow-card-hover transition-all duration-300 group"
                >
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110',
                      category.color
                    )}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-ink-700 group-hover:text-amber-600 transition-colors">
                    {category.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="featured"
        ref={setSectionRef('featured')}
        className={cn(
          'py-16 bg-cream-50 transition-all duration-700',
          visibleSections.has('featured') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        )}
      >
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="section-title mb-0">精选提示词</h2>
                <p className="text-ink-500 text-sm">编辑推荐的高质量内容</p>
              </div>
            </div>
            <Link
              to="/categories?sort=rating"
              className="flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium transition-colors"
            >
              查看更多 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading && featuredPrompts.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <PromptCardSkeleton key={i} />
              ))}
            </div>
          ) : displayedFeatured.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-stagger">
              {displayedFeatured.map((prompt) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  onCopy={handleCopy}
                  onFavorite={handleFavorite}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-ink-500">
              暂无精选提示词
            </div>
          )}
        </div>
      </section>

      <section
        id="latest"
        ref={setSectionRef('latest')}
        className={cn(
          'py-16 transition-all duration-700',
          visibleSections.has('latest') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        )}
      >
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-ink-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-ink-600" />
              </div>
              <div>
                <h2 className="section-title mb-0">最新发布</h2>
                <p className="text-ink-500 text-sm">社区最新分享的提示词</p>
              </div>
            </div>
            <Link
              to="/categories?sort=createdAt"
              className="flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium transition-colors"
            >
              查看更多 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading && latestPromptsList.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <PromptCardSkeleton key={i} />
              ))}
            </div>
          ) : latestPrompts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-stagger">
              {latestPrompts.map((prompt) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  onCopy={handleCopy}
                  onFavorite={handleFavorite}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-ink-500">
              暂无最新提示词
            </div>
          )}
        </div>
      </section>

      <section
        id="trending"
        ref={setSectionRef('trending')}
        className={cn(
          'py-16 bg-cream-50 transition-all duration-700',
          visibleSections.has('trending') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        )}
      >
        <div className="container">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
              <Flame className="w-5 h-5 text-cream-50" />
            </div>
            <div>
              <h2 className="section-title mb-0">本周热门</h2>
              <p className="text-ink-500 text-sm">本周最受欢迎的提示词</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              {loading && trendingPromptsList.length === 0 ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-cream-50 rounded-xl border border-ink-100 p-4 animate-pulse"
                    >
                      <div className="flex gap-4">
                        <div className="w-8 h-8 bg-ink-100 rounded" />
                        <div className="flex-1">
                          <div className="h-5 w-3/4 bg-ink-100 rounded mb-2" />
                          <div className="h-4 w-1/2 bg-ink-100 rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : trendingPrompts.length > 0 ? (
                <div className="space-y-4">
                  {trendingPrompts.map((prompt, index) => (
                    <Link
                      key={prompt.id}
                      to={`/prompt/${prompt.id}`}
                      className="group flex items-center gap-4 p-4 bg-cream-100 rounded-xl border border-ink-100 hover:border-amber-300 hover:shadow-card-hover transition-all duration-300"
                    >
                      <div
                        className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg',
                          index === 0
                            ? 'bg-amber-500 text-cream-50'
                            : index === 1
                            ? 'bg-ink-600 text-cream-50'
                            : index === 2
                            ? 'bg-amber-300 text-ink-900'
                            : 'bg-ink-100 text-ink-500'
                        )}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-ink-900 group-hover:text-amber-600 transition-colors line-clamp-1">
                          {prompt.title}
                        </h3>
                        <p className="text-sm text-ink-500 line-clamp-1 mt-0.5">
                          {prompt.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-ink-500">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          <span>{formatNumber(prompt.viewCount)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4" />
                          <span>{prompt.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-ink-500">
                  暂无热门排名数据
                </div>
              )}
            </div>

            <div className="lg:col-span-2">
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-cream-50 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-cream-50/20 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold">为什么使用提示词？</h3>
                  </div>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-cream-50/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs">✓</span>
                    </div>
                    <span className="text-cream-100">提升 AI 输出质量，获得更精准的结果</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-cream-50/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs">✓</span>
                    </div>
                    <span className="text-cream-100">节省时间，避免重复试错</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-cream-50/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs">✓</span>
                    </div>
                    <span className="text-cream-100">学习最佳实践，提升提示词编写能力</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-cream-50/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs">✓</span>
                    </div>
                    <span className="text-cream-100">分享你的创作，获得社区反馈</span>
                  </li>
                </ul>
                <Link
                  to="/register"
                  className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-cream-50 text-amber-600 rounded-lg font-medium hover:bg-cream-100 transition-colors shadow-button hover:shadow-button-hover"
                >
                  加入社区 <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
