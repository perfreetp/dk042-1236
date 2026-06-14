export interface User {
  id: number;
  email: string;
  username: string;
  avatar: string;
  bio: string;
  role: 'user' | 'author' | 'admin';
  createdAt: string;
  followerCount: number;
  followingCount: number;
}

export interface Tag {
  id: number;
  name: string;
  category: 'purpose' | 'model' | 'language' | 'difficulty';
  color: string;
  promptCount: number;
}

export interface Prompt {
  id: number;
  title: string;
  content: string;
  description: string;
  authorId: number;
  author: User;
  tags: Tag[];
  purpose: string;
  model: string;
  language: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  inputExample: string;
  outputExample: string;
  useCases: string[];
  version: string;
  versionHistory: PromptVersion[];
  status: 'pending' | 'approved' | 'rejected' | 'removed';
  rating: number;
  ratingCount: number;
  copyCount: number;
  forkCount: number;
  favoriteCount: number;
  viewCount: number;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PromptVersion {
  id: number;
  promptId: number;
  version: string;
  content: string;
  description: string;
  changelog: string;
  createdAt: string;
}

export interface Comment {
  id: number;
  promptId: number;
  userId: number;
  user: User;
  content: string;
  parentId: number | null;
  likeCount: number;
  isLiked: boolean;
  createdAt: string;
}

export interface Favorite {
  id: number;
  userId: number;
  promptId: number;
  prompt: Prompt;
  groupId: number | null;
  createdAt: string;
}

export interface FavoriteGroup {
  id: number;
  userId: number;
  name: string;
  promptCount: number;
}

export interface Report {
  id: number;
  promptId: number;
  reporterId: number;
  reason: string;
  description: string;
  status: 'pending' | 'resolved' | 'rejected';
  createdAt: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreatePromptRequest {
  title: string;
  content: string;
  description: string;
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

export interface RatePromptRequest {
  rating: number;
}

export interface CreateCommentRequest {
  promptId: number;
  content: string;
  parentId?: number;
}

export interface CreateReportRequest {
  promptId: number;
  reason: string;
  description: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface HomeConfig {
  featuredPrompts: number[];
  banners: Banner[];
  sortRules: {
    defaultSort: string;
    featuredWeight: number;
  };
}

export interface Banner {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
}
