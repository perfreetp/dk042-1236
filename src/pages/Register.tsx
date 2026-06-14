import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/store/authStore';
import type { RegisterRequest } from '../../shared/types';

interface RegisterFormData extends RegisterRequest {
  confirmPassword: string;
}

type PasswordStrength = 'weak' | 'medium' | 'strong';

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, isAuthenticated, user, isLoading } = useAuthStore();
  const { toast } = useToast();

  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData | 'terms', string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>('weak');

  useEffect(() => {
    if (isAuthenticated && user) {
      const redirect = searchParams.get('redirect');
      navigate(redirect || '/');
    }
  }, [isAuthenticated, user, navigate, searchParams]);

  useEffect(() => {
    const calculateStrength = (password: string): PasswordStrength => {
      if (!password) return 'weak';
      
      let score = 0;
      if (password.length >= 8) score++;
      if (/[A-Z]/.test(password)) score++;
      if (/[0-9]/.test(password)) score++;
      if (/[^A-Za-z0-9]/.test(password)) score++;

      if (score <= 1) return 'weak';
      if (score <= 2) return 'medium';
      return 'strong';
    };

    setPasswordStrength(calculateStrength(formData.password));
  }, [formData.password]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof RegisterFormData | 'terms', string>> = {};

    if (!formData.username.trim()) {
      newErrors.username = '请输入用户名';
    } else if (formData.username.length < 2) {
      newErrors.username = '用户名至少需要2个字符';
    } else if (formData.username.length > 20) {
      newErrors.username = '用户名不能超过20个字符';
    }

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

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '请确认密码';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }

    if (!agreeTerms) {
      newErrors.terms = '请阅读并同意服务条款和隐私政策';
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
      const { confirmPassword, ...registerData } = formData;
      void confirmPassword;
      const response = await register(registerData);
      if (response.success) {
        setRegistrationSuccess(true);
        toast.success('注册成功');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        toast.error(response.error || '注册失败，请稍后重试');
      }
    } catch {
      toast.error('注册失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const strengthConfig: Record<PasswordStrength, { label: string; color: string; width: string }> = {
    weak: { label: '弱', color: 'bg-vermilion-500', width: 'w-1/3' },
    medium: { label: '中', color: 'bg-amber-500', width: 'w-2/3' },
    strong: { label: '强', color: 'bg-moss-500', width: 'w-full' },
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen pt-20 pb-12 bg-cream-100 flex items-center justify-center">
        <div className="w-full max-w-md px-4">
          <div className="bg-cream-50 rounded-2xl border border-ink-100 shadow-card-hover p-8 text-center animate-fade-in-up">
            <div className="w-16 h-16 bg-moss-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-moss-600" />
            </div>
            <h1 className="font-display text-2xl font-bold text-ink-900 mb-2">
              注册成功！
            </h1>
            <p className="text-ink-500 mb-6">
              欢迎加入Prompt社区，正在为你跳转到首页...
            </p>
            <div className="flex items-center justify-center gap-2 text-amber-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>跳转中...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 bg-cream-100 flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-cream-50" />
            </div>
          </Link>
          <h1 className="font-display text-3xl font-bold text-ink-900 mb-2">
            创建账号
          </h1>
          <p className="text-ink-500">加入我们，分享和发现优质提示词</p>
        </div>

        <div className="bg-cream-50 rounded-2xl border border-ink-100 shadow-card-hover p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                用户名
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  placeholder="请输入用户名"
                  className={cn(
                    'input-field pl-10',
                    errors.username && 'border-vermilion-500 focus:border-vermilion-500'
                  )}
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-vermilion-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.username}
                </p>
              )}
            </div>

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
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-ink-500">密码强度</span>
                    <span className={cn(
                      'text-xs font-medium',
                      passwordStrength === 'weak' && 'text-vermilion-600',
                      passwordStrength === 'medium' && 'text-amber-600',
                      passwordStrength === 'strong' && 'text-moss-600'
                    )}>
                      {strengthConfig[passwordStrength].label}
                    </span>
                  </div>
                  <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all duration-300',
                        strengthConfig[passwordStrength].color,
                        strengthConfig[passwordStrength].width
                      )}
                    />
                  </div>
                  <div className="mt-2 text-xs text-ink-400 space-y-0.5">
                    <p className={cn(formData.password.length >= 8 && 'text-moss-600')}>
                      {formData.password.length >= 8 ? '✓' : '○'} 至少8个字符
                    </p>
                    <p className={cn(/[A-Z]/.test(formData.password) && 'text-moss-600')}>
                      {/[A-Z]/.test(formData.password) ? '✓' : '○'} 包含大写字母
                    </p>
                    <p className={cn(/[0-9]/.test(formData.password) && 'text-moss-600')}>
                      {/[0-9]/.test(formData.password) ? '✓' : '○'} 包含数字
                    </p>
                    <p className={cn(/[^A-Za-z0-9]/.test(formData.password) && 'text-moss-600')}>
                      {/[^A-Za-z0-9]/.test(formData.password) ? '✓' : '○'} 包含特殊字符
                    </p>
                  </div>
                </div>
              )}
              {errors.password && (
                <p className="mt-1 text-sm text-vermilion-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                确认密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  placeholder="请再次输入密码"
                  className={cn(
                    'input-field pl-10 pr-10',
                    errors.confirmPassword && 'border-vermilion-500 focus:border-vermilion-500'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {formData.confirmPassword && formData.password && (
                <div className="mt-1">
                  {formData.password === formData.confirmPassword ? (
                    <p className="text-sm text-moss-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      密码匹配
                    </p>
                  ) : (
                    <p className="text-sm text-vermilion-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      密码不匹配
                    </p>
                  )}
                </div>
              )}
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-vermilion-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Terms Agreement */}
            <div className="pt-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className={cn(
                    'w-4 h-4 mt-0.5 text-amber-500 border-ink-300 rounded focus:ring-amber-500',
                    errors.terms && 'border-vermilion-500'
                  )}
                />
                <span className="text-sm text-ink-600">
                  我已阅读并同意{' '}
                  <button
                    type="button"
                    className="text-amber-600 hover:text-amber-700 transition-colors"
                  >
                    服务条款
                  </button>{' '}
                  和{' '}
                  <button
                    type="button"
                    className="text-amber-600 hover:text-amber-700 transition-colors"
                  >
                    隐私政策
                  </button>
                </span>
              </label>
              {errors.terms && (
                <p className="mt-1 text-sm text-vermilion-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.terms}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full btn-primary bg-amber-500 text-cream-50 py-3 disabled:opacity-50 mt-4"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <UserPlus className="w-5 h-5" />
              )}
              {isSubmitting ? '注册中...' : '创建账号'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <span className="text-ink-500">已有账号？</span>{' '}
            <Link
              to="/login"
              className="text-amber-600 hover:text-amber-700 font-medium transition-colors"
            >
              立即登录
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-ink-400">
          <p>注册即表示你同意我们的服务条款和隐私政策</p>
        </div>
      </div>
    </div>
  );
}
