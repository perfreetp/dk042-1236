import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  Plus,
  Edit3,
  Trash2,
  BarChart3,
  Eye,
  Copy,
  Heart,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/lib/apiClient';
import { formatDate, formatNumber } from '@/utils/formatters';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import type { Prompt, PaginatedResponse } from '../../shared/types';

type TabType = 'approved' | 'pending' | 'rejected';

const statusConfig: Record<
  TabType,
  { label: string; color: string; icon: typeof FileText }
> = {
  approved: {
    label: '已发布',
    color: 'bg-moss-500/10 text-moss-700 border-moss-500/20',
    icon: CheckCircle,
  },
  pending: {
    label: '审核中',
    color: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
    icon: Clock,
  },
  rejected: {
    label: '已下架',
    color: 'bg-vermilion-500/10 text-vermilion-700 border-vermilion-500/20',
    icon: XCircle,
  },
};

interface StatsOverview {
  totalViews: number;
  totalCopies: number;
  totalFavorites: number;
  totalPrompts: number;
  viewsChange: number;
  copiesChange: number;
}

export default function MyPrompts() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>('approved');
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<StatsOverview>({
    totalViews: 0,
    totalCopies: 0,
    totalFavorites: 0,
    totalPrompts: 0,
    viewsChange: 12.5,
    copiesChange: 8.3,
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState<Prompt | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadPrompts = async (status: TabType) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await apiClient.get<PaginatedResponse<Prompt>>(
        `/prompts?authorId=${user.id}&status=${status}&pageSize=100`
      );
      if (res.success && res.data) {
        setPrompts(res.data.items);
      }

      if (status === 'approved') {
        const allRes = await apiClient.get<PaginatedResponse<Prompt>>(
          `/prompts?authorId=${user.id}&pageSize=1000`
        );
        if (allRes.success && allRes.data) {
          const allPrompts = allRes.data.items;
          setStats({
            totalViews: allPrompts.reduce((sum, p) => sum + p.viewCount, 0),
            totalCopies: allPrompts.reduce((sum, p) => sum + p.copyCount, 0),
            totalFavorites: allPrompts.reduce(
              (sum, p) => sum + p.favoriteCount,
              0
            ),
            totalPrompts: allPrompts.length,
            viewsChange: 12.5,
            copiesChange: 8.3,
          });
        }
      }
    } catch {
      toast.error('加载失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      loadPrompts(activeTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user, isAuthenticated]);

  const handleDelete = async () => {
    if (!promptToDelete) return;
    setIsDeleting(true);
    try {
      const res = await apiClient.delete(`/prompts/${promptToDelete.id}`);
      if (res.success) {
        setPrompts(prompts.filter((p) => p.id !== promptToDelete.id));
        toast.success('删除成功');
        setShowDeleteModal(false);
        setPromptToDelete(null);
      } else {
        toast.error(res.error || '删除失败');
      }
    } catch {
      toast.error('删除失败，请稍后重试');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNewVersion = (prompt: Prompt) => {
    navigate(`/prompts/new?fork=${prompt.id}`);
  };

  const engagementData = useMemo(
    () => [
      { name: '周一', views: 120, copies: 45 },
      { name: '周二', views: 150, copies: 52 },
      { name: '周三', views: 180, copies: 61 },
      { name: '周四', views: 165, copies: 55 },
      { name: '周五', views: 210, copies: 72 },
      { name: '周六', views: 280, copies: 89 },
      { name: '周日', views: 245, copies: 78 },
    ],
    []
  );

  const maxViews = Math.max(...engagementData.map((d) => d.views));
  const maxCopies = Math.max(...engagementData.map((d) => d.copies));

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen pt-20 pb-12">
        <div className="container mx-auto px-4">
          <EmptyState
            variant="no-prompts"
            action={{
              label: '登录后查看',
              href: '/login',
            }}
          />
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'approved' as TabType, ...statusConfig.approved, count: stats.totalPrompts },
    { id: 'pending' as TabType, ...statusConfig.pending, count: 0 },
    { id: 'rejected' as TabType, ...statusConfig.rejected, count: 0 },
  ];

  return (
    <div className="min-h-screen pt-20 pb-12 bg-cream-100">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-ink-900 mb-1">
              我的提示词
            </h1>
            <p className="text-ink-500">管理你发布的所有提示词</p>
          </div>
          <Link
            to="/prompts/new"
            className="btn-primary bg-amber-500 text-cream-50"
          >
            <Plus className="w-4 h-4" />
            创建提示词
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-cream-50 rounded-xl border border-ink-100 shadow-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-amber-600" />
              </div>
              <div
                className={cn(
                  'flex items-center gap-1 text-xs font-medium',
                  stats.viewsChange >= 0
                    ? 'text-moss-600'
                    : 'text-vermilion-600'
                )}
              >
                {stats.viewsChange >= 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {Math.abs(stats.viewsChange)}%
              </div>
            </div>
            <p className="font-display text-2xl font-bold text-ink-900">
              {formatNumber(stats.totalViews)}
            </p>
            <p className="text-sm text-ink-500">总浏览量</p>
          </div>

          <div className="bg-cream-50 rounded-xl border border-ink-100 shadow-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-ink-100 rounded-lg flex items-center justify-center">
                <Copy className="w-5 h-5 text-ink-600" />
              </div>
              <div
                className={cn(
                  'flex items-center gap-1 text-xs font-medium',
                  stats.copiesChange >= 0
                    ? 'text-moss-600'
                    : 'text-vermilion-600'
                )}
              >
                {stats.copiesChange >= 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {Math.abs(stats.copiesChange)}%
              </div>
            </div>
            <p className="font-display text-2xl font-bold text-ink-900">
              {formatNumber(stats.totalCopies)}
            </p>
            <p className="text-sm text-ink-500">总复制量</p>
          </div>

          <div className="bg-cream-50 rounded-xl border border-ink-100 shadow-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-vermilion-500/10 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-vermilion-500" />
              </div>
            </div>
            <p className="font-display text-2xl font-bold text-ink-900">
              {formatNumber(stats.totalFavorites)}
            </p>
            <p className="text-sm text-ink-500">总收藏量</p>
          </div>

          <div className="bg-cream-50 rounded-xl border border-ink-100 shadow-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-moss-500/10 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-moss-600" />
              </div>
            </div>
            <p className="font-display text-2xl font-bold text-ink-900">
              {formatNumber(stats.totalPrompts)}
            </p>
            <p className="text-sm text-ink-500">发布总数</p>
          </div>
        </div>

        {/* Engagement Chart */}
        <div className="bg-cream-50 rounded-xl border border-ink-100 shadow-card p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display text-lg font-semibold text-ink-900">
                互动趋势
              </h3>
              <p className="text-sm text-ink-500">最近7天的数据表现</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-sm text-ink-600">浏览量</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-ink-400" />
                <span className="text-sm text-ink-600">复制量</span>
              </div>
            </div>
          </div>

          <div className="flex items-end justify-between gap-2 h-48">
            {engagementData.map((day, index) => (
              <div
                key={day.name}
                className="flex-1 flex flex-col items-center gap-2"
              >
                <div className="w-full flex items-end justify-center gap-1 h-40">
                  <div
                    className="w-4 bg-amber-500/80 rounded-t-md transition-all duration-500 hover:bg-amber-600"
                    style={{
                      height: `${(day.views / maxViews) * 100}%`,
                      animationDelay: `${index * 50}ms`,
                    }}
                  />
                  <div
                    className="w-4 bg-ink-400/80 rounded-t-md transition-all duration-500 hover:bg-ink-500"
                    style={{
                      height: `${(day.copies / maxCopies) * 100}%`,
                      animationDelay: `${index * 50}ms`,
                    }}
                  />
                </div>
                <span className="text-xs text-ink-500">{day.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-cream-50 rounded-xl border border-ink-100 shadow-card overflow-hidden">
          <div className="flex border-b border-ink-100">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-4 font-medium transition-colors border-b-2 -mb-px',
                    activeTab === tab.id
                      ? 'text-amber-600 border-amber-500 bg-amber-500/5'
                      : 'text-ink-600 border-transparent hover:text-ink-900 hover:bg-ink-50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-xs',
                      activeTab === tab.id
                        ? 'bg-amber-500/20 text-amber-700'
                        : 'bg-ink-100 text-ink-600'
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Prompt List */}
          <div className="divide-y divide-ink-100">
            {isLoading ? (
              <div className="p-8">
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-20 bg-ink-100 rounded-lg animate-pulse"
                    />
                  ))}
                </div>
              </div>
            ) : prompts.length === 0 ? (
              <EmptyState
                variant="no-prompts"
                action={
                  activeTab === 'approved'
                    ? {
                        label: '创建提示词',
                        href: '/prompts/new',
                      }
                    : undefined
                }
              />
            ) : (
              prompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="p-4 hover:bg-ink-50/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <Link
                          to={`/prompts/${prompt.id}`}
                          className="font-semibold text-ink-900 hover:text-amber-600 transition-colors truncate"
                        >
                          {prompt.title}
                        </Link>
                        <span
                          className={cn(
                            'flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-md border',
                            statusConfig[activeTab].color
                          )}
                        >
                          {statusConfig[activeTab].label}
                        </span>
                        {prompt.isFeatured && (
                          <span className="flex-shrink-0 px-2 py-0.5 bg-amber-500 text-cream-50 text-xs font-medium rounded-md">
                            精选
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-ink-600 line-clamp-2 mb-3">
                        {prompt.description}
                      </p>

                      <div className="flex items-center gap-6 text-sm text-ink-500">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {formatNumber(prompt.viewCount)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Copy className="w-4 h-4" />
                          {formatNumber(prompt.copyCount)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {formatNumber(prompt.favoriteCount)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDate(prompt.updatedAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="text-ink-400">v{prompt.version}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/prompts/${prompt.id}`)}
                        className="p-2 text-ink-500 hover:text-ink-700 hover:bg-ink-100 rounded-lg transition-colors"
                        title="查看详情"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          navigate(`/prompts/new?edit=${prompt.id}`)
                        }
                        className="p-2 text-ink-500 hover:text-amber-600 hover:bg-amber-500/10 rounded-lg transition-colors"
                        title="编辑"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleNewVersion(prompt)}
                        className="p-2 text-ink-500 hover:text-moss-600 hover:bg-moss-500/10 rounded-lg transition-colors"
                        title="新版本"
                      >
                        <TrendingUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/prompts/${prompt.id}/stats`)}
                        className="p-2 text-ink-500 hover:text-ink-700 hover:bg-ink-100 rounded-lg transition-colors"
                        title="数据统计"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </button>
                      {activeTab === 'approved' && (
                        <button
                          onClick={() => {
                            setPromptToDelete(prompt);
                            setShowDeleteModal(true);
                          }}
                          className="p-2 text-ink-500 hover:text-vermilion-500 hover:bg-vermilion-500/10 rounded-lg transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setPromptToDelete(null);
        }}
        title="确认删除"
        footer={
          <>
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setPromptToDelete(null);
              }}
              className="btn-ghost"
            >
              取消
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="btn-primary bg-vermilion-500 text-cream-50 hover:bg-vermilion-600 disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              确认删除
            </button>
          </>
        }
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-vermilion-500/10 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-vermilion-500" />
          </div>
          <div>
            <p className="font-medium text-ink-900 mb-1">
              你确定要删除这个提示词吗？
            </p>
            <p className="text-ink-600 text-sm mb-2">
              标题：<span className="font-medium">{promptToDelete?.title}</span>
            </p>
            <p className="text-ink-500 text-sm">
              删除后无法恢复，相关的浏览、复制、收藏数据也会被清除。
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
