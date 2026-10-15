import React from 'react';
import {
  Search,
  X,
  LayoutGrid,
  List,
  Menu,
  Plus,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { ViewMode, Category } from '../types';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortBy: 'date-desc' | 'date-asc' | 'title-asc';
  onSortByChange: (sort: 'date-desc' | 'date-asc' | 'title-asc') => void;
  selectedCategoryId: string | null;
  selectedFilter: 'all' | 'favorites' | 'uncategorized';
  selectedTag: string | null;
  categories: Category[];
  totalMatches: number;
  onOpenAddBookmark: () => void;
  onOpenMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortByChange,
  selectedCategoryId,
  selectedFilter,
  selectedTag,
  categories,
  totalMatches,
  onOpenAddBookmark,
  onOpenMobileSidebar,
}) => {
  // Compute breadcrumb label
  const getHeaderTitle = () => {
    if (selectedTag) {
      return (
        <span className="flex items-center gap-1.5">
          <span className="text-slate-400">Thẻ từ khóa:</span>
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">#{selectedTag}</span>
        </span>
      );
    }
    if (selectedFilter === 'favorites') {
      return <span className="font-semibold text-slate-800 dark:text-slate-100">Liên kết yêu thích</span>;
    }
    if (selectedFilter === 'uncategorized') {
      return <span className="font-semibold text-slate-800 dark:text-slate-100">Chưa phân loại</span>;
    }
    if (selectedCategoryId) {
      const cat = categories.find((c) => c.id === selectedCategoryId);
      if (cat) {
        if (cat.parentId) {
          const parent = categories.find((c) => c.id === cat.parentId);
          return (
            <span className="flex items-center gap-1 text-sm font-medium">
              <span className="text-slate-400">{parent?.name || 'Thư mục'}</span>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">{cat.name}</span>
            </span>
          );
        }
        return <span className="font-semibold text-slate-800 dark:text-slate-100">{cat.name}</span>;
      }
    }
    return <span className="font-semibold text-slate-800 dark:text-slate-100">Tất cả tài liệu</span>;
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 py-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left zone: Mobile toggle + Breadcrumb title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileSidebar}
            className="p-2 md:hidden text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Mở thanh điều hướng"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-baseline gap-2">
            <h2 className="text-base md:text-lg text-slate-900 dark:text-white truncate">
              {getHeaderTitle()}
            </h2>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono tabular-nums">
              ({totalMatches})
            </span>
          </div>
        </div>

        {/* Center / Right zone: Search bar + View Controls */}
        <div className="flex items-center gap-2.5 flex-1 md:max-w-xl md:justify-end">
          {/* Live Search Input */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm theo tên, link, tag, ghi chú..."
              className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title="Xóa tìm kiếm"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort order select */}
          <div className="relative shrink-0">
            <select
              value={sortBy}
              onChange={(e) =>
                onSortByChange(e.target.value as 'date-desc' | 'date-asc' | 'title-asc')
              }
              className="appearance-none bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium py-2 pl-2.5 pr-7 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              title="Sắp xếp danh sách"
            >
              <option value="date-desc">Mới nhất</option>
              <option value="date-asc">Cũ nhất</option>
              <option value="title-asc">Tên (A-Z)</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* View mode toggle (Grid / List) */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 shrink-0">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              title="Chế độ Thẻ (Lưới)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              title="Chế độ Danh sách"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Add bookmark button (Desktop) */}
          <button
            onClick={onOpenAddBookmark}
            className="hidden sm:inline-flex items-center gap-1.5 py-2 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl shadow-xs transition-colors shrink-0"
            title="Thêm link mới"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm link</span>
          </button>
        </div>
      </div>
    </header>
  );
};
