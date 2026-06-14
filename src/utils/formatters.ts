export const formatDate = (dateString: string): string => {
  if (!dateString) return '';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return '刚刚';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`;
  }
  if (diffHours < 24) {
    return `${diffHours}小时前`;
  }
  if (diffDays < 7) {
    return `${diffDays}天前`;
  }
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks}周前`;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  if (year === now.getFullYear()) {
    return `${month}-${day}`;
  }

  return `${year}-${month}-${day}`;
};

export const formatNumber = (num: number): string => {
  if (!num && num !== 0) return '';

  if (num < 1000) {
    return num.toString();
  }

  if (num < 10000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }

  if (num < 100000000) {
    return Math.floor(num / 10000) + '万';
  }

  return (num / 100000000).toFixed(1).replace(/\.0$/, '') + '亿';
};

export const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;

  return text.slice(0, maxLength) + '...';
};

export const getDifficultyLabel = (difficulty: string): string => {
  const labels: Record<string, string> = {
    beginner: '入门',
    intermediate: '进阶',
    advanced: '高级',
  };

  return labels[difficulty] || difficulty;
};

export const getDifficultyColor = (difficulty: string): string => {
  const colors: Record<string, string> = {
    beginner: 'text-green-600 bg-green-50 border-green-200',
    intermediate: 'text-amber-600 bg-amber-50 border-amber-200',
    advanced: 'text-red-600 bg-red-50 border-red-200',
  };

  return colors[difficulty] || 'text-gray-600 bg-gray-50 border-gray-200';
};
