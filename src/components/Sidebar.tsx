import React, { useState } from 'react';
import {
  Bookmark as BookmarkIcon,
  Star,
  Folder,
  FolderPlus,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Plus,
  Edit2,
  Trash2,
  Tag as TagIcon,
  Sun,
  Moon,
  Sparkles,
  Code2,
  Layout,
  Server,
  BookOpen,
  Globe,
  FileText,
  HelpCircle,
  Download,
  Upload,
} from 'lucide-react';
import { Category, Bookmark, ThemeMode } from '../types';

interface SidebarProps {
  categories: Category[];
  bookmarks: Bookmark[];
  selectedCategoryId: string | null;
  selectedFilter: 'all' | 'favorites' | 'uncategorized';
  selectedTag: string | null;
  theme: ThemeMode;
  onSelectCategory: (categoryId: string | null) => void;
  onSelectFilter: (filter: 'all' | 'favorites' | 'uncategorized') => void;
  onSelectTag: (tag: string | null) => void;
  onToggleTheme: () => void;
  onOpenAddCategory: (parentId?: string | null) => void;
  onOpenEditCategory: (category: Category) => void;
  onDeleteCategory: (category: Category) => void;
  onOpenAddBookmark: () => void;
  onOpenImportExport: () => void;
  onOpenGuide: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  isUsingFirestore?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  categories,
  bookmarks,
  selectedCategoryId,
  selectedFilter,
  selectedTag,
  theme,
  onSelectCategory,
  onSelectFilter,
  onSelectTag,
  onToggleTheme,
  onOpenAddCategory,
  onOpenEditCategory,
  onDeleteCategory,
  onOpenAddBookmark,
  onOpenImportExport,
  onOpenGuide,
  isMobileOpen,
  onCloseMobile,
  isUsingFirestore = false,
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Group top-level categories and sub-categories
  const rootCategories = categories.filter((c) => !c.parentId);
  const getSubcategories = (parentId: string) =>
    categories.filter((c) => c.parentId === parentId);

  // Compute counts
  const totalCount = bookmarks.length;
  const favoriteCount = bookmarks.filter((b) => b.isFavorite).length;
  const uncategorizedCount = bookmarks.filter((b) => !b.categoryId).length;

  const getCategoryCount = (catId: string) => {
    // Include bookmarks in this category and all its direct subcategories
    const subIds = getSubcategories(catId).map((s) => s.id);
    return bookmarks.filter(
      (b) => b.categoryId === catId || (b.categoryId && subIds.includes(b.categoryId))
    ).length;
  };

  // Extract all unique tags
  const allTags = Array.from(
    new Set(bookmarks.flatMap((b) => b.tags || []).filter(Boolean))
  ).slice(0, 15);

