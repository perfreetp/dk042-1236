import bcrypt from 'bcryptjs';
import type { Database } from 'sql.js';

const PASSWORD = 'password123';

interface TagData {
  name: string;
  category: 'purpose' | 'model' | 'language' | 'difficulty';
  color: string;
}

interface UserData {
  email: string;
  username: string;
  avatar: string;
  bio: string;
  role: 'user' | 'author' | 'admin';
}

interface PromptData {
  title: string;
  content: string;
  description: string;
  authorId: number;
  purpose: string;
  model: string;
  language: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  inputExample: string;
  outputExample: string;
  useCases: string[];
  version: string;
  status: 'pending' | 'approved' | 'rejected' | 'removed';
  rating: number;
  ratingCount: number;
  copyCount: number;
  forkCount: number;
  favoriteCount: number;
  viewCount: number;
  isFeatured: number;
  tagIds: number[];
}

const tags: TagData[] = [
  { name: '内容创作', category: 'purpose', color: '#F59E0B' },
  { name: '代码开发', category: 'purpose', color: '#3B82F6' },
  { name: '设计创意', category: 'purpose', color: '#EC4899' },
  { name: '数据分析', category: 'purpose', color: '#10B981' },
  { name: '营销文案', category: 'purpose', color: '#8B5CF6' },
  { name: '教育学习', category: 'purpose', color: '#06B6D4' },
  { name: 'GPT-4', category: 'model', color: '#F59E0B' },
  { name: 'GPT-3.5', category: 'model', color: '#F97316' },
  { name: 'Claude 3', category: 'model', color: '#8B5CF6' },
  { name: 'Gemini', category: 'model', color: '#3B82F6' },
  { name: 'Midjourney', category: 'model', color: '#10B981' },
  { name: 'DALL-E', category: 'model', color: '#EC4899' },
  { name: '中文', category: 'language', color: '#F59E0B' },
  { name: '英文', category: 'language', color: '#3B82F6' },
  { name: '双语', category: 'language', color: '#10B981' },
  { name: '入门', category: 'difficulty', color: '#10B981' },
  { name: '进阶', category: 'difficulty', color: '#F59E0B' },
  { name: '高级', category: 'difficulty', color: '#EF4444' },
];

const users: UserData[] = [
  {
    email: 'admin@promptshare.com',
    username: '管理员',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    bio: '平台管理员，负责内容审核和社区管理',
    role: 'admin',
  },
  {
    email: 'author1@promptshare.com',
    username: '创意大师',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=author1',
    bio: '专注于内容创作和设计类提示词，热爱分享高质量的AI提示词',
    role: 'author',
  },
  {
    email: 'author2@promptshare.com',
    username: '代码工匠',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=author2',
    bio: '全栈开发者，擅长编程类和技术类提示词创作',
    role: 'author',
  },
  {
    email: 'user1@promptshare.com',
    username: '探索者小明',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1',
    bio: '热爱AI工具的产品经理，喜欢收集和使用各种提示词',
    role: 'user',
  },
  {
    email: 'user2@promptshare.com',
    username: '学习达人',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2',
    bio: '终身学习者，用AI提升学习效率',
    role: 'user',
  },
];

