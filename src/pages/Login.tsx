import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Github,
  Twitter,
  Chrome,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Shield,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/store/authStore';
import type { LoginRequest } from '../../shared/types';

interface DemoAccount {
  label: string;
  email: string;
  password: string;
  icon: typeof Shield;
  color: string;
  description: string;
}

const demoAccounts: DemoAccount[] = [
  {
    label: '管理员',
    email: 'admin@example.com',
    password: 'admin123',
    icon: Shield,
    color: 'bg-moss-500/10 text-moss-700 hover:bg-moss-500/20',
    description: '完整后台管理权限',
  },
  {
    label: '创作者',
    email: 'author@example.com',
    password: 'author123',
    icon: Sparkles,
    color: 'bg-amber-500/10 text-amber-700 hover:bg-amber-500/20',
    description: '发布和管理提示词',
  },
  {
    label: '普通用户',
    email: 'user@example.com',
    password: 'user123',
    icon: User,
    color: 'bg-ink-100 text-ink-700 hover:bg-ink-200',
    description: '浏览和收藏提示词',
  },
];

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated, user, isLoading } = useAuthStore();
  const { toast } = useToast();

  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof LoginRequest, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      const redirect = searchParams.get('redirect');
      navigate(redirect || '/');
    }
  }, [isAuthenticated, user, navigate, searchParams]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof LoginRequest, string>> = {};

    if (!formData.email.trim()) {
      newErrors.email = '请输入邮箱地址';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }

    if (!formData.password) {
      newErrors.password = '请输入密码';
    } else if (formData.password.length < 6) {
      newErrors.password = '密码至少需要6个字符';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await login(formData);
      if (response.success) {
        toast.success('登录成功');
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', formData.email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
      } else {
        toast.error(response.error || '登录失败，请检查邮箱和密码');
      }
    } catch {
      toast.error('登录失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (account: DemoAccount) => {
    setFormData({ email: account.email, password: account.password });
    setIsSubmitting(true);
    try {
      const response = await login({
        email: account.email,
        password: account.password,
      });
      if (response.success) {
        toast.success(`已以${account.label}身份登录`);
      } else {
        toast.error(response.error || '登录失败');
      }
    } catch {
      toast.error('登录失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 bg-cream-100 flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-cream-50" />
            </div>
          </Link>
          <h1 className="font-display text-3xl font-bold text-ink-900 mb-2">
            欢迎回来
          </h1>
          <p className="text-ink-500">登录你的账号，探索更多优质提示词</p>
        </div>

        {/* Login Card */}
        <div className="bg-cream-50 rounded-2xl border border-ink-100 shadow-card-hover p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                邮箱地址
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="your@email.com"
                  className={cn(
                    'input-field pl-10',
                    errors.email && 'border-vermilion-500 focus:border-vermilion-500'
                  )}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-vermilion-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="请输入密码"
                  className={cn(
                    'input-field pl-10 pr-10',
                    errors.password && 'border-vermilion-500 focus:border-vermilion-500'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-vermilion-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember me & Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-amber-500 border-ink-300 rounded focus:ring-amber-500"
                />
                <span className="text-sm text-ink-600">记住我</span>
              </label>
              <button
                type="button"
                className="text-sm text-amber-600 hover:text-amber-700 transition-colors"
              >
                忘记密码？
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full btn-primary bg-amber-500 text-cream-50 py-3 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <LogIn className="w-5 h-5" />
              )}
              {isSubmitting ? '登录中...' : '登录'}
            </button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-6 pt-6 border-t border-ink-100">
            <p className="text-center text-sm text-ink-500 mb-4">
              或使用演示账号快速体验
            </p>
            <div className="space-y-3">
              {demoAccounts.map((account) => {
                const Icon = account.icon;
                return (
                  <button
                    key={account.email}
                    onClick={() => handleDemoLogin(account)}
                    disabled={isSubmitting}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg border border-ink-200 transition-all hover:shadow-card disabled:opacity-50',
                      account.color
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <div className="text-left flex-1">
                      <p className="font-medium text-sm">{account.label}</p>
                      <p className="text-xs opacity-70">{account.description}</p>
                    </div>
                    <CheckCircle2 className="w-4 h-4 opacity-50" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Social Login */}
          <div className="mt-6 pt-6 border-t border-ink-100">
            <p className="text-center text-sm text-ink-500 mb-4">
              使用第三方账号登录
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                className="p-3 bg-cream-100 hover:bg-ink-100 rounded-lg transition-colors"
                title="Google 登录"
              >
                <Chrome className="w-5 h-5 text-ink-600" />
              </button>
              <button
                type="button"
                className="p-3 bg-cream-100 hover:bg-ink-100 rounded-lg transition-colors"
                title="GitHub 登录"
              >
                <Github className="w-5 h-5 text-ink-600" />
              </button>
              <button
                type="button"
                className="p-3 bg-cream-100 hover:bg-ink-100 rounded-lg transition-colors"
                title="Twitter 登录"
              >
                <Twitter className="w-5 h-5 text-ink-600" />
              </button>
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <span className="text-ink-500">还没有账号？</span>{' '}
            <Link
              to="/register"
              className="text-amber-600 hover:text-amber-700 font-medium transition-colors"
            >
              立即注册
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-ink-400">
          <p>登录即表示你同意我们的服务条款和隐私政策</p>
        </div>
      </div>
    </div>
  );
}
