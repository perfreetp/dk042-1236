import { useState, useEffect } from 'react';
import {
  Heart,
  Plus,
  Search,
  Trash2,
  FolderPlus,
  CheckSquare,
  Square,
  GripVertical,
  X,
  Folder,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/lib/apiClient';
import PromptCard from '@/components/PromptCard';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import type {
  Favorite,
  FavoriteGroup,
} from '../../shared/types';

export default function Favorites() {
  const { user, isAuthenticated } = useAuthStore();
  const { toast } = useToast();
  const [groups, setGroups] = useState<FavoriteGroup[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [targetGroupId, setTargetGroupId] = useState<number | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [groupsRes, favsRes] = await Promise.all([
        apiClient.get<FavoriteGroup[]>(`/favorites/groups`),
        apiClient.get<Favorite[]>(
          selectedGroupId
            ? `/favorites?groupId=${selectedGroupId}`
            : '/favorites'
        ),
      ]);

      if (groupsRes.success && groupsRes.data) {
        setGroups(groupsRes.data);
      }
      if (favsRes.success && favsRes.data) {
        setFavorites(favsRes.data);
      }
    } catch {
      toast.error('加载收藏失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroupId, user, isAuthenticated]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error('请输入分组名称');
      return;
    }
    try {
      const response = await apiClient.post<FavoriteGroup>('/favorites/groups', {
        name: newGroupName.trim(),
      });
      if (response.success && response.data) {
        setGroups([...groups, response.data]);
        setShowNewGroupModal(false);
        setNewGroupName('');
        toast.success('分组创建成功');
      } else {
        toast.error(response.error || '创建失败');
      }
    } catch {
      toast.error('创建失败，请稍后重试');
    }
  };

  const handleDeleteGroup = async (groupId: number) => {
    try {
      const response = await apiClient.delete(`/favorites/groups/${groupId}`);
      if (response.success) {
        setGroups(groups.filter((g) => g.id !== groupId));
        if (selectedGroupId === groupId) {
          setSelectedGroupId(null);
        }
        toast.success('分组删除成功');
      }
    } catch {
      toast.error('删除失败，请稍后重试');
    }
  };

  const handleToggleSelect = (favoriteId: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(favoriteId)) {
      newSelected.delete(favoriteId);
    } else {
      newSelected.add(favoriteId);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredFavorites.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredFavorites.map((f) => f.id)));
    }
  };

  const handleRemoveSelected = async () => {
    if (selectedIds.size === 0) return;
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          apiClient.delete(`/favorites/${id}`)
        )
      );
      setFavorites(favorites.filter((f) => !selectedIds.has(f.id)));
      setSelectedIds(new Set());
      setIsSelectMode(false);
      toast.success(`已移除 ${selectedIds.size} 个收藏`);
    } catch {
      toast.error('移除失败，请稍后重试');
    }
  };

  const handleMoveSelected = async () => {
    if (selectedIds.size === 0 || targetGroupId === undefined) return;
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          apiClient.put(`/favorites/${id}`, { groupId: targetGroupId })
        )
      );
      setFavorites(favorites.filter((f) => !selectedIds.has(f.id)));
      setSelectedIds(new Set());
      setIsSelectMode(false);
      setShowMoveModal(false);
      toast.success(`已移动 ${selectedIds.size} 个收藏`);
    } catch {
      toast.error('移动失败，请稍后重试');
    }
  };

  const handleRemoveFavorite = async (favoriteId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const response = await apiClient.delete(`/favorites/${favoriteId}`);
      if (response.success) {
        setFavorites(favorites.filter((f) => f.id !== favoriteId));
        toast.success('已取消收藏');
      }
    } catch {
      toast.error('取消收藏失败');
    }
  };

  const filteredFavorites = favorites.filter((fav) =>
    searchQuery.trim()
      ? fav.prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fav.prompt.description.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const currentGroup = selectedGroupId
    ? groups.find((g) => g.id === selectedGroupId)
    : null;

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen pt-20 pb-12">
        <div className="container mx-auto px-4">
          <EmptyState
            variant="no-favorites"
            action={{
              label: '登录后查看收藏',
              href: '/login',
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 bg-cream-100">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-cream-50 rounded-xl border border-ink-100 shadow-card overflow-hidden sticky top-24">
              <div className="p-4 border-b border-ink-100">
                <h2 className="font-display text-lg font-semibold text-ink-900 mb-3">
                  收藏分组
                </h2>
                <button
                  onClick={() => setShowNewGroupModal(true)}
                  className="w-full btn-primary bg-amber-500 text-cream-50 py-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  新建分组
                </button>
              </div>

              <nav className="p-2">
                <button
                  onClick={() => setSelectedGroupId(null)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors mb-1',
                    selectedGroupId === null
                      ? 'bg-amber-500/10 text-amber-700'
                      : 'text-ink-700 hover:bg-ink-100'
                  )}
                >
                  <Heart
                    className={cn(
                      'w-5 h-5',
                      selectedGroupId === null && 'fill-amber-500 text-amber-500'
                    )}
                  />
                  <span className="font-medium">全部收藏</span>
                  <span className="ml-auto text-sm text-ink-500">
                    {favorites.length}
                  </span>
                </button>

                {groups.map((group) => (
                  <div
                    key={group.id}
                    className={cn(
                      'group flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors cursor-pointer mb-1',
                      selectedGroupId === group.id
                        ? 'bg-amber-500/10 text-amber-700'
                        : 'text-ink-700 hover:bg-ink-100'
                    )}
                    onClick={() => setSelectedGroupId(group.id)}
                  >
                    <Folder
                      className={cn(
                        'w-5 h-5 flex-shrink-0',
                        selectedGroupId === group.id && 'text-amber-500'
                      )}
                    />
                    <span className="font-medium truncate flex-1">
                      {group.name}
                    </span>
                    <span className="text-sm text-ink-500 flex-shrink-0">
                      {group.promptCount}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGroup(group.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-ink-200 rounded transition-all"
                      title="删除分组"
                    >
                      <X className="w-4 h-4 text-ink-500" />
                    </button>
                  </div>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Header */}
            <div className="bg-cream-50 rounded-xl border border-ink-100 shadow-card p-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h1 className="font-display text-2xl font-bold text-ink-900">
                    {currentGroup ? currentGroup.name : '我的收藏'}
                  </h1>
                  <p className="text-ink-500 text-sm mt-1">
                    共 {filteredFavorites.length} 个提示词
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="搜索收藏..."
                      className="w-full pl-9 pr-4 py-2 bg-cream-100 border border-ink-200 rounded-lg text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                    />
                  </div>

                  <button
                    onClick={() => setIsSelectMode(!isSelectMode)}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      isSelectMode
                        ? 'bg-amber-500 text-cream-50'
                        : 'text-ink-700 hover:bg-ink-100'
                    )}
                    title="批量操作"
                  >
                    {isSelectMode ? (
                      <CheckSquare className="w-5 h-5" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Batch Actions */}
              {isSelectMode && (
                <div className="flex items-center justify-between p-3 bg-ink-100 rounded-lg animate-fade-in">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center gap-2 text-sm text-ink-700 hover:text-ink-900"
                    >
                      {selectedIds.size === filteredFavorites.length ? (
                        <CheckSquare className="w-4 h-4 text-amber-500" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                      全选
                    </button>
                    <span className="text-sm text-ink-500">
                      已选择 {selectedIds.size} 项
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowMoveModal(true)}
                      disabled={selectedIds.size === 0}
                      className="btn-ghost text-sm py-1.5 disabled:opacity-50"
                    >
                      <FolderPlus className="w-4 h-4" />
                      移动到
                    </button>
                    <button
                      onClick={handleRemoveSelected}
                      disabled={selectedIds.size === 0}
                      className="btn-ghost text-sm py-1.5 text-vermilion-500 hover:text-vermilion-600 hover:bg-vermilion-500/10 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      移除
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Favorites Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-64 bg-cream-50 rounded-xl border border-ink-100 animate-pulse"
                  />
                ))}
              </div>
            ) : filteredFavorites.length === 0 ? (
              <EmptyState
                variant={searchQuery ? 'no-results' : 'no-favorites'}
                action={
                  searchQuery
                    ? {
                        label: '清除搜索',
                        onClick: () => setSearchQuery(''),
                      }
                    : undefined
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-stagger">
                {filteredFavorites.map((fav) => (
                  <div key={fav.id} className="relative group">
                    {isSelectMode && (
                      <div className="absolute top-3 left-3 z-20">
                        <button
                          onClick={() => handleToggleSelect(fav.id)}
                          className={cn(
                            'p-1 rounded-md transition-all',
                            selectedIds.has(fav.id)
                              ? 'bg-amber-500 text-cream-50'
                              : 'bg-cream-50 text-ink-400 hover:text-ink-600 shadow-card'
                          )}
                        >
                          {selectedIds.has(fav.id) ? (
                            <CheckSquare className="w-5 h-5" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    )}

                    {isSelectMode && (
                      <div className="absolute top-3 right-3 z-20">
                        <button
                          className="p-1.5 bg-cream-50 text-ink-400 hover:text-ink-600 rounded-md shadow-card cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
                          title="拖拽排序"
                        >
                          <GripVertical className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <div className={cn(isSelectMode && 'opacity-75')}>
                      <PromptCard
                        prompt={fav.prompt}
                        isFavorited={true}
                        onCopy={() => {}}
                        onFavorite={() => {}}
                      />
                    </div>

                    {!isSelectMode && (
                      <button
                        onClick={(e) => handleRemoveFavorite(fav.id, e)}
                        className="absolute top-3 right-3 z-10 p-2 bg-cream-50 text-vermilion-500 rounded-md shadow-card opacity-0 group-hover:opacity-100 transition-opacity hover:bg-vermilion-50"
                        title="取消收藏"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* New Group Modal */}
      <Modal
        isOpen={showNewGroupModal}
        onClose={() => setShowNewGroupModal(false)}
        title="新建收藏分组"
        footer={
          <>
            <button
              onClick={() => setShowNewGroupModal(false)}
              className="btn-ghost"
            >
              取消
            </button>
            <button
              onClick={handleCreateGroup}
              className="btn-primary bg-amber-500 text-cream-50"
            >
              创建
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">
              分组名称
            </label>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="例如：工作、学习、生活"
              className="input-field"
              maxLength={20}
            />
          </div>
        </div>
      </Modal>

      {/* Move to Group Modal */}
      <Modal
        isOpen={showMoveModal}
        onClose={() => setShowMoveModal(false)}
        title={`移动 ${selectedIds.size} 个收藏到`}
        footer={
          <>
            <button
              onClick={() => setShowMoveModal(false)}
              className="btn-ghost"
            >
              取消
            </button>
            <button
              onClick={handleMoveSelected}
              disabled={targetGroupId === null}
              className="btn-primary bg-amber-500 text-cream-50 disabled:opacity-50"
            >
              移动
            </button>
          </>
        }
      >
        <div className="space-y-2">
          <button
            onClick={() => setTargetGroupId(null)}
            className={cn(
              'w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors text-left',
              targetGroupId === null
                ? 'border-amber-500 bg-amber-500/10'
                : 'border-ink-200 hover:border-ink-300'
            )}
          >
            <Heart
              className={cn(
                'w-5 h-5',
                targetGroupId === null && 'fill-amber-500 text-amber-500'
              )}
            />
            <span>全部收藏（未分组）</span>
          </button>

          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => setTargetGroupId(group.id)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors text-left',
                targetGroupId === group.id
                  ? 'border-amber-500 bg-amber-500/10'
                  : 'border-ink-200 hover:border-ink-300'
              )}
            >
              <Folder
                className={cn(
                  'w-5 h-5',
                  targetGroupId === group.id && 'text-amber-500'
                )}
              />
              <span>{group.name}</span>
              <span className="ml-auto text-sm text-ink-500">
                {group.promptCount}
              </span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