const prompts: Omit<PromptData, 'authorId' | 'tagIds'>[] = [
  {
    title: '专业博客文章写作助手',
    content: `你是一位专业的博客文章写作助手。请根据用户提供的主题，撰写一篇结构完整、内容丰富的博客文章。

要求：
1. 标题要吸引人，包含关键词
2. 开头要有引人入胜的引言
3. 正文分3-5个主要部分，每个部分有子标题
4. 包含实际案例和数据支持
5. 结尾要有总结和行动号召
6. 语言风格：专业、友好、有深度
7. 字数：1500-2000字

请用户提供文章主题。`,
    description: '帮助您快速撰写高质量的博客文章，包含完整的文章结构和专业的写作风格。',
    purpose: '内容创作',
    model: 'GPT-4',
    language: '中文',
    difficulty: 'beginner',
    inputExample: '主题：如何用AI提升工作效率',
    outputExample: `# 如何用AI提升工作效率：全面指南

## 引言
在当今快节奏的工作环境中，效率就是竞争力...

## 一、AI如何改变我们的工作方式
...

## 结论
AI不是来取代人类的，而是来赋能人类的...`,
    useCases: ['博客写作', '内容营销', '知识分享'],
    version: '1.0.0',
    status: 'approved',
    rating: 4.8,
    ratingCount: 156,
    copyCount: 320,
    forkCount: 45,
    favoriteCount: 210,
    viewCount: 1520,
    isFeatured: 1,
  },
  {
    title: 'Python代码重构专家',
    content: `你是一位资深Python架构师。请分析用户提供的Python代码，并提供专业的重构建议。

分析维度：
1. 代码可读性和命名规范
2. 性能优化点
3. 错误处理完善度
4. 设计模式应用
5. 类型提示完整性
6. 测试覆盖建议

请输出：
- 重构后的完整代码
- 详细的修改说明
- 性能对比数据（如适用）

请提供需要重构的Python代码。`,
    description: '专业的Python代码重构工具，帮助您提升代码质量和性能。',
    purpose: '代码开发',
    model: 'GPT-4',
    language: '中文',
    difficulty: 'advanced',
    inputExample: `def calculate_total(prices):
    total = 0
    for p in prices:
        total += p
    return total`,
    outputExample: `## 重构分析

### 问题识别
1. 缺少类型提示
2. 可以使用内置函数提高性能
3. 缺少参数验证

### 重构后代码
\`\`\`python
from typing import List, Union

Number = Union[int, float]

def calculate_total(prices: List[Number]) -> Number:
    """Calculate the sum of a list of prices.
    
    Args:
        prices: List of numeric values
        
    Returns:
        Sum of all prices
        
    Raises:
        TypeError: If prices contains non-numeric values
    """
    if not all(isinstance(p, (int, float)) for p in prices):
        raise TypeError("All prices must be numeric values")
    
    return sum(prices)
\`\`\`

### 改进说明
- 增加了类型提示和文档字符串
- 使用内置sum()函数，性能提升约30%
- 增加了参数验证`,
    useCases: ['代码审查', '性能优化', '代码质量提升'],
    version: '1.2.0',
    status: 'approved',
    rating: 4.9,
    ratingCount: 203,
    copyCount: 450,
    forkCount: 67,
    favoriteCount: 310,
    viewCount: 2340,
    isFeatured: 1,
  },
  {
    title: 'UI/UX设计创意生成器',
    content: `你是一位资深UI/UX设计师。请根据用户的产品描述，生成创新的设计创意和界面方案。

请提供：
1. 3个不同的设计方向概念
2. 每个方向包含：
   - 配色方案（主色、辅助色、强调色）
   - 布局结构描述
   - 交互设计亮点
   - 微交互动效建议
3. 用户体验优化建议
4. 适配不同屏幕尺寸的响应式设计考虑

设计风格要求：现代、简洁、符合当前设计趋势

请描述您的产品或设计需求。`,
    description: '激发UI/UX设计创意，提供专业的设计方案和配色建议。',
    purpose: '设计创意',
    model: 'GPT-4',
    language: '中文',
    difficulty: 'intermediate',
    inputExample: '产品：健身追踪APP，主要功能是记录运动数据、制定健身计划、社交分享',
    outputExample: `## 设计方向一：活力运动风

### 配色方案
- 主色：#FF6B35（活力橙）
- 辅助色：#004E89（深海蓝）
- 强调色：#00D9FF（霓虹青）

### 布局结构
采用卡片式布局，首页展示今日运动概览，底部导航清晰区分功能模块...

### 交互亮点
- 运动记录按钮采用脉冲动效，鼓励用户点击
- 数据图表使用渐变色填充，视觉冲击力强...

---

## 设计方向二：简约科技风
...`,
    useCases: ['APP设计', '网站设计', '品牌设计'],
    version: '1.1.0',
    status: 'approved',
    rating: 4.7,
    ratingCount: 89,
    copyCount: 180,
    forkCount: 23,
    favoriteCount: 145,
    viewCount: 980,
    isFeatured: 1,
  },
  {
    title: '销售数据分析报告',
    content: `你是一位专业的数据分析师。请根据提供的销售数据，生成一份全面的数据分析报告。

报告结构：
1. 执行摘要（核心发现3条）
2. 销售趋势分析（同比、环比）
3. 产品销售排名
4. 区域销售分析
5. 客户群体分析
6. 关键指标解读
7. 问题识别与建议
8.  actionable建议

请用数据说话，每个结论都要有数据支撑。
可视化建议：用文字描述图表类型和展示方式。

请提供销售数据（Excel/CSV格式或文字描述）。`,
    description: '将原始销售数据转化为有洞察力的分析报告，帮助决策。',
    purpose: '数据分析',
    model: 'Claude 3',
    language: '中文',
    difficulty: 'intermediate',
    inputExample: `2024年Q1销售数据：
总销售额：¥2,450,000
产品A：¥850,000 (34.7%)
产品B：¥620,000 (25.3%)
产品C：¥530,000 (21.6%)
产品D：¥450,000 (18.4%)
华东区：40%，华南区：30%，华北区：20%，其他：10%
同比增长：15%`,
    outputExample: `# 2024年Q1销售数据分析报告

## 执行摘要
1. Q1总销售额达¥245万，同比增长15%，超出预期目标
2. 产品A贡献最大，占比34.7%，但增速放缓
3. 华东区域表现强劲，华南区增长潜力大

## 销售趋势分析
...

## 建议
1. 加大产品A的创新投入，维持市场领导地位
2. 重点拓展华南区市场，复制华东区成功经验
...`,
    useCases: ['销售报告', '业务分析', '数据洞察'],
    version: '1.0.0',
    status: 'approved',
    rating: 4.6,
    ratingCount: 67,
    copyCount: 145,
    forkCount: 18,
    favoriteCount: 98,
    viewCount: 760,
    isFeatured: 0,
  },
  {
    title: '产品营销文案大师',
    content: `你是一位顶级营销文案专家。请根据产品特点和目标受众，撰写有说服力的营销文案。

请提供以下版本：
1. 3种不同风格的文案版本
   - 情感共鸣版（触动人心）
   - 理性说服版（数据驱动）
   - 简洁有力版（适合社交媒体）

2. 每个版本包含：
   - 标题（吸引注意力）
   - 正文（激发兴趣和欲望）
   - 行动号召（促进行动）

文案原则：
- AIDA模型（Attention, Interest, Desire, Action）
- 突出产品独特卖点
- 针对目标受众的痛点和需求

请描述您的产品、目标受众和主要卖点。`,
    description: '生成多版本营销文案，覆盖不同营销场景和受众群体。',
    purpose: '营销文案',
    model: 'GPT-4',
    language: '中文',
    difficulty: 'intermediate',
    inputExample: '产品：智能保温杯，可显示水温、提醒喝水、续航30天、颜值高\n目标受众：25-40岁白领女性\n卖点：健康生活、时尚单品',
    outputExample: `## 版本一：情感共鸣版

**标题：你的身体缺水的信号，你真的听懂了吗？

每天忙碌的你，是不是总忘记喝水？
保温杯里的水，凉了又热，热了又凉...

这款智能保温杯，不只是杯子
它懂你，懂你需要被提醒的健康
30天超长续航，让关爱从不缺席
水温看得见，温度刚刚好

现在，给自己一份温柔的健康礼物
让每一口水，都是对自己的宠爱

👉 立即购买，开启健康喝水新体验

---

## 版本二：理性说服版
...`,
    useCases: ['产品文案', '广告创意', '社交媒体营销'],
    version: '1.0.0',
    status: 'approved',
    rating: 4.5,
    ratingCount: 112,
    copyCount: 267,
    forkCount: 34,
    favoriteCount: 178,
    viewCount: 1450,
    isFeatured: 1,
  },
  {
    title: '英语学习伙伴',
    content: `You are an experienced English tutor. Please help users improve their English skills through interactive conversations.

Please respond in English, but provide Chinese explanations when needed.

Focus areas:
1. Vocabulary expansion
2. Grammar correction with explanations
3. Idioms and natural expressions
4. Cultural context
5. Pronunciation tips (using phonetic alphabet)

After each response, provide:
- 3 new vocabulary words with definitions
- 1 grammar point explanation
- 1 practical conversation practice question

Let's start the conversation!`,
    description: '通过互动对话提升英语水平，包含词汇、语法、口语全方位学习。',
    purpose: '教育学习',
    model: 'GPT-3.5',
    language: '双语',
    difficulty: 'beginner',
    inputExample: '我想练习商务英语，如何开始？',
    outputExample: `Great! Let's start with a common business scenario.

**Today's topic: First meeting a new client

"Hello! Welcome to our office. It's a pleasure to finally meet you in person. I've heard so much about your work.

---

### New Vocabulary
1. **Pleasure** (n) - 愉快，快乐
2. **In person** (phrase) - 亲自
3. **Scenario** (n) - 场景，情况

### Grammar Point
**Present Perfect Tense (现在完成时)
- "I've heard so much..." - 表示从过去持续到现在的经历
- Structure: have/has + past participle

### Practice
Can you introduce yourself in a business context? Tell me about your role and company.`,
    useCases: ['英语学习', '商务英语', '日常对话练习'],
    version: '1.0.0',
    status: 'approved',
    rating: 4.8,
    ratingCount: 234,
    copyCount: 567,
    forkCount: 89,
    favoriteCount: 412,
    viewCount: 3200,
    isFeatured: 1,
  },
  {
    title: 'React组件代码生成器',
    content: `你是一位React专家。请根据需求描述生成高质量的React组件代码。

输出要求：
1. 使用TypeScript
2. 使用函数式组件 + Hooks
3. 完整的类型定义
4. 适当的注释
5. 样式方案（Tailwind CSS）
6. 错误边界处理
7. 性能优化考虑（useMemo, useCallback）
8. 可访问性支持

请提供组件需求描述。`,
    description: '快速生成高质量的React组件代码，遵循最佳实践。',
    purpose: '代码开发',
    model: 'GPT-4',
    language: '中文',
    difficulty: 'advanced',
    inputExample: '创建一个可复用的数据表格组件，支持排序、分页、搜索功能',
    outputExample: `\`\`\`tsx
import React, { useState, useMemo, useCallback } from 'react';

interface Column<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
}

function DataTable<T extends Record<string, any>>({
  data,
  columns,
  pageSize = 10,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(row =>
      Object.values(row).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  // ... 省略部分代码
}

export default DataTable;
\`\`\``,
    useCases: ['组件开发', '前端架构', '代码复用'],
    version: '1.0.0',
    status: 'approved',
    rating: 4.9,
    ratingCount: 178,
    copyCount: 389,
    forkCount: 56,
    favoriteCount: 267,
    viewCount: 1890,
    isFeatured: 0,
  },
  {
    title: 'Midjourney艺术提示词专家',
    content: `你是一位Midjourney提示词专家。请将用户的创意描述转化为专业的Midjourney提示词。

请提供：
1. 3个不同风格的提示词版本
2. 每个提示词包含：
   - 主体描述
   - 艺术风格
   - 光影效果
   - 色彩方案
   - 技术参数（--ar --q --v等）

3. 同时提供：
- 中文创意说明
- 可能的变体建议
- 参数调整指南

请描述你想要生成的图像内容和风格。`,
    description: '将创意想法转化为专业的Midjourney提示词，生成高质量AI艺术作品。',
    purpose: '设计创意',
    model: 'Midjourney',
    language: '英文',
    difficulty: 'intermediate',
    inputExample: '一个未来科技感的中国龙，赛博朋克风格，霓虹灯效果',
    outputExample: `## 版本一：赛博朋克霓虹龙

\`\`\`
A majestic Chinese dragon, cyberpunk style, neon glowing scales, holographic projections, futuristic city background, rain reflections on wet streets, purple and cyan neon lights, intricate mechanical details, hyper detailed, 8k resolution, cinematic lighting, dramatic atmosphere, volumetric lighting, ray tracing, unreal engine 5, octane render --ar 16:9 --v 6.0 --q 2 --stylize 750
\`\`\`

### 创意说明
融合东方神话与未来科技的碰撞，霓虹灯光营造赛博朋克氛围...

### 变体建议
- 尝试 --stylize 1000 更抽象艺术化
- 尝试 --style raw 更写实

---

## 版本二：极简线条艺术
...`,
    useCases: ['AI艺术创作', '概念设计', '视觉创意'],
    version: '1.0.0',
    status: 'approved',
    rating: 4.7,
    ratingCount: 145,
    copyCount: 423,
    forkCount: 78,
    favoriteCount: 334,
    viewCount: 2100,
    isFeatured: 1,
  },
  {
    title: '产品需求文档PRD生成器',
    content: `你是一位资深产品经理。请根据产品想法生成完整的产品需求文档(PRD)。

文档结构：
1. 项目背景与目标
2. 用户画像与痛点
3. 功能需求（含用户故事）
4. 非功能需求
5. 功能优先级（MoSCoW）
6. 验收标准
7. 风险与依赖
8. 成功指标

请提供产品的核心想法和目标用户。`,
    description: '系统化生成产品需求文档，确保需求完整清晰。',
    purpose: '内容创作',
    model: 'Claude 3',
    language: '中文',
    difficulty: 'advanced',
    inputExample: '做一个面向大学生的二手教材共享平台',
    outputExample: `# 二手教材共享平台 PRD

## 1. 项目背景与目标
### 1.1 背景
大学生每年购买新教材成本高，教材使用周期短，造成资源浪费...

### 1.2 目标
- 3个月内覆盖10所高校
- 用户数达到5000人
- 教材共享率达到40%

## 2. 用户画像
- **张三，20岁，大二学生，希望低价购买专业教材...

## 3. 功能需求
### Must Have
- 用户注册登录（学生认证）
- 教材发布与搜索
...`,
    useCases: ['产品规划', '需求文档', '项目立项'],
    version: '1.0.0',
    status: 'approved',
    rating: 4.6,
    ratingCount: 56,
    copyCount: 123,
    forkCount: 15,
    favoriteCount: 89,
    viewCount: 670,
    isFeatured: 0,
  },
  {
    title: '面试问题回答助手',
    content: `你是一位专业的面试官。请根据职位要求，提供高质量的面试问题回答范例。

请提供：
1. 结构化的回答框架
2. STAR法则应用
3. 具体的案例支撑
4. 亮点突出技巧
5. 常见陷阱规避建议

回答原则：
- 真实具体，避免空泛
- 数据量化，增强说服力
- 逻辑清晰，层次分明
- 展现思考过程，而非仅仅是答案

请提供面试问题和相关背景。`,
    description: '帮助准备面试，提供专业的回答思路和范例。',
    purpose: '教育学习',
    model: 'GPT-4',
    language: '中文',
    difficulty: 'intermediate',
    inputExample: '问题：请介绍一个你主导的最有成就感的项目',
    outputExample: `## 回答框架

### Situation（情境）
"在我上一份工作中，我们团队面临一个关键挑战..."

### Task（任务）
"我的任务是负责重构核心支付系统..."

### Action（行动）
"我首先进行了全面的技术调研，对比了3种方案...
最终选择了微服务架构...
带领3人团队，耗时2个月完成...

### Result（结果）
"系统吞吐量提升了300%...
故障率从5%降到0.1%...

### 亮点设计
1. 技术决策的前瞻性
2. 团队协作与沟通
3. 风险控制与应急预案

### 可能的追问问题与应对：
- Q: 遇到最大的困难是什么？
A: ...`,
    useCases: ['面试准备', '求职技巧', '职业发展'],
    version: '1.1.0',
    status: 'approved',
    rating: 4.8,
    ratingCount: 189,
    copyCount: 456,
    forkCount: 67,
    favoriteCount: 312,
    viewCount: 2670,
    isFeatured: 1,
  },
  {
    title: 'SQL查询优化顾问',
    content: `你是一位数据库性能优化专家。请分析SQL查询并提供优化建议。

分析维度：
1. 索引优化建议
2. 查询重写方案
3. 执行计划分析
4. 数据库配置调优
5. 表结构优化建议

请提供：
- 原始SQL
- 表结构信息
- 数据量规模
- 当前性能问题

输出优化后的SQL和详细说明。`,
    description: '专业的SQL查询性能优化，提升数据库查询效率。',
    purpose: '代码开发',
    model: 'GPT-4',
    language: '中文',
    difficulty: 'advanced',
    inputExample: `SELECT * FROM orders 
WHERE status = 'completed' 
AND created_at > '2024-01-01'
ORDER BY created_at DESC
LIMIT 100;

表结构：orders表，数据量1000万条`,
    outputExample: `## 性能分析

### 问题识别
1. SELECT * 读取所有列，浪费IO
2. 缺少合适的索引
3. 大表全表扫描

### 优化方案

#### 1. 索引优化
\`\`\`sql
CREATE INDEX idx_orders_status_created 
ON orders(status, created_at DESC);
\`\`\`

#### 2. 查询重写
\`\`\`sql
SELECT id, order_no, customer_id, total_amount, status, created_at
FROM orders 
WHERE status = 'completed' 
AND created_at > '2024-01-01
ORDER BY created_at DESC
LIMIT 100;
\`\`\`

### 预期性能提升
- 从全表扫描 → 索引范围扫描
- 性能提升约50-100倍`,
    useCases: ['数据库优化', '性能调优', 'SQL优化'],
    version: '1.0.0',
    status: 'approved',
    rating: 4.7,
    ratingCount: 78,
    copyCount: 167,
    forkCount: 23,
    favoriteCount: 123,
    viewCount: 890,
    isFeatured: 0,
  },
  {
    title: '品牌故事叙述者',
    content: `你是一位品牌故事策划大师。请帮助品牌讲述动人的品牌故事。

故事结构：
1. 品牌起源（创始人的初心）
2. 核心挑战（遇到的困难）
3. 转折点（关键的决策）
4. 品牌使命（为什么存在）
5. 用户价值（为用户带来什么）

风格要求：
- 情感共鸣，打动人心
- 真实可信，避免空洞
- 简洁有力，易于传播

请提供品牌基本信息和品牌理念。`,
    description: '打造有温度的品牌故事，建立品牌情感连接。',
    purpose: '营销文案',
    model: 'Claude 3',
    language: '中文',
    difficulty: 'intermediate',
    inputExample: '品牌：做有机护肤品，创始人是一位妈妈，因为孩子皮肤敏感，所以开始研究天然成分',
    outputExample: `# 品牌故事：源于母爱的力量

## 起源

五年前，我是一个普通的妈妈。

孩子出生那天起，我最大的心愿就是给他最好的呵护。

可是，当我发现市面上的护肤品...

## 转折点

在第47次配方，我终于找到了答案。

原来，最简单的成分，最温柔的呵护。

这就是我们品牌的初心——

用妈妈的爱，做最好的产品。

每一瓶，都是给孩子的承诺。`,
    useCases: ['品牌建设', '内容营销', '企业传播'],
    version: '1.0.0',
    status: 'approved',
    rating: 4.5,
    ratingCount: 45,
    copyCount: 98,
    forkCount: 12,
    favoriteCount: 67,
    viewCount: 540,
    isFeatured: 0,
  },
  {
    title: '学术论文摘要润色',
    content: `You are an academic writing expert. Please help refine and polish academic paper abstracts.

Please improve:
1. Language precision and academic tone
2. Logical flow and structure
3. Clarity of expression
4. Grammar and vocabulary
5. Consistency with academic conventions

Provide:
- Revised version with track changes explanation
- Key improvements list
- Alternative phrasing options

Please provide the abstract and field of study.`,
    description: '专业的学术论文摘要润色，提升学术写作质量。',
    purpose: '教育学习',
    model: 'Claude 3',
    language: '英文',
    difficulty: 'advanced',
    inputExample: `This paper studies AI in education. We did some experiments and found it works well.`,
    outputExample: `## Revised Abstract

**Original:**  
"This paper studies AI in education. We did some experiments and found it works well."

**Revised:**  
"This study investigates the impact of artificial intelligence (AI) applications in educational settings. Through a series of controlled experiments involving 2,345 students across 12 institutions, we demonstrate significant improvements in learning outcomes (p < 0.05) and student engagement (37% increase) were achieved.

## Key Improvements

1. **Academic Tone**: "studies" → "investigates the impact of"
2. **Specificity**: Added methodology details and statistical significance
3. **Quantification**: Added concrete numbers to support findings
4. **Structure**: Clear research gap → methodology → results

## Alternative Phrasing
- "demonstrate" → "establish" / "confirm" / "establish"`,
    useCases: ['学术写作', '论文发表', '英语写作'],
    version: '1.0.0',
    status: 'approved',
    rating: 4.6,
    ratingCount: 34,
    copyCount: 78,
    forkCount: 9,
    favoriteCount: 45,
    viewCount: 420,
    isFeatured: 0,
  },
  {
    title: 'DALL-E创意海报设计',
    content: `You are a DALL-E prompt engineer. Transform creative concepts into professional DALL-E prompts.

Provide:
1. 3 variations
2. Each includes:
- Subject description
- Art style
- Lighting
- Color palette
- Composition
- Negative prompts

Also include parameter recommendations

Describe your poster concept.`,
    description: 'Create professional DALL-E poster designs for posters and illustrations.',
    purpose: '设计创意',
    model: 'DALL-E',
    language: 'English',
    difficulty: 'intermediate',
    inputExample: 'Coffee shop promotional poster, vintage style',
    outputExample: `## Version 1: Warm Vintage Coffee Poster

\`\`\`
Vintage coffee shop promotional poster, 1950s diner style, warm sepia tones, steaming coffee cup central composition, nostalgic atmosphere, hand-drawn typography "Fresh Coffee - Start Your Day Right", retro color palette of burnt orange, cream, and deep brown, textured paper background, soft warm lighting, classic poster art, professional graphic design, high detail, 8k --no blur, low quality
\`\`\`

### Design Notes
- Use --style raw for authentic vintage feel
- Try --version 3 for more photographic look

## Version 2: Minimalist Modern
...`,
    useCases: ['海报设计', '广告创意', '品牌视觉'],
    version: '1.0.0',
    status: 'approved',
    rating: 4.4,
    ratingCount: 56,
    copyCount: 134,
    forkCount: 18,
    favoriteCount: 89,
    viewCount: 678,
    isFeatured: 0,
  },
  {
    title: '客户投诉处理专家',
    content: `你是一位专业的客户服务专家。请根据客户投诉内容，生成专业的回复话术。

回复原则：
1. 同理心先行，表达理解和歉意
2. 承担责任，不推诿
3. 提供解决方案，而非解释
4. 给出具体的补偿措施
5. 表达改进的意愿

请提供：
- 3个不同语气的版本（正式/亲切/简洁）
- 每个版本包含完整的回复
- 沟通要点提示

请提供客户投诉内容和背景信息。`,
    description: '专业处理客户投诉，维护客户关系，化危机为机会。',
    purpose: '营销文案',
    model: 'Gemini',
    language: '中文',
    difficulty: 'beginner',
    inputExample: '客户投诉：外卖送错了，等了一个小时才送到，而且餐品还凉了',
    outputExample: `## 版本一：正式专业版

尊敬的客户，

非常抱歉给您带来了不愉快的用餐体验。我们深知等待了您宝贵的时间，这是我们的失误。

我们已经立即进行了内部调查，确认是配送环节出了问题。

为了表达我们的歉意，我们愿意：
1. 全额退款
2. 赠送您一张50元无门槛优惠券
3. 对相关责任人进行了培训

希望能给我们一次弥补的机会。

再次向您致以最诚挚的歉意。

---

## 版本二：亲切关怀版

您好，

看到您的留言，我们心里真的很抱歉...

## 沟通要点
✅ 先道歉，再解释
✅ 给出具体补偿，让客户有选择权
✅ 表达改进的诚意`,
    useCases: ['客户服务', '投诉处理', '客户关系维护'],
    version: '1.0.0',
    status: 'approved',
    rating: 4.7,
    ratingCount: 89,
    copyCount: 198,
    forkCount: 23,
    favoriteCount: 134,
    viewCount: 890,
    isFeatured: 0,
  },
  {
    title: '系统架构设计顾问',
    content: `你是一位资深系统架构师。请根据业务需求设计系统架构方案。

设计输出：
1. 系统架构图（Mermaid格式）
2. 技术选型说明
3. 核心模块划分
4. 数据流设计
5. 技术难点与解决方案
6. 高可用与扩展性设计
7. 成本估算

请描述你的业务需求和预期规模。`,
    description: '专业的系统架构设计，支撑业务发展。',
    purpose: '代码开发',
    model: 'GPT-4',
    language: '中文',
    difficulty: 'advanced',
    inputExample: '设计一个支持100万用户的在线教育平台',
    outputExample: `## 系统架构设计

### 架构图
\`\`\`mermaid
graph TB
    CDN --> Nginx
    Nginx --> WebService
    WebService --> Redis
    WebService --> MySQL
    WebService --> MQ
    MQ --> Worker
    Worker --> OSS
\`\`\`

### 技术选型
- 前端：React + TypeScript
- 后端：Node.js + Express
- 数据库：MySQL（主从）+ Redis（缓存）
- 消息队列：RabbitMQ
- 对象存储：阿里云OSS

### 核心模块
1. 用户服务
2. 课程服务
3. 直播服务
4. 支付服务

### 扩展性设计
- 水平扩展Web服务
- 数据库分库分表
- CDN加速静态资源`,
    useCases: ['系统设计', '技术架构', '技术方案'],
    version: '1.0.0',
    status: 'approved',
    rating: 4.8,
    ratingCount: 67,
    copyCount: 145,
    forkCount: 34,
    favoriteCount: 112,
    viewCount: 780,
    isFeatured: 1,
  },
];

