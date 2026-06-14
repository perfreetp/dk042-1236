import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  FileText,
  Tag as TagIcon,
  AlertTriangle,
  Home,
  Users,
  CheckCircle,
  XCircle,
  Loader2,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Clock,
  Star,
  Image,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/lib/apiClient';
import { formatDate, formatNumber } from '@/utils/formatters';
import { CATEGORY_LABELS, REPORT_REASONS } from '@/utils/constants';

import Modal from '@/components/Modal';
import type {
  Tag,
  Prompt,
  Report,
  Banner,
  HomeConfig,
  ApiResponse,
  PaginatedResponse,
} from '../../shared/types';

type AdminTab = 'content' | 'tags' | 'reports' | 'home';

interface Stats {
  pendingCount: number;
  reportsCount: number;
  totalUsers: number;
  totalPrompts: number;
}

interface TabLoadingState {
  content: boolean;
  tags: boolean;
  reports: boolean;
  home: boolean;
}

const tabConfig: Record<
  AdminTab,
  { label: string; icon: typeof Shield; color: string }
> = {
  content: {
    label: '内容审核',
    icon: FileText,
    color: 'bg-amber-500/10 text-amber-600',
  },
  tags: {
    label: '标签管理',
    icon: TagIcon,
    color: 'bg-ink-100 text-ink-600',
  },
  reports: {
    label: '举报处理',
    icon: AlertTriangle,
    color: 'bg-vermilion-500/10 text-vermilion-600',
  },
  home: {
    label: '首页配置',
    icon: Home,
    color: 'bg-moss-500/10 text-moss-600',
  },
};

const reportStatusConfig: Record<
  Report['status'],
  { label: string; color: string }
> = {
  pending: {
    label: '待处理',
    color: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  },
  resolved: {
    label: '已解决',
    color: 'bg-moss-500/10 text-moss-700 border-moss-500/20',
  },
  rejected: {
    label: '已驳回',
    color: 'bg-ink-100 text-ink-600 border-ink-200',
  },
};