  const getCategoryIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Code2':
        return <Code2 className="w-4 h-4" />;
      case 'Layout':
        return <Layout className="w-4 h-4" />;
      case 'Server':
        return <Server className="w-4 h-4" />;
      case 'Sparkles':
        return <Sparkles className="w-4 h-4" />;
      case 'BookOpen':
        return <BookOpen className="w-4 h-4" />;
      case 'FileText':
        return <FileText className="w-4 h-4" />;
      default:
        return <Folder className="w-4 h-4" />;
    }
  };

  const renderCategoryItem = (cat: Category, level: number = 0) => {
    const subcats = getSubcategories(cat.id);
    const hasChildren = subcats.length > 0;
    const isExpanded = expandedFolders[cat.id] ?? true;
    const isSelected = selectedCategoryId === cat.id && selectedFilter === 'all';
    const count = getCategoryCount(cat.id);

    return (
      <div key={cat.id} className="select-none">
        <div
          onClick={() => {
            onSelectCategory(cat.id);
            onCloseMobile();
          }}
          style={{ paddingLeft: `${12 + level * 16}px` }}
          className={`group flex items-center justify-between py-2 pr-2.5 rounded-lg cursor-pointer text-sm font-medium transition-colors ${
            isSelected
              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
              : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {hasChildren ? (
              <button
                onClick={(e) => toggleExpand(cat.id, e)}
                className="p-0.5 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 rounded"
                title={isExpanded ? 'Thu gọn' : 'Mở rộng'}
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <span className="w-3.5" />
            )}

            <span
              className="shrink-0"
              style={{ color: cat.color || undefined }}
            >
              {getCategoryIcon(cat.icon)}
            </span>

            <span className="truncate">{cat.name}</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-400 font-mono tabular-nums px-1.5 py-0.5 rounded group-hover:hidden">
              {count}
            </span>

            {/* Quick Actions on Hover */}
            <div className="hidden group-hover:flex items-center gap-0.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenAddCategory(cat.id);
                }}
                className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded"
                title="Thêm thư mục con"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenEditCategory(cat);
                }}
                className="p-1 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded"
                title="Chỉnh sửa thư mục"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteCategory(cat);
                }}
                className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded"
                title="Xóa thư mục"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-0.5 space-y-0.5">
            {subcats.map((sub) => renderCategoryItem(sub, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white shadow-sm">
              <BookmarkIcon className="w-5 h-5 fill-white/20" />
            </div>
            <div>
              <h1 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                Smart Bookmark
              </h1>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Kho tài liệu thông minh
              </p>
            </div>
          </div>

          <button
            onClick={onToggleTheme}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Primary CTA button */}
        <div className="p-3">
          <button
            onClick={() => {
              onOpenAddBookmark();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-sm rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm link tài liệu</span>
          </button>
        </div>

        {/* Nav lists (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
          {/* Main quick filters */}
          <div className="space-y-1">
            <button
              onClick={() => {
                onSelectFilter('all');
                onSelectCategory(null);
                onSelectTag(null);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedFilter === 'all' && selectedCategoryId === null && selectedTag === null
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-slate-400" />
                <span>Tất cả liên kết</span>
              </div>
              <span className="text-xs text-slate-400 font-mono tabular-nums">
                {totalCount}
              </span>
            </button>

            <button
              onClick={() => {
                onSelectFilter('favorites');
                onSelectCategory(null);
                onSelectTag(null);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedFilter === 'favorites'
                  ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Yêu thích</span>
              </div>
              <span className="text-xs text-slate-400 font-mono tabular-nums">
                {favoriteCount}
              </span>
            </button>

            <button
              onClick={() => {
                onSelectFilter('uncategorized');
                onSelectCategory(null);
                onSelectTag(null);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedFilter === 'uncategorized'
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FolderOpen className="w-4 h-4 text-slate-400" />
                <span>Chưa phân loại</span>
              </div>
              <span className="text-xs text-slate-400 font-mono tabular-nums">
                {uncategorizedCount}
              </span>
            </button>
          </div>

          {/* Categories Tree */}
          <div>
            <div className="flex items-center justify-between px-3 mb-1.5">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 tracking-wider">
                THƯ MỤC TÀI LIỆU
              </span>
              <button
                onClick={() => onOpenAddCategory(null)}
                className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                title="Tạo thư mục mới"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>Thêm</span>
              </button>
            </div>

            <div className="space-y-0.5">
              {rootCategories.length === 0 ? (
                <div className="px-3 py-3 text-xs text-slate-400 dark:text-slate-500 italic">
                  Chưa có thư mục nào. Nhấn "+ Thêm" để tạo.
                </div>
              ) : (
                rootCategories.map((cat) => renderCategoryItem(cat))
              )}
            </div>
          </div>

          {/* Tags list */}
          {allTags.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-3 mb-2">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 tracking-wider">
                  THẺ TỪ KHÓA (TAGS)
                </span>
                {selectedTag && (
                  <button
                    onClick={() => onSelectTag(null)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Bỏ lọc
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 px-2">
                {allTags.map((tag) => {
                  const isTagActive = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => {
                        onSelectTag(isTagActive ? null : tag);
                        onCloseMobile();
                      }}
                      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md transition-colors ${
                        isTagActive
                          ? 'bg-indigo-600 text-white font-medium'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <TagIcon className="w-3 h-3 opacity-60" />
                      <span>{tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer utility buttons */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => {
                onOpenImportExport();
                onCloseMobile();
              }}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200/80 dark:border-slate-800"
              title="Sao lưu hoặc khôi phục dữ liệu JSON"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Sao lưu / Nạp</span>
            </button>

            <button
              onClick={() => {
                onOpenGuide();
                onCloseMobile();
              }}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200/80 dark:border-slate-800"
              title="Hướng dẫn chạy dự án trên máy tính"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
              <span>Chạy máy tính</span>
            </button>
          </div>

          <div className="pt-2 px-1 text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
            <span className={isUsingFirestore ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
              {isUsingFirestore ? 'Firestore Online' : 'Lưu trữ Cục bộ'}
            </span>
            <span className="font-mono">
              {isUsingFirestore ? 'Đang đồng bộ' : 'Tự động lưu'}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