export default async function seedData(db: Database): Promise<void> {
  const hashedPassword = await bcrypt.hash(PASSWORD, 10);

  users.forEach((user) => {
    db.run(
      'INSERT INTO users (email, username, password_hash, avatar, bio, role) VALUES (?, ?, ?, ?, ?, ?)',
      [user.email, user.username, hashedPassword, user.avatar, user.bio, user.role]
    );
  });

  tags.forEach((tag) => {
    db.run('INSERT INTO tags (name, category, color) VALUES (?, ?, ?)', [
      tag.name,
      tag.category,
      tag.color,
    ]);
  });

  const authorIds = [2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3];

  prompts.forEach((prompt, index) => {
    const authorId = authorIds[index % authorIds.length];

    const stmt = db.run(
      `INSERT INTO prompts (
        title, content, description, author_id, purpose, model, language, difficulty,
        input_example, output_example, use_cases, version, status, rating, rating_count,
        copy_count, fork_count, favorite_count, view_count, is_featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        prompt.title,
        prompt.content,
        prompt.description,
        authorId,
        prompt.purpose,
        prompt.model,
        prompt.language,
        prompt.difficulty,
        prompt.inputExample,
        prompt.outputExample,
        JSON.stringify(prompt.useCases),
        prompt.version,
        prompt.status,
        prompt.rating,
        prompt.ratingCount,
        prompt.copyCount,
        prompt.forkCount,
        prompt.favoriteCount,
        prompt.viewCount,
        prompt.isFeatured,
      ]
    );

    const promptId = stmt.getRowsModified() > 0 ? index + 1 : index + 1;

    db.run(
      'INSERT INTO prompt_versions (prompt_id, version, content, description, changelog) VALUES (?, ?, ?, ?, ?)',
      [promptId, prompt.version, prompt.content, prompt.description, '初始版本']
    );

    const purposeTagId = tags.findIndex((t) => t.name === prompt.purpose) + 1;
    const modelTagId = tags.findIndex((t) => t.name === prompt.model) + 1;
    const languageTagId = tags.findIndex((t) => t.name === prompt.language) + 1;
    const difficultyMap: Record<string, string> = {
      beginner: '入门',
      intermediate: '进阶',
      advanced: '高级',
    };
    const difficultyTagId =
      tags.findIndex((t) => t.name === difficultyMap[prompt.difficulty]) + 1;

    const tagIds = [purposeTagId, modelTagId, languageTagId, difficultyTagId];
    tagIds.forEach((tagId) => {
      db.run('INSERT INTO prompt_tags (prompt_id, tag_id) VALUES (?, ?)', [
        promptId,
        tagId,
      ]);
    });
  });

  const comments = [
    { promptId: 1, userId: 4, content: '非常实用的提示词，帮助我完成了很多文章写作任务！', parentId: null, likeCount: 12 },
    { promptId: 1, userId: 5, content: '结构很清晰，按照这个写出来的文章质量很高', parentId: null, likeCount: 8 },
    { promptId: 2, userId: 4, content: '重构后的代码质量提升很多，学习了！', parentId: null, likeCount: 15 },
    { promptId: 2, userId: 5, content: '设计模式应用得很巧妙', parentId: 1, likeCount: 5 },
    { promptId: 3, userId: 1, content: '设计思路很有启发性', parentId: null, likeCount: 7 },
    { promptId: 6, userId: 4, content: '作为英语学习者，这个提示词太棒了！', parentId: null, likeCount: 20 },
    { promptId: 6, userId: 5, content: '每天用这个练习，英语进步很快', parentId: null, likeCount: 14 },
    { promptId: 7, userId: 4, content: '组件写得很专业，已收藏', parentId: null, likeCount: 9 },
    { promptId: 8, userId: 5, content: '生成的图片效果惊艳！', parentId: null, likeCount: 11 },
    { promptId: 10, userId: 4, content: '面试前用这个准备，效果很好', parentId: null, likeCount: 18 },
    { promptId: 11, userId: 5, content: 'SQL优化建议很专业', parentId: null, likeCount: 6 },
    { promptId: 12, userId: 4, content: '品牌故事写得很感人', parentId: null, likeCount: 10 },
    { promptId: 16, userId: 5, content: '架构设计考虑得很周全', parentId: null, likeCount: 13 },
  ];

  comments.forEach((comment) => {
    db.run(
      'INSERT INTO comments (prompt_id, user_id, content, parent_id, like_count) VALUES (?, ?, ?, ?, ?)',
      [comment.promptId, comment.userId, comment.content, comment.parentId, comment.likeCount]
    );
  });

  const commentLikes = [
    { userId: 5, commentId: 1 },
    { userId: 4, commentId: 2 },
    { userId: 5, commentId: 3 },
    { userId: 4, commentId: 6 },
    { userId: 5, commentId: 7 },
    { userId: 4, commentId: 10 },
  ];

  commentLikes.forEach((like) => {
    db.run('INSERT INTO comment_likes (user_id, comment_id) VALUES (?, ?)', [
      like.userId,
      like.commentId,
    ]);
  });

  db.run(
    'INSERT INTO favorite_groups (user_id, name) VALUES (?, ?), (?, ?), (?, ?)',
    [4, '工作必备', 4, '学习资料', 5, '收藏夹1']
  );

  const favorites = [
    { userId: 4, promptId: 1, groupId: 1 },
    { userId: 4, promptId: 2, groupId: 1 },
    { userId: 4, promptId: 6, groupId: 2 },
    { userId: 4, promptId: 7, groupId: 1 },
    { userId: 4, promptId: 10, groupId: 2 },
    { userId: 5, promptId: 3, groupId: 3 },
    { userId: 5, promptId: 8, groupId: 3 },
    { userId: 5, promptId: 12, groupId: 3 },
    { userId: 5, promptId: 16, groupId: null },
    { userId: 1, promptId: 5, groupId: null },
  ];

  favorites.forEach((fav) => {
    db.run(
      'INSERT INTO favorites (user_id, prompt_id, group_id) VALUES (?, ?, ?)',
      [fav.userId, fav.promptId, fav.groupId]
    );
  });

  const follows = [
    { followerId: 4, followingId: 2 },
    { followerId: 4, followingId: 3 },
    { followerId: 5, followingId: 2 },
    { followerId: 5, followingId: 3 },
    { followerId: 1, followingId: 2 },
  ];

  follows.forEach((follow) => {
    db.run(
      'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)',
      [follow.followerId, follow.followingId]
    );
  });

  db.run(
    'UPDATE users SET follower_count = 3 WHERE id = 2'
  );
  db.run(
    'UPDATE users SET follower_count = 2 WHERE id = 3'
  );
  db.run(
    'UPDATE users SET following_count = 2 WHERE id = 4'
  );
  db.run(
    'UPDATE users SET following_count = 2 WHERE id = 5'
  );
  db.run(
    'UPDATE users SET following_count = 1 WHERE id = 1'
  );

  const reports = [
    { promptId: 4, reporterId: 4, reason: '内容质量差', description: '这个提示词的内容不够专业，建议审核', status: 'pending' },
  ];

  reports.forEach((report) => {
    db.run(
      'INSERT INTO reports (prompt_id, reporter_id, reason, description, status) VALUES (?, ?, ?, ?, ?)',
      [report.promptId, report.reporterId, report.reason, report.description, report.status]
    );
  });

  db.run(
    'INSERT INTO home_config (featured_prompts, banners, sort_rules) VALUES (?, ?, ?)',
    [
      JSON.stringify([1, 2, 3, 5, 6, 8, 10, 16]),
      JSON.stringify([
        { id: 1, title: '精选提示词', description: '发现优质AI提示词', imageUrl: '', linkUrl: '/category' },
        { id: 2, title: '新用户专享', description: '注册即送积分', imageUrl: '', linkUrl: '/register' },
      ]),
      JSON.stringify({ defaultSort: 'createdAt', featuredWeight: 2 }),
    ]
  );

  tags.forEach((_, index) => {
    const tagId = index + 1;
    const countResult = db.exec(
      'SELECT COUNT(*) as count FROM prompt_tags WHERE tag_id = ?',
      [tagId]
    );
    const count = countResult[0]?.values[0]?.[0] || 0;
    db.run('UPDATE tags SET prompt_count = ? WHERE id = ?', [count, tagId]);
  });
}
