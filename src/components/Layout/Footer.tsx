import { Link } from 'react-router-dom';
import { Sparkles, Github, Twitter, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FooterProps {
  className?: string;
}

export default function Footer({ className }: FooterProps) {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: '首页', href: '/' },
    { label: '分类浏览', href: '/categories' },
    { label: '热门推荐', href: '/trending' },
    { label: '最新发布', href: '/latest' },
  ];

  const supportLinks = [
    { label: '帮助中心', href: '/help' },
    { label: '使用指南', href: '/guide' },
    { label: '反馈建议', href: '/feedback' },
    { label: '联系我们', href: '/contact' },
  ];

  const legalLinks = [
    { label: '用户协议', href: '/terms' },
    { label: '隐私政策', href: '/privacy' },
    { label: '版权声明', href: '/copyright' },
  ];

  const socialLinks = [
    { icon: Github, href: 'https://github.com', label: 'GitHub' },
    { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
    { icon: Mail, href: 'mailto:contact@prompthub.com', label: 'Email' },
  ];

  return (
    <footer
      className={cn(
        'bg-ink-900 text-cream-100 pt-16 pb-8 mt-auto',
        className
      )}
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-cream-50" />
              </div>
              <span className="text-xl font-display font-bold text-cream-50">
                PromptHub
              </span>
            </Link>
            <p className="text-ink-400 mb-6 max-w-xs">
              分享、发现和使用高质量的 AI 提示词，释放你的创作潜力。
            </p>
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-ink-800 rounded-lg flex items-center justify-center text-ink-400 hover:bg-amber-500 hover:text-cream-50 transition-all"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-cream-50 mb-4">快速链接</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-ink-400 hover:text-amber-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-cream-50 mb-4">支持</h3>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-ink-400 hover:text-amber-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-cream-50 mb-4">订阅更新</h3>
            <p className="text-ink-400 mb-4 text-sm">
              获取最新的提示词和平台动态
            </p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="输入邮箱地址"
                className="flex-1 px-4 py-2 bg-ink-800 border border-ink-700 rounded-lg text-cream-50 placeholder-ink-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 text-cream-50 rounded-lg font-medium hover:bg-amber-600 transition-colors"
              >
                订阅
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-ink-800 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-ink-500 text-sm">
              © {currentYear} PromptHub. 保留所有权利。
            </p>
            <div className="flex items-center gap-6">
              {legalLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-ink-500 hover:text-ink-400 text-sm transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
