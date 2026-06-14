import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  X,
  Eye,
  Save,
  Send,
  FileText,
  Tag as TagIcon,
  Settings,
  Lightbulb,
  BookOpen,
  GitBranch,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/lib/apiClient';
import { DIFFICULTY_OPTIONS, CATEGORY_LABELS } from '@/utils/constants';
import TagBadge from '@/components/TagBadge';
import Modal from '@/components/Modal';
import type {
  Tag,
  Prompt,
  CreatePromptRequest,
  ApiResponse,
} from '../../shared/types';

interface FormData {
  title: string;
  description: string;
  content: string;
  tagIds: number[];
  purpose: string;
  model: string;
  language: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  inputExample: string;
  outputExample: string;
  useCases: string[];
  changelog: string;
}

const initialFormData: FormData = {
  title: '',
  description: '',
  content: '',
  tagIds: [],
  purpose: '',
  model: '',
  language: '',
  difficulty: 'beginner',
  inputExample: '',
  outputExample: '',
  useCases: [''],
  changelog: '',
};

const DRAFT_STORAGE_KEY = 'prompt-draft';

export default function CreatePrompt() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();
  const { toast } = useToast();

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [forkId, setForkId] = useState<number | null>(null);

  const loadTags = async () => {
    try {
      const res = await apiClient.get<Tag[]>('/tags');
      if (res.success && res.data) {
        setAllTags(res.data);
      }
    } catch {
      toast.error('加载标签失败');
    }
  };

  const loadPrompt = async (id: number, isFork: boolean) => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<Prompt>(`/prompts/${id}`);
      if (res.success && res.data) {
        const prompt = res.data;
        setFormData({
          title: isFork ? `${prompt.title} (副本)` : prompt.title,
          description: prompt.description,
          content: prompt.content,
          tagIds: prompt.tags?.map((t) => t.id) || [],
          purpose: prompt.purpose,
          model: prompt.model,
          language: prompt.language,
          difficulty: prompt.difficulty,
          inputExample: prompt.inputExample,
          outputExample: prompt.outputExample,
          useCases: prompt.useCases?.length ? prompt.useCases : [''],
          changelog: '',
        });
        if (!isFork) {
          setEditId(id);
        }
      }
    } catch {
      toast.error('加载提示词失败');
    } finally {
      setIsLoading(false);
    }
  };

  const checkDraft = useCallback(() => {
    const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
    setHasDraft(!!draft);
  }, []);

  const loadDraft = () => {
    try {
      const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        setFormData(parsed);
        toast.success('已恢复草稿');
        checkDraft();
      }
    } catch {
      toast.error('恢复草稿失败');
    }
  };

  const saveDraft = useCallback(async () => {
    setIsSavingDraft(true);
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
      toast.success('草稿已保存');
      checkDraft();
    } catch {
      toast.error('保存草稿失败');
    } finally {
      setIsSavingDraft(false);
    }
  }, [formData, checkDraft, toast]);

  useEffect(() => {
    loadTags();
    checkDraft();

    const editParam = searchParams.get('edit');
    const forkParam = searchParams.get('fork');

    if (editParam) {
      loadPrompt(parseInt(editParam), false);
    } else if (forkParam) {
      const id = parseInt(forkParam);
      setForkId(id);
      loadPrompt(id, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.title || formData.content) {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
        checkDraft();
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [formData, checkDraft]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = '请输入提示词标题';
    } else if (formData.title.length < 5) {
      newErrors.title = '标题至少需要5个字符';
    }

    if (!formData.description.trim()) {
      newErrors.description = '请输入提示词描述';
    } else if (formData.description.length < 20) {
      newErrors.description = '描述至少需要20个字符';
    }

    if (!formData.content.trim()) {
      newErrors.content = '请输入提示词内容';
    } else if (formData.content.length < 50) {
      newErrors.content = '提示词内容至少需要50个字符';
    }

    if (formData.tagIds.length === 0) {
      newErrors.tagIds = '请至少选择一个标签';
    }

    if (!formData.purpose) {
      newErrors.purpose = '请选择用途';
    }

    if (!formData.model) {
      newErrors.model = '请选择适用模型';
    }

    if (!formData.language) {
      newErrors.language = '请选择语言';
    }

    const validUseCases = formData.useCases.filter((uc) => uc.trim());
    if (validUseCases.length === 0) {
      newErrors.useCases = '请至少添加一个使用场景';
    }

    if (editId && !formData.changelog.trim()) {
      newErrors.changelog = '请填写更新日志';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('请检查表单填写是否完整');
      return;
    }

    setIsSubmitting(true);
    try {
      const validUseCases = formData.useCases.filter((uc) => uc.trim());
      const requestData: CreatePromptRequest = {
        ...formData,
        useCases: validUseCases,
      };

      let response: ApiResponse<Prompt>;

      if (editId) {
        response = await apiClient.put<Prompt>(`/prompts/${editId}`, requestData);
      } else if (forkId) {
        response = await apiClient.post<Prompt>(`/prompts/${forkId}/fork`);
      } else {
        response = await apiClient.post<Prompt>('/prompts', requestData);
      }

      if (response.success && response.data) {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        toast.success(
          editId
            ? '更新成功，等待审核'
            : '提交成功，等待审核'
        );
        navigate('/my-prompts?status=pending');
      } else {
        toast.error(response.error || '提交失败');
      }
    } catch {
      toast.error('提交失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddUseCase = () => {
    setFormData({ ...formData, useCases: [...formData.useCases, ''] });
  };

  const handleRemoveUseCase = (index: number) => {
    const newUseCases = formData.useCases.filter((_, i) => i !== index);
    setFormData({ ...formData, useCases: newUseCases });
  };

  const handleUseCaseChange = (index: number, value: string) => {
    const newUseCases = [...formData.useCases];
    newUseCases[index] = value;
    setFormData({ ...formData, useCases: newUseCases });
  };

  const handleTagToggle = (tag: Tag) => {
    const newTagIds = formData.tagIds.includes(tag.id)
      ? formData.tagIds.filter((id) => id !== tag.id)
      : [...formData.tagIds, tag.id];
    setFormData({ ...formData, tagIds: newTagIds });
  };

  const selectedTags = allTags.filter((t) => formData.tagIds.includes(t.id));
  const purposeTags = allTags.filter((t) => t.category === 'purpose');
  const modelTags = allTags.filter((t) => t.category === 'model');
  const languageTags = allTags.filter((t) => t.category === 'language');

  const contentLines = formData.content.split('\n');

  if (!isAuthenticated || !user) {
    navigate('/login');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 bg-cream-100">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              to="/my-prompts"
              className="p-2 text-ink-600 hover:text-ink-900 hover:bg-ink-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-ink-900">
                {editId ? '编辑提示词' : forkId ? '创建新版本' : '创建提示词'}
              </h1>
              <p className="text-ink-500 text-sm">
                分享你的提示词，帮助更多人
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasDraft && (
              <button
                onClick={loadDraft}
                className="btn-ghost text-sm"
              >
                <FileText className="w-4 h-4" />
                恢复草稿
              </button>
            )}
            <button
              onClick={saveDraft}
              disabled={isSavingDraft}
              className="btn-ghost text-sm"
            >
              {isSavingDraft ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              保存草稿
            </button>
            <button
              onClick={() => setShowPreview(true)}
              className="btn-ghost text-sm"
            >
              <Eye className="w-4 h-4" />
              预览
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <section className="bg-cream-50 rounded-xl border border-ink-100 shadow-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-ink-900">
                  基本信息
                </h2>
                <p className="text-sm text-ink-500">填写提示词的标题和描述</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  标题 <span className="text-vermilion-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="简明扼要地描述你的提示词"
                  className={cn(
                    'input-field',
                    errors.title && 'border-vermilion-500 focus:border-vermilion-500'
                  )}
                  maxLength={100}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-vermilion-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.title}
                  </p>
                )}
                <p className="mt-1 text-right text-xs text-ink-400">
                  {formData.title.length}/100
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  描述 <span className="text-vermilion-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="详细描述这个提示词的用途和效果，帮助用户理解它能做什么"
                  className={cn(
                    'input-field resize-none',
                    errors.description && 'border-vermilion-500 focus:border-vermilion-500'
                  )}
                  rows={3}
                  maxLength={500}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-vermilion-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.description}
                  </p>
                )}
                <p className="mt-1 text-right text-xs text-ink-400">
                  {formData.description.length}/500
                </p>
              </div>
            </div>
          </section>

          {/* Prompt Content */}
          <section className="bg-cream-50 rounded-xl border border-ink-100 shadow-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-ink-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-ink-600" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-ink-900">
                  提示词内容
                </h2>
                <p className="text-sm text-ink-500">输入你精心设计的提示词</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                提示词 <span className="text-vermilion-500">*</span>
              </label>
              <div className="relative rounded-lg overflow-hidden border-2 border-ink-200 focus-within:border-amber-500 transition-colors">
                <div className="flex">
                  <div className="bg-ink-100 text-ink-400 text-right p-4 select-none font-mono text-sm leading-relaxed border-r border-ink-200">
                    {contentLines.map((_, i) => (
                      <div key={i} className="min-w-[2rem]">
                        {i + 1}
                      </div>
                    ))}
                  </div>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="在此输入你的提示词内容...
