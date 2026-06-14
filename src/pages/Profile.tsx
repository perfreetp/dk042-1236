import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  Users,
  UserPlus,
  UserCheck,
  FileText,
  Edit3,
  Calendar,
  Award,
  Settings,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/lib/apiClient';
import { formatDate, formatNumber } from '@/utils/formatters';
import PromptCard from '@/components/PromptCard';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import type {
  User as UserType,
  Prompt,
  Favorite,
  PaginatedResponse,
} from '../../shared/types';

type TabType = 'prompts' | 'favorites' | 'following' | 'followers';

const roleConfig: Record<UserType['role'], { label: string; color: string }> = {
  user: { label: '普通用户', color: 'bg-ink-100 text-ink-700' },
  author: { label: '创作者', color: 'bg-amber-500/10 text-amber-700' },
  admin: { label: '管理员', color: 'bg-moss-500/10 text-moss-700' },
};

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const { toast } = useToast();

  const [profile, setProfile] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('prompts');
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [following, setFollowing] = useState<UserType[]>([]);
  const [followers, setFollowers] = useState<UserType[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    bio: '',
    avatar: '',
  });
  const [tabLoading, setTabLoading] = useState(false);

  const isOwnProfile =
    currentUser && profile && currentUser.id === profile.id;

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const userId = id ? parseInt(id) : currentUser?.id;
      if (!userId) {
        navigate('/login');
        return;
      }

      const response = await apiClient.get<UserType>(`/users/${userId}`);
      if (response.success && response.data) {
        setProfile(response.data);
        setEditForm({
          username: response.data.username,
          bio: response.data.bio,
          avatar: response.data.avatar,
        });

        if (currentUser && currentUser.id !== userId) {
          const followRes = await apiClient.get<{ isFollowing: boolean }>(
            `/follow/check/${userId}`
          );
          if (followRes.success && followRes.data) {
            setIsFollowing(followRes.data.isFollowing);
          }
        }
      }
    } catch {
      toast.error('加载用户信息失败');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTabContent = async (tab: TabType) => {
    if (!profile) return;
    setTabLoading(true);
    try {
      switch (tab) {
        case 'prompts': {
          const res = await apiClient.get<PaginatedResponse<Prompt>>(
            `/prompts?authorId=${profile.id}&status=approved&pageSize=100`
          );
          if (res.success && res.data) {
            setPrompts(res.data.items);
          }
          break;
        }
        case 'favorites': {
          const res = await apiClient.get<Favorite[]>(
            `/favorites?userId=${profile.id}`
          );
          if (res.success && res.data) {
            setFavorites(res.data);
          }
          break;
        }
        case 'following': {
          const res = await apiClient.get<UserType[]>(
            `/follow/following/${profile.id}`
          );
          if (res.success && res.data) {
            setFollowing(res.data);
          }
          break;
        }
        case 'followers': {
          const res = await apiClient.get<UserType[]>(
            `/follow/followers/${profile.id}`
          );
          if (res.success && res.data) {
            setFollowers(res.data);
          }
          break;
        }
      }
    } catch {
      toast.error('加载数据失败');
    } finally {
      setTabLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, currentUser]);

  useEffect(() => {
    if (profile) {
      loadTabContent(activeTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, profile]);

  const handleFollow = async () => {
    if (!profile || !isAuthenticated) {
      navigate('/login');
      return;
    }
    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        await apiClient.delete(`/follow/${profile.id}`);
        setIsFollowing(false);
        setProfile((prev) =>
          prev
            ? { ...prev, followerCount: prev.followerCount - 1 }
            : null
        );
        toast.success('已取消关注');
      } else {
        await apiClient.post(`/follow/${profile.id}`);
        setIsFollowing(true);
        setProfile((prev) =>
          prev
            ? { ...prev, followerCount: prev.followerCount + 1 }
            : null
        );
        toast.success('关注成功');
      }
    } catch {
      toast.error('操作失败');
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editForm.username.trim()) {
      toast.error('用户名不能为空');
      return;
    }
    try {
      const response = await apiClient.put<UserType>('/auth/profile', editForm);
      if (response.success && response.data) {
        setProfile(response.data);
        useAuthStore.getState().fetchProfile();
        setShowEditModal(false);
        toast.success('资料更新成功');
      } else {
        toast.error(response.error || '更新失败');
      }
    } catch {
      toast.error('更新失败');
    }
  };

  const tabs = [
    { id: 'prompts' as TabType, label: '发布的提示词', icon: FileText, count: profile?.followerCount || 0 },
    { id: 'favorites' as TabType, label: '收藏', icon: Heart, count: profile?.followerCount || 0 },
    { id: 'following' as TabType, label: '关注', icon: UserPlus, count: profile?.followingCount || 0 },
    { id: 'followers' as TabType, label: '粉丝', icon: Users, count: profile?.followerCount || 0 },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen pt-20 pb-12">
        <div className="container mx-auto px-4">
          <EmptyState
            variant="no-results"
            action={{ label: '返回首页', href: '/' }}
          />
        </div>
      </div>
    );
  }

  const role = roleConfig[profile.role];

  return (
    <div className="min-h-screen pt-20 pb-12 bg-cream-100">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-amber-500/10 via-cream-50 to-cream-100 border-b border-ink-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="relative">
              <img
                src={profile.avatar}
                alt={profile.username}
                className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover border-4 border-cream-50 shadow-card"
              />
              <div
                className={cn(
                  'absolute -bottom-2 -right-2 px-2 py-1 rounded-full text-xs font-medium border-2 border-cream-50',
                  role.color
                )}
              >
                {role.label}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="font-display text-2xl md:text-3xl font-bold text-ink-900">
                  {profile.username}
                </h1>
                {profile.role === 'admin' && (
                  <Award className="w-5 h-5 text-amber-500" />
                )}
              </div>

              <p className="text-ink-600 mb-4 max-w-2xl">
                {profile.bio || '这个人很懒，什么都没有留下~'}
              </p>

              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-ink-500">
                  <Calendar className="w-4 h-4" />
                  <span>加入于 {formatDate(profile.createdAt)}</span>
                </div>
              </div>

              <div className="flex items-center gap-8 mt-4">
                <div className="text-center">
                  <p className="font-display text-2xl font-bold text-ink-900">
                    {formatNumber(prompts.length)}
                  </p>
                  <p className="text-sm text-ink-500">提示词</p>
                </div>
                <div className="text-center">
                  <p className="font-display text-2xl font-bold text-ink-900">
                    {formatNumber(profile.followerCount)}
                  </p>
                  <p className="text-sm text-ink-500">粉丝</p>
                </div>
                <div className="text-center">
                  <p className="font-display text-2xl font-bold text-ink-900">
                    {formatNumber(profile.followingCount)}
                  </p>
                  <p className="text-sm text-ink-500">关注</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isOwnProfile ? (
                <>
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="btn-secondary"
                  >
                    <Edit3 className="w-4 h-4" />
                    编辑资料
                  </button>
                  <Link
                    to="/my-prompts"
                    className="btn-ghost"
                  >
                    <Settings className="w-4 h-4" />
                    管理
                  </Link>
                </>
              ) : (
                <button
                  onClick={handleFollow}
                  disabled={isFollowLoading}
                  className={cn(
                    'btn-primary',
                    isFollowing
                      ? 'bg-ink-100 text-ink-700 hover:bg-ink-200'
                      : 'bg-amber-500 text-cream-50 hover:bg-amber-600'
                  )}
                >
                  {isFollowLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isFollowing ? (
                    <UserCheck className="w-4 h-4" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  {isFollowing ? '已关注' : '关注'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 mt-6">
        <div className="bg-cream-50 rounded-xl border border-ink-100 shadow-card overflow-hidden">
          <div className="flex border-b border-ink-100 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap border-b-2 -mb-px',
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

          {/* Tab Content */}
          <div className="p-6">
            {tabLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-64 bg-cream-50 rounded-xl border border-ink-100 animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <>
                {activeTab === 'prompts' && (
                  <>
                    {prompts.length === 0 ? (
                      <EmptyState
                        variant="no-prompts"
                        action={
                          isOwnProfile
                            ? {
                                label: '创建提示词',
                                href: '/prompts/new',
                              }
                            : undefined
                        }
                      />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-stagger">
                        {prompts.map((prompt) => (
                          <PromptCard
                            key={prompt.id}
                            prompt={prompt}
                            onCopy={() => {}}
                            onFavorite={() => {}}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'favorites' && (
                  <>
                    {favorites.length === 0 ? (
                      <EmptyState variant="no-favorites" />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-stagger">
                        {favorites.map((fav) => (
                          <PromptCard
                            key={fav.id}
                            prompt={fav.prompt}
                            isFavorited={true}
                            onCopy={() => {}}
                            onFavorite={() => {}}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}

                {(activeTab === 'following' || activeTab === 'followers') && (
                  <>
                    {(activeTab === 'following'
                      ? following.length
                      : followers.length) === 0 ? (
                      <div className="text-center py-16">
                        <Users className="w-16 h-16 text-ink-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-ink-900 mb-2 font-display">
                          {activeTab === 'following'
                            ? '还没有关注的人'
                            : '还没有粉丝'}
                        </h3>
                        <p className="text-ink-500">
                          {activeTab === 'following'
                            ? '去发现更多优质创作者吧'
                            : '分享你的作品，获得更多关注'}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-stagger">
                        {(
                          activeTab === 'following'
                            ? following
                            : followers
                        ).map((user) => (
                          <Link
                            key={user.id}
                            to={`/profile/${user.id}`}
                            className="flex items-center gap-4 p-4 bg-cream-50 rounded-xl border border-ink-100 hover:border-amber-300 hover:shadow-card-hover transition-all group"
                          >
                            <img
                              src={user.avatar}
                              alt={user.username}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-ink-900 truncate group-hover:text-amber-600 transition-colors">
                                {user.username}
                              </p>
                              <p className="text-sm text-ink-500 truncate">
                                {user.bio || '暂无简介'}
                              </p>
                            </div>
                            <div
                              className={cn(
                                'px-2 py-1 rounded-full text-xs font-medium',
                                roleConfig[user.role].color
                              )}
                            >
                              {roleConfig[user.role].label}
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="编辑个人资料"
        footer={
          <>
            <button
              onClick={() => setShowEditModal(false)}
              className="btn-ghost"
            >
              取消
            </button>
            <button
              onClick={handleSaveProfile}
              className="btn-primary bg-amber-500 text-cream-50"
            >
              保存
            </button>
          </>
        }
        size="lg"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <img
                src={editForm.avatar || profile.avatar}
                alt="Avatar"
                className="w-20 h-20 rounded-xl object-cover border-2 border-ink-200"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-ink-700 mb-2">
                头像链接
              </label>
              <input
                type="text"
                value={editForm.avatar}
                onChange={(e) =>
                  setEditForm({ ...editForm, avatar: e.target.value })
                }
                placeholder="输入头像图片链接"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">
              用户名
            </label>
            <input
              type="text"
              value={editForm.username}
              onChange={(e) =>
                setEditForm({ ...editForm, username: e.target.value })
              }
              placeholder="输入用户名"
              className="input-field"
              maxLength={20}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">
              个人简介
            </label>
            <textarea
              value={editForm.bio}
              onChange={(e) =>
                setEditForm({ ...editForm, bio: e.target.value })
              }
              placeholder="介绍一下自己吧"
              className="input-field resize-none"
              rows={4}
              maxLength={200}
            />
            <p className="text-right text-sm text-ink-400 mt-1">
              {editForm.bio.length}/200
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
