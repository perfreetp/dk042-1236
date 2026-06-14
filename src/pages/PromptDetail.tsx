import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Copy,
  Check,
  GitFork,
  Heart,
  Share2,
  Flag,
  UserPlus,
  Clock,
  Eye,
  TrendingUp,
  ChevronDown,
  List,
  BookOpen,
  Code2,
  History,
  AlertCircle,
  ArrowLeft,
  Star,
  Loader2,
  MessageSquare,
  MoreHorizontal,
} from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import { cn } from '@/lib/utils';
import { usePromptStore } from '@/store/promptStore';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import { useCopy } from '@/hooks/useCopy';
import RatingStars from '@/components/RatingStars';
import TagBadge from '@/components/TagBadge';
import CommentForm from '@/components/CommentForm';
import CommentItem, { CommentSkeleton } from '@/components/CommentItem';
import PromptCard, { PromptCardSkeleton } from '@/components/PromptCard';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import { formatDate, formatNumber, getDifficultyLabel } from '@/utils/formatters';
import { REPORT_REASONS } from '@/utils/constants';
import { apiClient } from '@/lib/apiClient';
import type { Prompt, Comment, CreateCommentRequest, CreateReportRequest } from '../../shared/types';

const sidebarSections = [
  { id: 'content', label: '提示词内容', icon: Code2 },
  { id: 'examples', label: '输入输出示例', icon: BookOpen },
  { id: 'use-cases', label: '使用场景', icon: List },
  { id: 'comments', label: '评论', icon: MessageSquare },
];