可以是角色扮演、任务指令、格式要求等。
建议包含：
1. 角色设定
2. 任务目标
3. 输出格式
4. 约束条件"
                    className={cn(
                      'flex-1 p-4 bg-cream-50 text-ink-900 placeholder-ink-400 focus:outline-none font-mono text-sm leading-relaxed resize-none min-h-[300px]',
                      errors.content && 'bg-vermilion-50'
                    )}
                    spellCheck={false}
                  />
                </div>
              </div>
              {errors.content && (
                <p className="mt-1 text-sm text-vermilion-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.content}
                </p>
              )}
            </div>
          </section>

          {/* Tags */}
          <section className="bg-cream-50 rounded-xl border border-ink-100 shadow-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-moss-500/10 rounded-lg flex items-center justify-center">
                  <TagIcon className="w-5 h-5 text-moss-600" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold text-ink-900">
                    标签选择 <span className="text-vermilion-500">*</span>
                  </h2>
                  <p className="text-sm text-ink-500">选择合适的标签帮助用户发现你的提示词</p>
                </div>
              </div>

              <button
                onClick={() => setShowTagModal(true)}
                className="btn-ghost text-sm"
              >
                <Plus className="w-4 h-4" />
                选择标签
              </button>
            </div>

            {selectedTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <div key={tag.id} className="relative group">
                    <TagBadge tag={tag} selected />
                    <button
                      onClick={() => handleTagToggle(tag)}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-ink-700 text-cream-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                onClick={() => setShowTagModal(true)}
                className="border-2 border-dashed border-ink-200 rounded-lg p-8 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-500/5 transition-colors"
              >
                <TagIcon className="w-8 h-8 text-ink-300 mx-auto mb-2" />
                <p className="text-ink-500">点击选择标签</p>
              </div>
            )}
            {errors.tagIds && (
              <p className="mt-2 text-sm text-vermilion-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.tagIds}
              </p>
            )}
          </section>

          {/* Attributes */}
          <section className="bg-cream-50 rounded-xl border border-ink-100 shadow-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-vermilion-500/10 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-vermilion-500" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-ink-900">
                  属性设置
                </h2>
                <p className="text-sm text-ink-500">设置提示词的属性信息</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  用途 <span className="text-vermilion-500">*</span>
                </label>
                <select
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className={cn(
                    'input-field',
                    errors.purpose && 'border-vermilion-500 focus:border-vermilion-500'
                  )}
                >
                  <option value="">请选择用途</option>
                  {purposeTags.map((tag) => (
                    <option key={tag.id} value={tag.name}>
                      {tag.name}
                    </option>
                  ))}
                </select>
                {errors.purpose && (
                  <p className="mt-1 text-sm text-vermilion-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.purpose}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  适用模型 <span className="text-vermilion-500">*</span>
                </label>
                <select
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className={cn(
                    'input-field',
                    errors.model && 'border-vermilion-500 focus:border-vermilion-500'
                  )}
                >
                  <option value="">请选择模型</option>
                  {modelTags.map((tag) => (
                    <option key={tag.id} value={tag.name}>
                      {tag.name}
                    </option>
                  ))}
                </select>
                {errors.model && (
                  <p className="mt-1 text-sm text-vermilion-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.model}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  语言 <span className="text-vermilion-500">*</span>
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className={cn(
                    'input-field',
                    errors.language && 'border-vermilion-500 focus:border-vermilion-500'
                  )}
                >
                  <option value="">请选择语言</option>
                  {languageTags.map((tag) => (
                    <option key={tag.id} value={tag.name}>
                      {tag.name}
                    </option>
                  ))}
                </select>
                {errors.language && (
                  <p className="mt-1 text-sm text-vermilion-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.language}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  难度 <span className="text-vermilion-500">*</span>
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as FormData['difficulty'] })}
                  className="input-field"
                >
                  {DIFFICULTY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Examples */}
          <section className="bg-cream-50 rounded-xl border border-ink-100 shadow-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-ink-900">
                  使用示例
                </h2>
                <p className="text-sm text-ink-500">提供输入输出示例帮助用户理解</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  输入示例
                </label>
                <textarea
                  value={formData.inputExample}
                  onChange={(e) => setFormData({ ...formData, inputExample: e.target.value })}
                  placeholder="示例：请帮我写一封商务邮件"
                  className="input-field resize-none font-mono text-sm"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  输出示例
                </label>
                <textarea
                  value={formData.outputExample}
                  onChange={(e) => setFormData({ ...formData, outputExample: e.target.value })}
                  placeholder="示例：尊敬的XX先生/女士：您好！关于..."
                  className="input-field resize-none font-mono text-sm"
                  rows={5}
                />
              </div>
            </div>
          </section>

          {/* Use Cases */}
          <section className="bg-cream-50 rounded-xl border border-ink-100 shadow-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-ink-100 rounded-lg flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-ink-600" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-ink-900">
                  使用场景 <span className="text-vermilion-500">*</span>
                </h2>
                <p className="text-sm text-ink-500">列出这个提示词适用的场景</p>
              </div>
            </div>

            <div className="space-y-3">
              {formData.useCases.map((useCase, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-8 h-10 flex items-center justify-center text-ink-400 font-medium">
                    {index + 1}.
                  </div>
                  <input
                    type="text"
                    value={useCase}
                    onChange={(e) => handleUseCaseChange(index, e.target.value)}
                    placeholder="例如：撰写营销文案、解答技术问题..."
                    className="input-field"
                  />
                  {formData.useCases.length > 1 && (
                    <button
                      onClick={() => handleRemoveUseCase(index)}
                      className="p-2 text-ink-400 hover:text-vermilion-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {errors.useCases && (
                <p className="text-sm text-vermilion-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.useCases}
                </p>
              )}
              <button
                onClick={handleAddUseCase}
                className="btn-ghost text-sm w-full justify-center py-2 border-2 border-dashed border-ink-200 hover:border-amber-400 hover:bg-amber-500/5"
              >
                <Plus className="w-4 h-4" />
                添加使用场景
              </button>
            </div>
          </section>

          {/* Changelog */}
          {editId && (
            <section className="bg-cream-50 rounded-xl border border-ink-100 shadow-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-moss-500/10 rounded-lg flex items-center justify-center">
                  <GitBranch className="w-5 h-5 text-moss-600" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold text-ink-900">
                    更新日志 <span className="text-vermilion-500">*</span>
                  </h2>
                  <p className="text-sm text-ink-500">描述这次更新的内容</p>
                </div>
              </div>

              <textarea
                value={formData.changelog}
                onChange={(e) => setFormData({ ...formData, changelog: e.target.value })}
                placeholder="例如：优化了提示词结构，提升了输出质量；增加了对XX场景的支持..."
                className={cn(
                  'input-field resize-none',
                  errors.changelog && 'border-vermilion-500 focus:border-vermilion-500'
                )}
                rows={3}
              />
              {errors.changelog && (
                <p className="mt-1 text-sm text-vermilion-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.changelog}
                </p>
              )}
            </section>
          )}
        </div>

        {/* Submit Bar */}
        <div className="sticky bottom-0 mt-8 -mx-4 px-4 py-4 bg-cream-50/95 backdrop-blur-md border-t border-ink-100 shadow-card">
          <div className="container mx-auto max-w-4xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-ink-500">
              <CheckCircle2 className="w-4 h-4 text-moss-500" />
              <span>提交后将进入审核流程，审核通过后即可发布</span>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/my-prompts" className="btn-ghost">
                取消
              </Link>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn-primary bg-amber-500 text-cream-50 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {editId ? '提交更新' : '提交审核'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tag Selection Modal */}
      <Modal
        isOpen={showTagModal}
        onClose={() => setShowTagModal(false)}
        title="选择标签"
        size="lg"
        footer={
          <>
            <button
              onClick={() => setShowTagModal(false)}
              className="btn-ghost"
            >
              取消
            </button>
            <button
              onClick={() => setShowTagModal(false)}
              className="btn-primary bg-amber-500 text-cream-50"
            >
              确认选择 ({selectedTags.length})
            </button>
          </>
        }
      >
        <div className="space-y-6 max-h-[60vh] overflow-y-auto">
          {(['purpose', 'model', 'language', 'difficulty'] as const).map(
            (category) => {
              const tags = allTags.filter((t) => t.category === category);
              return (
                <div key={category}>
                  <h3 className="text-sm font-medium text-ink-700 mb-3">
                    {CATEGORY_LABELS[category]}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <TagBadge
                        key={tag.id}
                        tag={tag}
                        selected={formData.tagIds.includes(tag.id)}
                        onClick={() => handleTagToggle(tag)}
                      />
                    ))}
                  </div>
                </div>
              );
            }
          )}
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="预览效果"
        size="xl"
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink-900 mb-2">
              {formData.title || '提示词标题'}
            </h2>
            <p className="text-ink-600">
              {formData.description || '提示词描述将显示在这里'}
            </p>
          </div>

          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <TagBadge key={tag.id} tag={tag} />
              ))}
            </div>
          )}

          <div>
            <h3 className="font-semibold text-ink-900 mb-2">提示词内容</h3>
            <pre className="bg-ink-900 text-cream-50 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">
              {formData.content || '提示词内容将显示在这里...'}
            </pre>
          </div>

          {formData.inputExample && (
            <div>
              <h3 className="font-semibold text-ink-900 mb-2">输入示例</h3>
              <pre className="bg-ink-100 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">
                {formData.inputExample}
              </pre>
            </div>
          )}

          {formData.outputExample && (
            <div>
              <h3 className="font-semibold text-ink-900 mb-2">输出示例</h3>
              <pre className="bg-ink-100 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">
                {formData.outputExample}
              </pre>
            </div>
          )}

          {formData.useCases.filter((uc) => uc.trim()).length > 0 && (
            <div>
              <h3 className="font-semibold text-ink-900 mb-2">使用场景</h3>
              <ul className="list-disc list-inside space-y-1 text-ink-600">
                {formData.useCases
                  .filter((uc) => uc.trim())
                  .map((uc, i) => (
                    <li key={i}>{uc}</li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
