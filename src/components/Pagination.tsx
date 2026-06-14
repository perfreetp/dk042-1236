import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5,
  className,
}: PaginationProps) {
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);

    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);

    if (endPage - startPage + 1 < maxVisiblePages) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      } else {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
    }

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('ellipsis');
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('ellipsis');
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  const handlePageClick = (page: number) => {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="分页导航"
      className={cn('flex items-center justify-center gap-2', className)}
    >
      <button
        onClick={() => handlePageClick(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-lg border transition-all',
          currentPage === 1
            ? 'bg-ink-50 border-ink-200 text-ink-400 cursor-not-allowed'
            : 'bg-cream-50 border-ink-200 text-ink-700 hover:bg-amber-500 hover:text-cream-50 hover:border-amber-500'
        )}
        aria-label="上一页"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {pages.map((page, index) => (
        <div key={index}>
          {page === 'ellipsis' ? (
            <span className="flex items-center justify-center w-10 h-10 text-ink-400">
              <MoreHorizontal className="w-5 h-5" />
            </span>
          ) : (
            <button
              onClick={() => handlePageClick(page)}
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-lg border font-medium transition-all',
                currentPage === page
                  ? 'bg-amber-500 text-cream-50 border-amber-500 shadow-button'
                  : 'bg-cream-50 text-ink-700 border-ink-200 hover:bg-amber-500 hover:text-cream-50 hover:border-amber-500'
              )}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </button>
          )}
        </div>
      ))}

      <button
        onClick={() => handlePageClick(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-lg border transition-all',
          currentPage === totalPages
            ? 'bg-ink-50 border-ink-200 text-ink-400 cursor-not-allowed'
            : 'bg-cream-50 border-ink-200 text-ink-700 hover:bg-amber-500 hover:text-cream-50 hover:border-amber-500'
        )}
        aria-label="下一页"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </nav>
  );
}