const difficultyConfig = {
  beginner: { label: '入门', color: 'bg-moss-500/10 text-moss-600 border-moss-500/20' },
  intermediate: { label: '进阶', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  advanced: { label: '高级', color: 'bg-vermilion-500/10 text-vermilion-500 border-vermilion-500/20' },
};

export default function PromptDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isCopied, copy } = useCopy();
  const { currentPrompt, loading, fetchById, copyPrompt, forkPrompt, ratePrompt, clearCurrentPrompt } =
    usePromptStore();
  const { user, isAuthenticated } = useAuthStore();

  const [isFavorited, setIsFavorited] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [relatedPrompts, setRelatedPrompts] = useState<Prompt[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [viewIncremented, setViewIncremented] = useState(false);
  const [activeSection, setActiveSection] = useState('content');
  const [isForking, setIsForking] = useState(false);
  const codeRef = useRef<HTMLPreElement>(null);
  const versionDropdownRef = useRef<HTMLDivElement>(null);

  const promptId = id ? parseInt(id, 10) : 0;

  useEffect(() => {
    if (promptId) {
      fetchById(promptId);
      fetchComments();
      fetchRelated();
    }
    return () => {
      clearCurrentPrompt();
    };
  }, [promptId, fetchById, clearCurrentPrompt]);

  useEffect(() => {
    if (currentPrompt && !viewIncremented) {
      incrementViewCount();
    }
  }, [currentPrompt, viewIncremented]);

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [currentPrompt?.content, selectedVersion]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        versionDropdownRef.current &&
        !versionDropdownRef.current.contains(event.target as Node)
      ) {
        setShowVersionDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const incrementViewCount = async () => {
    if (!currentPrompt || viewIncremented) return;
    try {
      await apiClient.post(`/prompts/${promptId}/view`);
      setViewIncremented(true);
    } catch {
      // 静默失败
    }
  };

  const fetchComments = async () => {
    setCommentsLoading(true);
    apiClient
      .get<Comment[]>(`/prompts/${promptId}/comments`)
      .then((response) => {
        if (response.success && response.data) {
          setComments(response.data);
        }
      })
      .finally(() => setCommentsLoading(false));
  };

  const fetchRelated = async () => {
    setRelatedLoading(true);
    apiClient
      .get<Prompt[]>(`/prompts/${promptId}/related`)
      .then((response) => {
        if (response.success && response.data) {
          setRelatedPrompts(response.data);
        }
      })
      .finally(() => setRelatedLoading(false));
  };

  const handleCopy = async () => {
    if (currentPrompt) {
      const contentToCopy = selectedVersion
        ? currentPrompt.versionHistory.find((v) => v.version === selectedVersion)?.content ||
          currentPrompt.content
        : currentPrompt.content;
      await copy(contentToCopy);
      await copyPrompt(promptId);
    }
  };

  const handleFork = async () => {
    if (!isAuthenticated) {
      toast.error('请先登录');
      navigate('/login');
      return;
    }
    setIsForking(true);
    try {
      const response = await forkPrompt(promptId);
      if (response.success && response.data) {
        toast.success('派生成功，已创建副本');
        navigate(`/edit/${response.data.id}`);
      } else {
        toast.error(response.error || '派生失败');
      }
    } catch (error) {
      toast.error('派生失败');
    } finally {
      setIsForking(false);
    }
  };

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      toast.error('请先登录');
      navigate('/login');
      return;
    }
    try {
      if (isFavorited) {
        await apiClient.delete(`/favorites/${promptId}`);
        setIsFavorited(false);
        toast.info('已取消收藏');
      } else {
        await apiClient.post('/favorites', { promptId });
        setIsFavorited(true);
        toast.success('已添加到收藏');
      }
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated) {
      toast.error('请先登录');
      navigate('/login');
      return;
    }
    try {
      if (isFollowing) {
        await apiClient.delete(`/follow/${currentPrompt?.authorId}`);
        setIsFollowing(false);
        toast.info('已取消关注');
      } else {
        await apiClient.post('/follow', { userId: currentPrompt?.authorId });
        setIsFollowing(true);
        toast.success('已关注作者');
      }
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const handleRate = async (rating: number) => {
    if (!isAuthenticated) {
      toast.error('请先登录');
      navigate('/login');
      return;
    }
    setUserRating(rating);
    await ratePrompt(promptId, { rating });
    toast.success('评分成功');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentPrompt?.title,
          text: currentPrompt?.description,
          url: window.location.href,
        });
      } catch {
        // 用户取消分享
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('链接已复制到剪贴板');
    }
  };

  const handleSubmitReport = async () => {
    if (!isAuthenticated) {
      toast.error('请先登录');
      navigate('/login');
      return;
    }
    if (!reportReason) {
      toast.error('请选择举报原因');
      return;
    }
    setIsSubmittingReport(true);
    try {
      const response = await apiClient.post<CreateReportRequest>('/reports', {
        promptId,
        reason: reportReason,
        description: reportDescription,
      });
      if (response.success) {
        toast.success('举报已提交，我们会尽快处理');
        setShowReportModal(false);
        setReportReason('');
        setReportDescription('');
      } else {
        toast.error(response.error || '举报失败');
      }
    } catch (error) {
      toast.error('举报失败');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleSubmitComment = async (content: string) => {
    try {
      const response = await apiClient.post<Comment>('/comments', {
        promptId,
        content,
      });
      if (response.success && response.data) {
        setComments((prev) => [response.data!, ...prev]);
        toast.success('评论发表成功');
      } else {
        toast.error(response.error || '评论发表失败');
      }
    } catch (error) {
      toast.error('评论发表失败');
    }
  };

  const handleCommentLike = async (commentId: number) => {
    try {
      await apiClient.post(`/comments/${commentId}/like`);
    } catch {
      // 静默失败
    }
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getDisplayContent = () => {
    if (!currentPrompt) return '';
    if (selectedVersion) {
      const version = currentPrompt.versionHistory.find((v) => v.version === selectedVersion);
      return version?.content || currentPrompt.content;
    }
    return currentPrompt.content;
  };

  const getDisplayDescription = () => {
    if (!currentPrompt) return '';
    if (selectedVersion) {
      const version = currentPrompt.versionHistory.find((v) => v.version === selectedVersion);
      return version?.description || currentPrompt.description;
    }
    return currentPrompt.description;
  };

  if (loading && !currentPrompt) {
    return (
      <div className="min-h-screen bg-cream-100 pt-8 pb-16">
        <div className="container">
          <div className="animate-pulse">
            <div className="h-8 w-32 bg-ink-100 rounded mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-3">
                <div className="h-10 w-3/4 bg-ink-100 rounded mb-4" />
                <div className="h-6 w-1/2 bg-ink-100 rounded mb-8" />
                <div className="h-64 bg-ink-100 rounded mb-8" />
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-4 bg-ink-100 rounded" />
                  ))}
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="h-64 bg-ink-100 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentPrompt) {
    return (
      <div className="min-h-screen bg-cream-100 pt-8 pb-16">
        <div className="container">
          <EmptyState
            variant="no-results"
            action={{
              label: '返回首页',
              href: '/',
            }}
          />
        </div>
      </div>
    );
  }

  const difficulty = difficultyConfig[currentPrompt.difficulty];
  const displayContent = getDisplayContent();
  const displayDescription = getDisplayDescription();

  return (
    <div className="min-h-screen bg-cream-100 pt-8 pb-16">
      <div className="container">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-ink-600 hover:text-ink-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="hidden lg:block lg:col-span-2">
            <div className="sticky top-24">
              <nav className="space-y-1">
              {sidebarSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors',
                      activeSection === section.id
                        ? 'bg-amber-500 text-cream-50'
                        : 'text-ink-600 hover:bg-ink-100'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{section.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-8 p-4 bg-cream-50 rounded-xl border border-ink-100">
              <h4 className="font-semibold text-ink-900 mb-3 text-sm">
                提示词信息
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-ink-500">版本</span>
                  <span className="text-ink-700 font-medium">
                    {selectedVersion || currentPrompt.version}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-500">创建时间</span>
                  <span className="text-ink-700 font-medium">
                    {formatDate(currentPrompt.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-500">更新时间</span>
                  <span className="text-ink-700 font-medium">
                    {formatDate(currentPrompt.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
            </div>
          </aside>

          <main className="lg:col-span-7 min-w-0">
            <header className="mb-8 animate-fade-in-up">
              <div className="flex items-center gap-2 mb-4">
                <span
                  className={cn(
                    'px-3 py-1 text-xs font-medium rounded-md border',
                    difficulty.color
                  )}
                >
                  {difficulty.label}
                </span>
                {currentPrompt.isFeatured && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-amber-500 text-cream-50 text-xs font-medium rounded-md">
                    精选
                  </span>
                )}
              </div>

              <h1 className="font-display text-3xl md:text-4xl font-bold text-ink-900 mb-4">
                {currentPrompt.title}
              </h1>

              <p className="text-ink-600 text-lg mb-6">
                {displayDescription}
              </p>

              <div className="flex flex-wrap items-center gap-6 mb-6">
                <Link
                  to={`/profile/${currentPrompt.authorId}`}
                  className="flex items-center gap-3 group"
                >
                  <img
                    src={currentPrompt.author?.avatar}
                    alt={currentPrompt.author?.username}
                    className="w-10 h-10 rounded-full object-cover border-2 border-ink-100"
                  />
                  <div>
                    <div className="font-medium text-ink-900 group-hover:text-amber-600 transition-colors">
                      {currentPrompt.author?.username}
                    </div>
                    <div className="text-sm text-ink-500">
                      {currentPrompt.author?.bio || '提示词创作者'}
                    </div>
                  </div>
                </Link>

                <button
                  onClick={handleFollow}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors',
                    isFollowing
                      ? 'bg-ink-100 text-ink-600 border-ink-200 hover:bg-ink-200'
                      : 'bg-amber-500 text-cream-50 border-amber-500 hover:bg-amber-600'
                  )}
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {isFollowing ? '已关注' : '关注'}
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-6">
                <RatingStars
                  rating={currentPrompt.rating}
                  ratingCount={currentPrompt.ratingCount}
                  size="md"
                  interactive={isAuthenticated}
                  onRate={handleRate}
                  showCount={true}
                />
                <div className="flex items-center gap-4 text-ink-500 text-sm">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{formatNumber(currentPrompt.viewCount)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Copy className="w-4 h-4" />
                    <span>{formatNumber(currentPrompt.copyCount)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    <span>{formatNumber(currentPrompt.favoriteCount)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-6">
                {currentPrompt.tags?.map((tag) => (
                  <TagBadge key={tag.id} tag={tag} />
                ))}
              </div>
            </header>

            <section id="content" className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-2xl font-bold text-ink-900">
                  提示词内容
                </h2>
                <div className="flex items-center gap-3" ref={versionDropdownRef}>
                  {currentPrompt.versionHistory?.length > 0 && (
                    <div className="relative">
                      <button
                        onClick={() => setShowVersionDropdown(!showVersionDropdown)}
                        className="flex items-center gap-2 px-3 py-2 bg-cream-50 border border-ink-200 rounded-lg text-sm text-ink-700 hover:border-amber-300 transition-colors"
                      >
                        <History className="w-4 h-4" />
                        <span>版本 {selectedVersion || currentPrompt.version}</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>

                      {showVersionDropdown && (
                        <div className="absolute right-0 mt-2 w-48 bg-cream-50 border border-ink-100 rounded-lg shadow-card-hover overflow-hidden z-10 animate-scale-in">
                          <button
                            onClick={() => {
                              setSelectedVersion(null);
                              setShowVersionDropdown(false);
                            }}
                            className={cn(
                              'w-full px-4 py-2 text-left text-sm hover:bg-ink-100 transition-colors',
                              !selectedVersion && 'bg-amber-50 text-amber-700'
                            )}
                          >
                            {currentPrompt.version} (当前)
                          </button>
                          {currentPrompt.versionHistory?.map((version) => (
                            <button
                              key={version.id}
                              onClick={() => {
                                setSelectedVersion(version.version);
                                setShowVersionDropdown(false);
                              }}
                              className={cn(
                                'w-full px-4 py-2 text-left text-sm hover:bg-ink-100 transition-colors',
                                selectedVersion === version.version && 'bg-amber-50 text-amber-700'
                              )}
                            >
                              {version.version}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={handleCopy}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
                      isCopied
                        ? 'bg-moss-500 text-cream-50'
                        : 'bg-amber-500 text-cream-50 hover:bg-amber-600'
                    )}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>已复制</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>复制提示词</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleFork}
                    disabled={isForking}
                    className="flex items-center gap-2 px-4 py-2 bg-ink-900 text-cream-50 rounded-lg font-medium hover:bg-ink-800 transition-colors disabled:opacity-50"
                  >
                    {isForking ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <GitFork className="w-4 h-4" />
                    )}
                    <span>派生</span>
                  </button>
                </div>
              </div>

              <div className="relative group">
                <pre className="!bg-ink-900 !rounded-xl !p-6 !overflow-x-auto">
                  <code
                    ref={codeRef}
                    className="language-markdown !text-sm !leading-relaxed"
                  >
                    {displayContent}
                  </code>
                </pre>
              </div>
            </section>

            <section id="examples" className="mb-12">
              <h2 className="font-display text-2xl font-bold text-ink-900 mb-6">
                输入输出示例
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-cream-50 rounded-xl border border-ink-100 overflow-hidden">
                  <div className="px-4 py-3 bg-ink-100 border-b border-ink-100">
                    <h3 className="font-semibold text-ink-700 text-sm">
                      输入示例
                    </h3>
                  </div>
                  <div className="p-4">
                    <pre className="text-ink-700 whitespace-pre-wrap text-sm font-mono">
                      {currentPrompt.inputExample || '暂无输入示例'}
                    </pre>
                  </div>
                </div>
                <div className="bg-cream-50 rounded-xl border border-ink-100 overflow-hidden">
                  <div className="px-4 py-3 bg-amber-100 border-b border-ink-100">
                    <h3 className="font-semibold text-amber-700 text-sm">
                      输出示例
                    </h3>
                  </div>
                  <div className="p-4">
                    <pre className="text-ink-700 whitespace-pre-wrap text-sm font-mono">
                      {currentPrompt.outputExample || '暂无输出示例'}
                    </pre>
                  </div>
                </div>
              </div>
            </section>

            <section id="use-cases" className="mb-12">
              <h2 className="font-display text-2xl font-bold text-ink-900 mb-6">
                使用场景
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentPrompt.useCases?.map((useCase, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-4 bg-cream-50 rounded-xl border border-ink-100"
                  >
                    <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold">{index + 1}</span>
                    </div>
                    <p className="text-ink-700">{useCase}</p>
                  </div>
                )) || (
                  <p className="text-ink-500">暂无使用场景</p>
                )}
              </div>
            </section>

            <section id="comments" className="mb-12">
              <h2 className="font-display text-2xl font-bold text-ink-900 mb-6">
                评论 ({comments.length})
              </h2>

              <div className="mb-8">
                <CommentForm
                  onSubmit={handleSubmitComment}
                  isAuthenticated={isAuthenticated}
                  placeholder="分享你的使用体验或问题..."
                />
              </div>

              {commentsLoading ? (
                <div className="space-y-6">
                  {[...Array(3)].map((_, i) => (
                    <CommentSkeleton key={i} />
                  ))}
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-6">
                  {comments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      onLike={handleCommentLike}
                      onReport={() => {}}
                      isAuthenticated={isAuthenticated}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-ink-500">
                  暂无评论，来发表第一条评论吧
                </div>
              )}
            </section>

            {relatedPrompts.length > 0 && (
              <section>
                <h2 className="font-display text-2xl font-bold text-ink-900 mb-6">
                  相关提示词
                </h2>
                {relatedLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                      <PromptCardSkeleton key={i} />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {relatedPrompts.slice(0, 3).map((prompt) => (
                      <PromptCard
                        key={prompt.id}
                        prompt={prompt}
                        onCopy={() => {}}
                        onFavorite={() => {}}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}
          </main>

          <aside className="lg:col-span-3">
            <div className="sticky top-24 space-y-6">
              <div className="bg-cream-50 rounded-xl border border-ink-100 p-6">
                <h3 className="font-semibold text-ink-900 mb-4">快捷操作</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleFavorite}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-colors',
                      isFavorited
                        ? 'bg-vermilion-500 text-cream-50 border-vermilion-500'
                        : 'bg-cream-50 text-ink-700 border-ink-200 hover:border-vermilion-300 hover:text-vermilion-500'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Heart
                        className={cn('w-5 h-5', isFavorited && 'fill-current')}
                      />
                      <span className="font-medium">
                        {isFavorited ? '已收藏' : '收藏'}
                      </span>
                    </div>
                    <span className="text-sm">
                      {formatNumber(currentPrompt.favoriteCount)}
                    </span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="w-full flex items-center justify-between px-4 py-3 bg-cream-50 text-ink-700 rounded-lg border border-ink-200 hover:border-amber-300 hover:text-amber-600 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Share2 className="w-5 h-5" />
                      <span className="font-medium">分享</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setShowReportModal(true)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-cream-50 text-ink-700 rounded-lg border border-ink-200 hover:border-vermilion-300 hover:text-vermilion-500 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Flag className="w-5 h-5" />
                      <span className="font-medium">举报</span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-cream-50">
                <h3 className="font-display text-lg font-bold mb-3">
                  喜欢这个提示词？
                </h3>
                <p className="text-cream-100 text-sm mb-4">
                  支持作者，给个评分吧！
                </p>
                <div className="flex items-center gap-2 mb-4">
                  <RatingStars
                    rating={userRating || 0}
                    size="lg"
                    interactive={isAuthenticated}
                    onRate={handleRate}
                    showCount={false}
                  />
                </div>
                <div className="text-cream-100 text-sm">
                  {currentPrompt.rating.toFixed(1)} 分，共 {currentPrompt.ratingCount} 人评分
                </div>
              </div>

              <div className="bg-cream-50 rounded-xl border border-ink-100 p-6">
                <h3 className="font-semibold text-ink-900 mb-4">统计数据</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-ink-100 rounded-lg flex items-center justify-center">
                        <Eye className="w-4 h-4 text-ink-500" />
                      </div>
                    </div>
                    <span className="text-ink-700 font-medium">
                      {formatNumber(currentPrompt.viewCount)} 次浏览
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                        <Copy className="w-4 h-4 text-amber-600" />
                      </div>
                    </div>
                    <span className="text-ink-700 font-medium">
                      {formatNumber(currentPrompt.copyCount)} 次复制
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-vermilion-500/10 rounded-lg flex items-center justify-center">
                        <Heart className="w-4 h-4 text-vermilion-500" />
                      </div>
                    </div>
                    <span className="text-ink-700 font-medium">
                      {formatNumber(currentPrompt.favoriteCount)} 次收藏
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-ink-100 rounded-lg flex items-center justify-center">
                        <GitFork className="w-4 h-4 text-ink-500" />
                      </div>
                    </div>
                    <span className="text-ink-700 font-medium">
                      {formatNumber(currentPrompt.forkCount)} 次派生
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-cream-50 rounded-xl border border-ink-100 p-6">
                <h3 className="font-semibold text-ink-900 mb-4">
                  关于作者
                </h3>
                <Link
                  to={`/profile/${currentPrompt.authorId}`}
                  className="flex items-center gap-3 mb-4"
                >
                  <img
                    src={currentPrompt.author?.avatar}
                    alt={currentPrompt.author?.username}
                    className="w-12 h-12 rounded-full object-cover border-2 border-ink-100"
                  />
                  <div>
                    <div className="font-semibold text-ink-900">
                      {currentPrompt.author?.username}
                    </div>
                    <div className="text-sm text-ink-500">
                      {formatNumber(currentPrompt.author?.followerCount || 0)} 关注者
                    </div>
                  </div>
                </Link>
                <p className="text-ink-600 text-sm mb-4">
                  {currentPrompt.author?.bio || '热爱提示词创作，分享优质内容'}
                </p>
                <button
                  onClick={handleFollow}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                    isFollowing
                      ? 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                      : 'bg-amber-500 text-cream-50 hover:bg-amber-600'
                  )}
                >
                  <UserPlus className="w-4 h-4" />
                  {isFollowing ? '已关注' : '关注作者'}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="举报提示词"
      >
        <div className="space-y-4">
          <p className="text-ink-600 text-sm">
            请选择举报原因，我们会认真处理每一条举报。
          </p>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-ink-700">
              举报原因
            </label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full px-4 py-3 bg-cream-50 border-2 border-ink-200 rounded-lg text-ink-900 focus:border-amber-500 focus:outline-none transition-colors"
            >
              <option value="">请选择原因</option>
              {REPORT_REASONS.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-ink-700">
              详细描述（可选
            </label>
            <textarea
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              placeholder="请详细描述问题..."
              rows={4}
              className="w-full px-4 py-3 bg-cream-50 border-2 border-ink-200 rounded-lg text-ink-900 placeholder-ink-400 focus:border-amber-500 focus:outline-none transition-colors resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowReportModal(false)}
              className="flex-1 px-6 py-3 bg-ink-100 text-ink-700 rounded-lg font-medium hover:bg-ink-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmitReport}
              disabled={!reportReason || isSubmittingReport}
              className={cn(
                'flex-1 px-6 py-3 rounded-lg font-medium transition-colors',
                !reportReason || isSubmittingReport
                  ? 'bg-ink-200 text-ink-400 cursor-not-allowed'
                  : 'bg-vermilion-500 text-cream-50 hover:bg-vermilion-600'
              )}
            >
              {isSubmittingReport ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  提交中...
                </>
              ) : (
                '提交举报'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
