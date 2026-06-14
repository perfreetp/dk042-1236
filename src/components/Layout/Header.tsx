import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Menu,
  X,
  ChevronDown,
  User,
  FileText,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User as UserType } from '../../../shared/types';

interface HeaderProps {
  user?: UserType | null;
  onLogout?: () => void;
}

export default function Header({ user, onLogout }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsMobileMenuOpen(false);
    }
  };

  const handleLogout = () => {
    onLogout?.();
    setIsUserMenuOpen(false);
    navigate('/');
  };

  const navLinks = [
    { label: '首页', href: '/' },
    { label: '分类浏览', href: '/categories' },
    { label: '收藏夹', href: '/favorites' },
  ];

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-cream-50/80 backdrop-blur-md shadow-card border-b border-ink-100'
          : 'bg-transparent'
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-cream-50" />
            </div>
            <span className="text-xl font-display font-bold text-ink-900">
              PromptHub
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-ink-600 hover:text-ink-900 transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <form
            onSubmit={handleSearch}
            className="hidden md:flex items-center flex-1 max-w-md mx-8"
          >
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索提示词..."
                className="w-full pl-10 pr-4 py-2 bg-cream-100 border border-ink-200 rounded-lg text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>
          </form>

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-ink-100 transition-colors"
                >
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-9 h-9 rounded-full object-cover border-2 border-ink-200"
                  />
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 text-ink-600 transition-transform',
                      isUserMenuOpen && 'rotate-180'
                    )}
                  />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-cream-50 rounded-xl shadow-card-hover border border-ink-100 py-2 animate-scale-in">
                    <div className="px-4 py-3 border-b border-ink-100">
                      <p className="font-semibold text-ink-900">{user.username}</p>
                      <p className="text-sm text-ink-500">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/profile"
                        className="flex items-center gap-3 px-4 py-2 text-ink-700 hover:bg-ink-100 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        个人中心
                      </Link>
                      <Link
                        to="/my-prompts"
                        className="flex items-center gap-3 px-4 py-2 text-ink-700 hover:bg-ink-100 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <FileText className="w-4 h-4" />
                        我的发布
                      </Link>
                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          className="flex items-center gap-3 px-4 py-2 text-ink-700 hover:bg-ink-100 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Settings className="w-4 h-4" />
                          管理后台
                        </Link>
                      )}
                    </div>
                    <div className="pt-1 border-t border-ink-100">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2 text-vermilion-500 hover:bg-ink-100 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        退出登录
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-ink-700 hover:text-ink-900 transition-colors font-medium"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 bg-amber-500 text-cream-50 rounded-lg font-medium hover:bg-amber-600 transition-colors shadow-button hover:shadow-button-hover"
                >
                  注册
                </Link>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-ink-700 hover:bg-ink-100 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 animate-slide-down">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索提示词..."
                  className="w-full pl-10 pr-4 py-2 bg-cream-100 border border-ink-200 rounded-lg text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </form>

            <nav className="flex flex-col gap-2 mb-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="px-4 py-3 text-ink-700 hover:bg-ink-100 rounded-lg transition-colors font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {user ? (
              <div className="border-t border-ink-200 pt-4 space-y-2">
                <div className="flex items-center gap-3 px-4 py-2">
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-ink-900">{user.username}</p>
                    <p className="text-sm text-ink-500">{user.email}</p>
                  </div>
                </div>
                <Link
                  to="/profile"
                  className="flex items-center gap-3 px-4 py-3 text-ink-700 hover:bg-ink-100 rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <User className="w-4 h-4" />
                  个人中心
                </Link>
                <Link
                  to="/my-prompts"
                  className="flex items-center gap-3 px-4 py-3 text-ink-700 hover:bg-ink-100 rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <FileText className="w-4 h-4" />
                  我的发布
                </Link>
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-3 px-4 py-3 text-ink-700 hover:bg-ink-100 rounded-lg transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Settings className="w-4 h-4" />
                    管理后台
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-3 text-vermilion-500 hover:bg-ink-100 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  退出登录
                </button>
              </div>
            ) : (
              <div className="border-t border-ink-200 pt-4 flex flex-col gap-2">
                <Link
                  to="/login"
                  className="px-4 py-3 text-center text-ink-700 hover:bg-ink-100 rounded-lg transition-colors font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-3 text-center bg-amber-500 text-cream-50 rounded-lg font-medium hover:bg-amber-600 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  注册
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
