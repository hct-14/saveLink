import React, { useState, useEffect } from 'react';
import {
  X,
  FolderPlus,
  Folder,
  Code2,
  Layout,
  Server,
  Sparkles,
  BookOpen,
  FileText,
  Globe,
  Loader2,
} from 'lucide-react';
import { Category } from '../types';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (categoryData: Partial<Category>) => Promise<void>;
  categories: Category[];
  initialCategory?: Category | null;
  defaultParentId?: string | null;
}

const AVAILABLE_ICONS = [
  { name: 'Folder', label: 'Thư mục', Icon: Folder },
  { name: 'Code2', label: 'Lập trình', Icon: Code2 },
  { name: 'Layout', label: 'Giao diện', Icon: Layout },
  { name: 'Server', label: 'Máy chủ', Icon: Server },
  { name: 'Sparkles', label: 'AI & Tiện ích', Icon: Sparkles },
  { name: 'BookOpen', label: 'Sách & Học tập', Icon: BookOpen },
  { name: 'FileText', label: 'Tài liệu', Icon: FileText },
  { name: 'Globe', label: 'Website', Icon: Globe },
];

const AVAILABLE_COLORS = [
  { hex: '#4F46E5', label: 'Chàm (Indigo)' },
  { hex: '#0284C7', label: 'Xanh trời (Sky)' },
  { hex: '#059669', label: 'Ngọc bích (Emerald)' },
  { hex: '#D97706', label: 'Hổ phách (Amber)' },
  { hex: '#E11D48', label: 'Hồng đỏ (Rose)' },
  { hex: '#7C3AED', label: 'Tím (Violet)' },
  { hex: '#475569', label: 'Xám đá (Slate)' },
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  initialCategory,
  defaultParentId,
}) => {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [icon, setIcon] = useState('Folder');
  const [color, setColor] = useState('#4F46E5');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialCategory) {
        setName(initialCategory.name);
        setParentId(initialCategory.parentId || null);
        setIcon(initialCategory.icon || 'Folder');
        setColor(initialCategory.color || '#4F46E5');
      } else {
        setName('');
        setParentId(defaultParentId || null);
        setIcon('Folder');
        setColor('#4F46E5');
      }
      setErrorMsg('');
      setIsSubmitting(false);
    }
  }, [isOpen, initialCategory, defaultParentId]);

  if (!isOpen) return null;

  // Potential parents (exclude self and self's children to prevent cycle)
  const allowedParents = categories.filter((c) => {
    if (!initialCategory) return true;
    return c.id !== initialCategory.id && c.parentId !== initialCategory.id;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Vui lòng nhập tên thư mục');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await onSave({
        name: name.trim(),
        parentId: parentId || null,
        icon,
        color,
      });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi khi lưu thư mục');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FolderPlus className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {initialCategory ? 'Chỉnh sửa thư mục' : 'Tạo thư mục mới'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tên thư mục <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Tài liệu Lập trình, AI & Tools..."
              required
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white"
            />
          </div>

          {/* Parent category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Thư mục cha (để tạo thư mục con)
            </label>
            <select
              value={parentId || ''}
              onChange={(e) => setParentId(e.target.value || null)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="">(Không có - Là thư mục gốc cấp 1)</option>
              {allowedParents.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.parentId ? `— ${cat.name}` : cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Biểu tượng đại diện
            </label>
            <div className="grid grid-cols-4 gap-2">
              {AVAILABLE_ICONS.map(({ name: iconKey, label, Icon }) => {
                const isSelected = icon === iconKey;
                return (
                  <button
                    key={iconKey}
                    type="button"
                    onClick={() => setIcon(iconKey)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs transition-colors ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span className="text-[10px] truncate max-w-full">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Màu sắc phân loại
            </label>
            <div className="flex items-center gap-2">
              {AVAILABLE_COLORS.map(({ hex, label }) => {
                const isSelected = color === hex;
                return (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setColor(hex)}
                    style={{ backgroundColor: hex }}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      isSelected
                        ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110'
                        : 'hover:scale-105'
                    }`}
                    title={label}
                  />
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <span>{initialCategory ? 'Cập nhật' : 'Tạo thư mục'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
