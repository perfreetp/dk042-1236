export interface SelectOption {
  value: string;
  label: string;
}

export const DIFFICULTY_OPTIONS: SelectOption[] = [
  { value: 'beginner', label: '入门' },
  { value: 'intermediate', label: '进阶' },
  { value: 'advanced', label: '高级' },
];

export const SORT_OPTIONS: SelectOption[] = [
  { value: 'createdAt', label: '最新发布' },
  { value: 'rating', label: '评分最高' },
  { value: 'viewCount', label: '浏览最多' },
  { value: 'copyCount', label: '复制最多' },
  { value: 'favoriteCount', label: '收藏最多' },
  { value: 'forkCount', label: '派生最多' },
];

export const REPORT_REASONS: SelectOption[] = [
  { value: 'spam', label: '垃圾广告' },
  { value: 'inappropriate', label: '内容不当' },
  { value: 'plagiarism', label: '抄袭侵权' },
  { value: 'misinformation', label: '虚假信息' },
  { value: 'illegal', label: '违法违规' },
  { value: 'other', label: '其他问题' },
];

export const CATEGORY_LABELS: Record<string, string> = {
  purpose: '用途',
  model: '模型',
  language: '语言',
  difficulty: '难度',
};