export default function Admin() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<AdminTab>('content');
  const [stats, setStats] = useState<Stats>({
    pendingCount: 0,
    reportsCount: 0,
    totalUsers: 0,
    totalPrompts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState<TabLoadingState>({
    content: false,
    tags: false,
    reports: false,
    home: false,
  });
  const [pendingPrompts, setPendingPrompts] = useState<Prompt[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [homeConfig, setHomeConfig] = useState<HomeConfig | null>(null);
  const [allPrompts, setAllPrompts] = useState<Prompt[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);

  const [showTagModal, setShowTagModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [tagForm, setTagForm] = useState({
    name: '',
    category: 'purpose' as Tag['category'],
    color: '#F59E0B',
  });

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectPromptId, setRejectPromptId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [bannerForm, setBannerForm] = useState({
    title: '',
    description: '',
    imageUrl: '',
    linkUrl: '',
  });

  const setTabLoadingState = (tab: AdminTab, loading: boolean) => {
    setTabLoading((prev) => ({ ...prev, [tab]: loading }));
  };

  const loadStats = async () => {
    try {
      const [pendingRes, reportsRes, usersRes, promptsRes] =
        await Promise.all([
          apiClient.get<{ count: number }>('/admin/pending/count'),
          apiClient.get<{ count: number }>('/admin/reports/count'),
          apiClient.get<{ count: number }>('/admin/users/count'),
          apiClient.get<{ count: number }>('/admin/prompts/count'),
        ]);

      setStats({
        pendingCount: pendingRes.success ? pendingRes.data?.count || 0 : 0,
        reportsCount: reportsRes.success ? reportsRes.data?.count || 0 : 0,
        totalUsers: usersRes.success ? usersRes.data?.count || 0 : 0,
        totalPrompts: promptsRes.success ? promptsRes.data?.count || 0 : 0,
      });
    } catch {
      toast.error('加载统计数据失败');
    }
  };

  const loadPendingPrompts = async (showLoading = false) => {
    if (showLoading) setTabLoadingState('content', true);
    try {
      const res = await apiClient.get<PaginatedResponse<Prompt>>(
        '/admin/prompts/pending'
      );
      if (res.success && res.data) {
        const items = Array.isArray(res.data) ? res.data : res.data.items || [];
        setPendingPrompts(items);
      }
    } catch {
      toast.error('加载待审核内容失败');
    } finally {
      if (showLoading) setTabLoadingState('content', false);
    }
  };

  const loadTags = async (showLoading = false) => {
    if (showLoading) setTabLoadingState('tags', true);
    try {
      const res = await apiClient.get<Tag[]>('/tags');
      if (res.success && res.data) {
        setAllTags(res.data);
      }
    } catch {
      toast.error('加载标签失败');
    } finally {
      if (showLoading) setTabLoadingState('tags', false);
    }
  };

  const loadReports = async (showLoading = false) => {
    if (showLoading) setTabLoadingState('reports', true);
    try {
      const res = await apiClient.get<PaginatedResponse<Report>>('/admin/reports');
      if (res.success && res.data) {
        const items = Array.isArray(res.data) ? res.data : res.data.items || [];
        setReports(items);
      }
    } catch {
      toast.error('加载举报列表失败');
    } finally {
      if (showLoading) setTabLoadingState('reports', false);
    }
  };

  const loadHomeConfig = async (showLoading = false) => {
    if (showLoading) setTabLoadingState('home', true);
    try {
      const [configRes, promptsRes, bannersRes] = await Promise.all([
        apiClient.get<HomeConfig>('/admin/home-config'),
        apiClient.get<PaginatedResponse<Prompt>>('/prompts?pageSize=100'),
        apiClient.get<Banner[]>('/admin/banners'),
      ]);

      if (configRes.success && configRes.data) {
        setHomeConfig(configRes.data);
      }
      if (promptsRes.success && promptsRes.data) {
        const items = Array.isArray(promptsRes.data) ? promptsRes.data : promptsRes.data.items || [];
        setAllPrompts(items);
      }
      if (bannersRes.success && bannersRes.data) {
        setBanners(Array.isArray(bannersRes.data) ? bannersRes.data : []);
      }
    } catch {
      toast.error('加载首页配置失败');
    } finally {
      if (showLoading) setTabLoadingState('home', false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'admin') {
      navigate('/');
      toast.error('无权访问管理后台');
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      setTabLoading({
        content: true,
        tags: true,
        reports: true,
        home: true,
      });
      await Promise.all([
        loadStats(),
        loadPendingPrompts(),
        loadTags(),
        loadReports(),
        loadHomeConfig(),
      ]);
      setTabLoading({
        content: false,
        tags: false,
        reports: false,
        home: false,
      });
      setIsLoading(false);
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAuthenticated, navigate]);

  useEffect(() => {
    if (user?.role !== 'admin') return;

    switch (activeTab) {
      case 'content':
        loadPendingPrompts(true);
        break;
      case 'tags':
        loadTags(true);
        break;
      case 'reports':
        loadReports(true);
        break;
      case 'home':
        loadHomeConfig(true);
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user]);

  const handleApprove = async (promptId: number) => {
    try {
      const res = await apiClient.post(`/admin/prompts/${promptId}/approve`);
      if (res.success) {
        const approved = pendingPrompts.find((p) => p.id === promptId);
        setPendingPrompts(pendingPrompts.filter((p) => p.id !== promptId));
        setStats((s) => ({ ...s, pendingCount: Math.max(0, s.pendingCount - 1) }));
        if (approved) {
          setAllPrompts((prev) => [
            { ...approved, status: 'approved' },
            ...prev.filter((p) => p.id !== promptId),
          ]);
        }
        toast.success('审核通过');
      }
    } catch {
      toast.error('操作失败');
    }
  };

  const handleReject = async () => {
    if (!rejectPromptId || !rejectReason.trim()) {
      toast.error('请填写拒绝原因');
      return;
    }
    try {
      const res = await apiClient.post(
        `/admin/prompts/${rejectPromptId}/reject`,
        { reason: rejectReason }
      );
      if (res.success) {
        setPendingPrompts(
          pendingPrompts.filter((p) => p.id !== rejectPromptId)
        );
        setStats((s) => ({ ...s, pendingCount: Math.max(0, s.pendingCount - 1) }));
        toast.success('已拒绝');
        setShowRejectModal(false);
        setRejectPromptId(null);
        setRejectReason('');
      }
    } catch {
      toast.error('操作失败');
    }
  };

  const handleSaveTag = async () => {
    if (!tagForm.name.trim()) {
      toast.error('请输入标签名称');
      return;
    }

    try {
      let res: ApiResponse<Tag>;
      if (editingTag) {
        res = await apiClient.put(`/admin/tags/${editingTag.id}`, tagForm);
      } else {
        res = await apiClient.post('/admin/tags', tagForm);
      }

      if (res.success) {
        loadTags();
        setShowTagModal(false);
        setEditingTag(null);
        setTagForm({ name: '', category: 'purpose', color: '#F59E0B' });
        toast.success(editingTag ? '标签更新成功' : '标签创建成功');
      }
    } catch {
      toast.error('操作失败');
    }
  };

  const handleDeleteTag = async (tagId: number) => {
    if (!confirm('确定要删除这个标签吗？')) return;
    try {
      const res = await apiClient.delete(`/admin/tags/${tagId}`);
      if (res.success) {
        loadTags();
        toast.success('标签已删除');
      }
    } catch {
      toast.error('删除失败');
    }
  };

  const handleResolveReport = async (reportId: number, action: 'resolve' | 'reject') => {
    try {
      const report = reports.find((r) => r.id === reportId);
      const res = await apiClient.post(`/admin/reports/${reportId}/${action}`);
      if (res.success) {
        const newStatus = action === 'resolve' ? 'resolved' : 'rejected';
        setReports((prev) =>
          prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
        );
        if (report && report.status === 'pending') {
          setStats((s) => ({ ...s, reportsCount: Math.max(0, s.reportsCount - 1) }));
        }
        toast.success(action === 'resolve' ? '已处理举报' : '已驳回举报');
      }
    } catch {
      toast.error('操作失败');
    }
  };

  const handleRemoveContent = async (promptId: number) => {
    if (!confirm('确定要下架这个提示词吗？')) return;
    try {
      const relatedReports = reports.filter(
        (r) => r.promptId === promptId && r.status === 'pending'
      );
      const res = await apiClient.post(`/admin/prompts/${promptId}/remove`);
      if (res.success) {
        setReports((prev) =>
          prev.map((r) =>
            r.promptId === promptId ? { ...r, status: 'resolved' } : r
          )
        );
        if (relatedReports.length > 0) {
          setStats((s) => ({
            ...s,
            reportsCount: Math.max(0, s.reportsCount - relatedReports.length),
          }));
        }
        setAllPrompts((prev) =>
          prev.map((p) => (p.id === promptId ? { ...p, status: 'removed' } : p))
        );
        toast.success('内容已下架');
      }
    } catch {
      toast.error('操作失败');
    }
  };

  const handleSaveBanner = async () => {
    if (!bannerForm.title.trim() || !bannerForm.imageUrl.trim()) {
      toast.error('请填写完整的横幅信息');
      return;
    }

    try {
      let res: ApiResponse<Banner>;
      if (editingBanner) {
        res = await apiClient.put(`/admin/banners/${editingBanner.id}`, bannerForm);
      } else {
        res = await apiClient.post('/admin/banners', bannerForm);
      }

      if (res.success) {
        loadHomeConfig();
        setShowBannerModal(false);
        setEditingBanner(null);
        setBannerForm({ title: '', description: '', imageUrl: '', linkUrl: '' });
        toast.success(editingBanner ? '横幅更新成功' : '横幅创建成功');
      }
    } catch {
      toast.error('操作失败');
    }
  };

  const handleDeleteBanner = async (bannerId: number) => {
    if (!confirm('确定要删除这个横幅吗？')) return;
    try {
      const res = await apiClient.delete(`/admin/banners/${bannerId}`);
      if (res.success) {
        loadHomeConfig();
        toast.success('横幅已删除');
      }
    } catch {
      toast.error('删除失败');
    }
  };

  const handleToggleFeatured = async (promptId: number) => {
    try {
      const prompt = allPrompts.find((p) => p.id === promptId);
      if (!prompt) return;

      const newIsFeatured = !prompt.isFeatured;
      const res = await apiClient.put(`/admin/prompts/${promptId}`, {
        isFeatured: newIsFeatured,
      });

      if (res.success) {
        setAllPrompts((prev) =>
          prev.map((p) =>
            p.id === promptId ? { ...p, isFeatured: newIsFeatured } : p
          )
        );
        setHomeConfig((prev) => {
          if (!prev) return prev;
          const featuredPrompts = newIsFeatured
            ? [...prev.featuredPrompts, promptId]
            : prev.featuredPrompts.filter((id) => id !== promptId);
          return { ...prev, featuredPrompts };
        });
        toast.success(
          newIsFeatured ? '已设为精选' : '已取消精选'
        );
      }
    } catch {
      toast.error('操作失败');
    }
  };

  const openTagModal = (tag?: Tag) => {
    if (tag) {
      setEditingTag(tag);
      setTagForm({
        name: tag.name,
        category: tag.category,
        color: tag.color,
      });
    } else {
      setEditingTag(null);
      setTagForm({ name: '', category: 'purpose', color: '#F59E0B' });
    }
    setShowTagModal(true);
  };

  const openBannerModal = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      setBannerForm({
        title: banner.title,
        description: banner.description,
        imageUrl: banner.imageUrl,
        linkUrl: banner.linkUrl,
      });
    } else {
      setEditingBanner(null);
      setBannerForm({ title: '', description: '', imageUrl: '', linkUrl: '' });
    }
    setShowBannerModal(true);
  };

  if (!isAuthenticated || !user || user.role !== 'admin') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  const featuredCount = homeConfig?.featuredPrompts?.length || allPrompts.filter((p) => p.isFeatured).length;

  const statCards = [
    {
      label: '待审核',
      value: stats.pendingCount,
      icon: Clock,
      color: 'bg-amber-500/10 text-amber-600',
    },
    {
      label: '待处理举报',
      value: stats.reportsCount,
      icon: AlertTriangle,
      color: 'bg-vermilion-500/10 text-vermilion-600',
    },
    {
      label: '总用户数',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-ink-100 text-ink-600',
    },
    {
      label: '总提示词数',
      value: stats.totalPrompts,
      icon: FileText,
      color: 'bg-moss-500/10 text-moss-600',
    },
  ];

  const renderTabLoading = () => (
    <div className="p-12 text-center">
      <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-4" />
      <p className="text-ink-500">加载中...</p>
    </div>
  );

  return (
    <div className="min-h-screen pt-20 pb-12 bg-cream-100">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-cream-50 rounded-xl border border-ink-100 shadow-card overflow-hidden sticky top-24">
              <div className="p-4 border-b border-ink-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-cream-50" />
                  </div>
                  <div>
                    <h2 className="font-display font-semibold text-ink-900">
                      管理后台
                    </h2>
                    <p className="text-xs text-ink-500">管理员</p>
                  </div>
                </div>
              </div>

              <nav className="p-2">
                {(Object.keys(tabConfig) as AdminTab[]).map((tab) => {
                  const config = tabConfig[tab];
                  const Icon = config.icon;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors mb-1',
                        activeTab === tab
                          ? config.color
                          : 'text-ink-700 hover:bg-ink-100'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{config.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {statCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <div
                    key={index}
                    className="bg-cream-50 rounded-xl border border-ink-100 shadow-card p-5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center',
                          card.color
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <TrendingUp className="w-4 h-4 text-moss-500" />
                    </div>
                    <p className="font-display text-2xl font-bold text-ink-900">
                      {formatNumber(card.value)}
                    </p>
                    <p className="text-sm text-ink-500">{card.label}</p>
                  </div>
                );
              })}
            </div>

            {/* Content Tab */}
            {activeTab === 'content' && (
              <div className="bg-cream-50 rounded-xl border border-ink-100 shadow-card overflow-hidden">
                <div className="p-4 border-b border-ink-100">
                  <h3 className="font-display text-lg font-semibold text-ink-900">
                    待审核内容
                  </h3>
                </div>

                {tabLoading.content ? (
                  renderTabLoading()
                ) : pendingPrompts.length === 0 ? (
                  <div className="p-12 text-center">
                    <CheckCircle2 className="w-16 h-16 text-moss-500 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-ink-900 mb-2 font-display">
                      暂无待审核内容
                    </h4>
                    <p className="text-ink-500">所有内容都已审核完毕</p>
                  </div>
                ) : (
                  <div className="divide-y divide-ink-100">
                    {pendingPrompts.map((prompt) => (
                      <div key={prompt.id} className="p-4 hover:bg-ink-50/50 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-ink-900 truncate">
                                {prompt.title}
                              </h4>
                              <span className="px-2 py-0.5 bg-amber-500/10 text-amber-700 text-xs font-medium rounded-md">
                                待审核
                              </span>
                            </div>
                            <p className="text-sm text-ink-600 line-clamp-2 mb-3">
                              {prompt.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-ink-500">
                              <span>作者: {prompt.author?.username}</span>
                              <span>创建于: {formatDate(prompt.createdAt)}</span>
                              <span>难度: {prompt.difficulty}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate(`/prompt/${prompt.id}`)}
                              className="p-2 text-ink-500 hover:text-ink-700 hover:bg-ink-100 rounded-lg transition-colors"
                              title="查看详情"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleApprove(prompt.id)}
                              className="p-2 text-moss-600 hover:text-moss-700 hover:bg-moss-500/10 rounded-lg transition-colors"
                              title="通过审核"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setRejectPromptId(prompt.id);
                                setShowRejectModal(true);
                              }}
                              className="p-2 text-vermilion-500 hover:text-vermilion-600 hover:bg-vermilion-500/10 rounded-lg transition-colors"
                              title="拒绝"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tags Tab */}
            {activeTab === 'tags' && (
              <div className="bg-cream-50 rounded-xl border border-ink-100 shadow-card overflow-hidden">
                <div className="p-4 border-b border-ink-100 flex items-center justify-between">
                  <h3 className="font-display text-lg font-semibold text-ink-900">
                    标签管理
                  </h3>
                  <button
                    onClick={() => openTagModal()}
                    className="btn-primary bg-amber-500 text-cream-50 text-sm py-2"
                  >
                    <Plus className="w-4 h-4" />
                    新建标签
                  </button>
                </div>

                {tabLoading.tags ? (
                  renderTabLoading()
                ) : (
                  <div className="p-4">
                    {(['purpose', 'model', 'language', 'difficulty'] as const).map(
                      (category) => {
                        const tags = allTags.filter((t) => t.category === category);
                        return (
                          <div key={category} className="mb-6 last:mb-0">
                            <h4 className="text-sm font-medium text-ink-700 mb-3">
                              {CATEGORY_LABELS[category]}
                            </h4>
                            {tags.length === 0 ? (
                              <p className="text-sm text-ink-500">暂无标签</p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {tags.map((tag) => (
                                  <div
                                    key={tag.id}
                                    className="flex items-center justify-between p-3 bg-cream-100 rounded-lg group hover:bg-ink-100 transition-colors"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: tag.color }}
                                      />
                                      <span className="font-medium text-ink-900">
                                        {tag.name}
                                      </span>
                                      <span className="text-xs text-ink-500">
                                        ({tag.promptCount})
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => openTagModal(tag)}
                                        className="p-1.5 text-ink-500 hover:text-amber-600 hover:bg-amber-500/10 rounded-md transition-colors"
                                      >
                                        <Edit3 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteTag(tag.id)}
                                        className="p-1.5 text-ink-500 hover:text-vermilion-500 hover:bg-vermilion-500/10 rounded-md transition-colors"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="bg-cream-50 rounded-xl border border-ink-100 shadow-card overflow-hidden">
                <div className="p-4 border-b border-ink-100">
                  <h3 className="font-display text-lg font-semibold text-ink-900">
                    举报处理
                  </h3>
                </div>

                {tabLoading.reports ? (
                  renderTabLoading()
                ) : reports.length === 0 ? (
                  <div className="p-12 text-center">
                    <CheckCircle2 className="w-16 h-16 text-moss-500 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-ink-900 mb-2 font-display">
                      暂无举报
                    </h4>
                    <p className="text-ink-500">当前没有需要处理的举报</p>
                  </div>
                ) : (
                  <div className="divide-y divide-ink-100">
                    {reports.map((report) => {
                      const reasonLabel = REPORT_REASONS.find(
                        (r) => r.value === report.reason
                      )?.label;
                      const status = reportStatusConfig[report.status];
                      return (
                        <div key={report.id} className="p-4 hover:bg-ink-50/50 transition-colors">
                          <div className="flex items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <AlertCircle className="w-5 h-5 text-vermilion-500" />
                                <span className="font-medium text-ink-900">
                                  {reasonLabel}
                                </span>
                                <span
                                  className={cn(
                                    'px-2 py-0.5 text-xs font-medium rounded-md border',
                                    status.color
                                  )}
                                >
                                  {status.label}
                                </span>
                              </div>
                              <p className="text-sm text-ink-600 mb-3">
                                {report.description}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-ink-500">
                                <span>
                                  举报用户 ID: {report.reporterId}
                                </span>
                                <span>
                                  举报时间: {formatDate(report.createdAt)}
                                </span>
                                <span>
                                  提示词 ID: {report.promptId}
                                </span>
                              </div>
                            </div>

                            {report.status === 'pending' && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => navigate(`/prompt/${report.promptId}`)}
                                  className="p-2 text-ink-500 hover:text-ink-700 hover:bg-ink-100 rounded-lg transition-colors"
                                  title="查看内容"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleRemoveContent(report.promptId)}
                                  className="p-2 text-vermilion-500 hover:text-vermilion-600 hover:bg-vermilion-500/10 rounded-lg transition-colors"
                                  title="下架内容"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleResolveReport(report.id, 'resolve')}
                                  className="p-2 text-moss-600 hover:text-moss-700 hover:bg-moss-500/10 rounded-lg transition-colors"
                                  title="标记已解决"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleResolveReport(report.id, 'reject')}
                                  className="p-2 text-ink-500 hover:text-ink-700 hover:bg-ink-100 rounded-lg transition-colors"
                                  title="驳回举报"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Home Config Tab */}
            {activeTab === 'home' && (
              <div className="space-y-6">
                {/* Featured Prompts */}
                <div className="bg-cream-50 rounded-xl border border-ink-100 shadow-card overflow-hidden">
                  <div className="p-4 border-b border-ink-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-ink-900">
                        精选提示词
                      </h3>
                      <p className="text-sm text-ink-500 mt-0.5">
                        已选择 {featuredCount} 个精选提示词
                      </p>
                    </div>
                  </div>

                  {tabLoading.home ? (
                    renderTabLoading()
                  ) : allPrompts.length === 0 ? (
                    <div className="p-12 text-center">
                      <FileText className="w-16 h-16 text-ink-300 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-ink-900 mb-2 font-display">
                        暂无提示词
                      </h4>
                      <p className="text-ink-500">当前没有可设置的提示词</p>
                    </div>
                  ) : (
                    <div className="p-4">
                      <div className="space-y-3">
                        {allPrompts.slice(0, 20).map((prompt) => {
                          const isFeatured = prompt.isFeatured || homeConfig?.featuredPrompts?.includes(prompt.id);
                          return (
                            <div
                              key={prompt.id}
                              className="flex items-center justify-between p-3 bg-cream-100 rounded-lg hover:bg-ink-100 transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3">
                                  <span className="font-medium text-ink-900 truncate">
                                    {prompt.title}
                                  </span>
                                  {isFeatured && (
                                    <span className="px-2 py-0.5 bg-amber-500 text-cream-50 text-xs font-medium rounded-md flex items-center gap-1">
                                      <Star className="w-3 h-3" />
                                      精选
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-ink-500">
                                  {prompt.author?.username} · {formatNumber(prompt.viewCount)} 浏览
                                </span>
                              </div>

                              <button
                                onClick={() => handleToggleFeatured(prompt.id)}
                                className={cn(
                                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                                  isFeatured
                                    ? 'bg-amber-500 text-cream-50 hover:bg-amber-600'
                                    : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
                                )}
                              >
                                <Star
                                  className={cn(
                                    'w-4 h-4 inline mr-1',
                                    isFeatured && 'fill-current'
                                  )}
                                />
                                {isFeatured ? '取消精选' : '设为精选'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Banners */}
                <div className="bg-cream-50 rounded-xl border border-ink-100 shadow-card overflow-hidden">
                  <div className="p-4 border-b border-ink-100 flex items-center justify-between">
                    <h3 className="font-display text-lg font-semibold text-ink-900">
                      横幅管理
                    </h3>
                    <button
                      onClick={() => openBannerModal()}
                      className="btn-primary bg-amber-500 text-cream-50 text-sm py-2"
                    >
                      <Plus className="w-4 h-4" />
                      新建横幅
                    </button>
                  </div>

                  {tabLoading.home ? (
                    renderTabLoading()
                  ) : banners.length === 0 ? (
                    <div className="p-8 text-center">
                      <Image className="w-12 h-12 text-ink-300 mx-auto mb-3" />
                      <p className="text-ink-500">暂无横幅，点击上方按钮创建</p>
                    </div>
                  ) : (
                    <div className="p-4">
                      <div className="space-y-4">
                        {banners.map((banner) => (
                          <div
                            key={banner.id}
                            className="flex items-start gap-4 p-4 bg-cream-100 rounded-lg hover:bg-ink-100 transition-colors"
                          >
                            <img
                              src={banner.imageUrl}
                              alt={banner.title}
                              className="w-32 h-20 object-cover rounded-lg"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-ink-900 mb-1">
                                {banner.title}
                              </h4>
                              <p className="text-sm text-ink-600 mb-2">
                                {banner.description}
                              </p>
                              <p className="text-xs text-ink-500 truncate">
                                链接: {banner.linkUrl}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openBannerModal(banner)}
                                className="p-2 text-ink-500 hover:text-amber-600 hover:bg-amber-500/10 rounded-lg transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteBanner(banner.id)}
                                className="p-2 text-ink-500 hover:text-vermilion-500 hover:bg-vermilion-500/10 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Tag Modal */}
      <Modal
        isOpen={showTagModal}
        onClose={() => {
          setShowTagModal(false);
          setEditingTag(null);
        }}
        title={editingTag ? '编辑标签' : '新建标签'}
        footer={
          <>
            <button
              onClick={() => {
                setShowTagModal(false);
                setEditingTag(null);
              }}
              className="btn-ghost"
            >
              取消
            </button>
            <button
              onClick={handleSaveTag}
              className="btn-primary bg-amber-500 text-cream-50"
            >
              {editingTag ? '保存' : '创建'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">
              标签名称
            </label>
            <input
              type="text"
              value={tagForm.name}
              onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })}
              placeholder="输入标签名称"
              className="input-field"
              maxLength={20}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">
              分类
            </label>
            <select
              value={tagForm.category}
              onChange={(e) =>
                setTagForm({
                  ...tagForm,
                  category: e.target.value as Tag['category'],
                })
              }
              className="input-field"
            >
              {(['purpose', 'model', 'language', 'difficulty'] as const).map(
                (cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">
              颜色
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={tagForm.color}
                onChange={(e) =>
                  setTagForm({ ...tagForm, color: e.target.value })
                }
                className="w-12 h-12 rounded-lg cursor-pointer border-2 border-ink-200"
              />
              <input
                type="text"
                value={tagForm.color}
                onChange={(e) =>
                  setTagForm({ ...tagForm, color: e.target.value })
                }
                placeholder="#F59E0B"
                className="input-field flex-1"
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRejectPromptId(null);
          setRejectReason('');
        }}
        title="拒绝审核"
        footer={
          <>
            <button
              onClick={() => {
                setShowRejectModal(false);
                setRejectPromptId(null);
                setRejectReason('');
              }}
              className="btn-ghost"
            >
              取消
            </button>
            <button
              onClick={handleReject}
              className="btn-primary bg-vermilion-500 text-cream-50 hover:bg-vermilion-600"
            >
              确认拒绝
            </button>
          </>
        }
      >
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-2">
            拒绝原因
          </label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="请输入拒绝原因，将反馈给作者..."
            className="input-field resize-none"
            rows={4}
          />
        </div>
      </Modal>

      {/* Banner Modal */}
      <Modal
        isOpen={showBannerModal}
        onClose={() => {
          setShowBannerModal(false);
          setEditingBanner(null);
        }}
        title={editingBanner ? '编辑横幅' : '新建横幅'}
        size="lg"
        footer={
          <>
            <button
              onClick={() => {
                setShowBannerModal(false);
                setEditingBanner(null);
              }}
              className="btn-ghost"
            >
              取消
            </button>
            <button
              onClick={handleSaveBanner}
              className="btn-primary bg-amber-500 text-cream-50"
            >
              {editingBanner ? '保存' : '创建'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">
              标题
            </label>
            <input
              type="text"
              value={bannerForm.title}
              onChange={(e) =>
                setBannerForm({ ...bannerForm, title: e.target.value })
              }
              placeholder="输入横幅标题"
              className="input-field"
              maxLength={50}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">
              描述
            </label>
            <textarea
              value={bannerForm.description}
              onChange={(e) =>
                setBannerForm({ ...bannerForm, description: e.target.value })
              }
              placeholder="输入横幅描述"
              className="input-field resize-none"
              rows={2}
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">
              图片链接
            </label>
            <input
              type="text"
              value={bannerForm.imageUrl}
              onChange={(e) =>
                setBannerForm({ ...bannerForm, imageUrl: e.target.value })
              }
              placeholder="https://example.com/image.jpg"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">
              跳转链接
            </label>
            <input
              type="text"
              value={bannerForm.linkUrl}
              onChange={(e) =>
                setBannerForm({ ...bannerForm, linkUrl: e.target.value })
              }
              placeholder="https://example.com"
              className="input-field"
            />
          </div>

          {bannerForm.imageUrl && (
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                预览
              </label>
              <img
                src={bannerForm.imageUrl}
                alt="Preview"
                className="w-full h-32 object-cover rounded-lg"
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
