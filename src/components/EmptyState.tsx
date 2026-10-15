import React from 'react';
import { Bookmark, Search, Plus, FolderOpen } from 'lucide-react';

interface EmptyStateProps {
  type: 'no-bookmarks' | 'no-search-results' | 'no-category-items' | 'no-favorites';
  searchQuery?: string;
  categoryName?: string;
  onActionClick: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  searchQuery,
  categoryName,
  onActionClick,
}) => {
  if (type === 'no-search-results') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-4">
          <Search className="w-7 h-7" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
          Không tìm thấy liên kết phù hợp
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
          Không có bookmark nào khớp với từ khóa "{searchQuery}". Hãy thử tìm với từ khóa khác hoặc xóa bộ lọc.
        </p>
        <button
          onClick={onActionClick}
          className="mt-4 px-4 py-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-xl transition-colors"
        >
          Xóa tìm kiếm
        </button>
      </div>
    );
  }

  if (type === 'no-favorites') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mb-4">
          <Bookmark className="w-7 h-7" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
          Chưa có liên kết yêu thích nào
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
          Nhấn vào biểu tượng ngôi sao trên bất kỳ thẻ liên kết nào để lưu vào danh sách truy cập nhanh.
        </p>
        <button
          onClick={onActionClick}
          className="mt-4 px-4 py-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-xl transition-colors"
        >
          Xem tất cả liên kết
        </button>
      </div>
    );
  }

  if (type === 'no-category-items') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-4">
          <FolderOpen className="w-7 h-7 text-indigo-500" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
          Thư mục "{categoryName || 'này'}" đang trống
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
          Bạn chưa lưu tài liệu nào vào thư mục này. Hãy thêm đường link đầu tiên để bắt đầu lưu trữ!
        </p>
        <button
          onClick={onActionClick}
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm link vào thư mục này</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
        <Bookmark className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
        Bắt đầu xây dựng kho tài liệu thông minh
      </h3>
      <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 max-w-md">
        Dán bất kỳ đường link nào trên Internet để tự động trích xuất tiêu đề, hình ảnh và phân loại theo thư mục dễ dàng.
      </p>
      <button
        onClick={onActionClick}
        className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-sm transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>+ Thêm đường link đầu tiên</span>
      </button>
    </div>
  );
};
