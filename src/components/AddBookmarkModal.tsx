import React, { useState, useEffect } from 'react';
import {
  X,
  Link as LinkIcon,
  Sparkles,
  AlertTriangle,
  Folder,
  Tag as TagIcon,
  FileText,
  Star,
  Globe,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Bookmark, Category, ScrapedMetadata } from '../types';
import { cleanAndNormalizeUrl, isValidUrl, getDomainFromUrl, getGoogleFaviconUrl } from '../lib/urlUtils';

interface AddBookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bookmarkData: Partial<Bookmark>) => Promise<void>;
  existingBookmarks: Bookmark[];
  categories: Category[];
  initialBookmark?: Bookmark | null;
  defaultCategoryId?: string | null;
}

export const AddBookmarkModal: React.FC<AddBookmarkModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingBookmarks,
  categories,
  initialBookmark,
  defaultCategoryId,
}) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [favicon, setFavicon] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [notes, setNotes] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [duplicateBookmark, setDuplicateBookmark] = useState<Bookmark | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Reset or populate fields when modal opens or initialBookmark changes
  useEffect(() => {
    if (isOpen) {
      if (initialBookmark) {
        setUrl(initialBookmark.url);
        setTitle(initialBookmark.title);
        setDescription(initialBookmark.description || '');
        setFavicon(initialBookmark.favicon || '');
        setImageUrl(initialBookmark.imageUrl || '');
        setCategoryId(initialBookmark.categoryId || null);
        setTags(initialBookmark.tags || []);
        setNotes(initialBookmark.notes || '');
        setIsFavorite(Boolean(initialBookmark.isFavorite));
        setDuplicateBookmark(null);
      } else {
        setUrl('');
        setTitle('');
        setDescription('');
        setFavicon('');
        setImageUrl('');
        setCategoryId(defaultCategoryId || null);
        setTags([]);
        setNotes('');
        setIsFavorite(false);
        setDuplicateBookmark(null);
      }
      setTagInput('');
      setErrorMsg('');
      setIsSubmitting(false);
    }
  }, [isOpen, initialBookmark, defaultCategoryId]);

  // Check duplicate whenever URL changes
  useEffect(() => {
    if (!url || !isValidUrl(url)) {
      setDuplicateBookmark(null);
      return;
    }

    const clean = cleanAndNormalizeUrl(url);
    const found = existingBookmarks.find(
      (b) => b.cleanUrl === clean && (!initialBookmark || b.id !== initialBookmark.id)
    );
    setDuplicateBookmark(found || null);
  }, [url, existingBookmarks, initialBookmark]);

  if (!isOpen) return null;

  // Auto-fetch metadata
  const fetchMetadata = async (targetUrl: string) => {
    if (!isValidUrl(targetUrl)) return;
    setIsLoadingMetadata(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/metadata?url=${encodeURIComponent(targetUrl)}`);
      if (!res.ok) {
        throw new Error('Không thể tải thông tin website');
      }
      const data: ScrapedMetadata = await res.json();

      if (data.title && !title) {
        setTitle(data.title);
      }
      if (data.description && !description) {
        setDescription(data.description);
      }
      if (data.imageUrl && !imageUrl) {
        setImageUrl(data.imageUrl);
      }
      if (data.favicon) {
        setFavicon(data.favicon);
      } else {
        setFavicon(getGoogleFaviconUrl(targetUrl));
      }
    } catch {
      // Fallback
      if (!favicon) setFavicon(getGoogleFaviconUrl(targetUrl));
      if (!title) setTitle(getDomainFromUrl(targetUrl));
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  const handleUrlBlur = () => {
    if (url && isValidUrl(url) && (!title || !favicon)) {
      fetchMetadata(url);
    }
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setErrorMsg('Vui lòng nhập đường link URL');
      return;
    }
    if (!isValidUrl(url)) {
      setErrorMsg('Địa chỉ URL không hợp lệ. Vui lòng nhập đúng định dạng (vd: https://example.com)');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('Vui lòng nhập tiêu đề cho liên kết');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const cleanUrl = cleanAndNormalizeUrl(url);
      await onSave({
        url: url.trim(),
        cleanUrl,
        title: title.trim(),
        description: description.trim(),
        favicon: favicon || getGoogleFaviconUrl(url),
        imageUrl: imageUrl.trim(),
        categoryId: categoryId || null,
        tags,
        notes: notes.trim(),
        isFavorite,
      });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi lưu');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Popular existing tags for suggestion
  const existingTags = Array.from(
    new Set(existingBookmarks.flatMap((b) => b.tags || []))
  )
    .filter((t) => !tags.includes(t))
    .slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <LinkIcon className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {initialBookmark ? 'Chỉnh sửa bookmark' : 'Thêm link tài liệu mới'}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(85vh-120px)] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Duplicate Detection Alert */}
          {duplicateBookmark && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-amber-800 dark:text-amber-200 space-y-1.5">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Cảnh báo: Link này đã tồn tại trong bộ sưu tập!</span>
              </div>
              <p className="text-amber-700 dark:text-amber-300 pl-6">
                Bạn đã lưu link này với tiêu đề: <strong className="underline">{duplicateBookmark.title}</strong>
              </p>
              <div className="pl-6 pt-1 flex items-center gap-2">
                <a
                  href={duplicateBookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-amber-900 dark:text-amber-100 underline hover:text-amber-700"
                >
                  <span>Mở link gốc</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* URL Input with Auto-extract button */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Đường link (URL) <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onBlur={handleUrlBlur}
                  placeholder="https://example.com/bai-viet-hay"
                  required
                  className="w-full pl-3 pr-8 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white"
                />
                {favicon && (
                  <img
                    src={favicon}
                    alt="icon"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                    className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 object-contain"
                  />
                )}
              </div>

              <button
                type="button"
                onClick={() => fetchMetadata(url)}
                disabled={!isValidUrl(url) || isLoadingMetadata}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
                title="Tự động trích xuất tiêu đề, mô tả và hình ảnh"
              >
                {isLoadingMetadata ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                    <span>Đang lấy...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Lấy thông tin</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tiêu đề <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tiêu đề trang hoặc tên tài liệu"
              required
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white"
            />
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Mô tả tóm tắt
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tóm tắt ngắn gọn nội dung tài liệu..."
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white resize-none"
            />
          </div>

          {/* Category Select */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Thư mục phân loại
              </label>
              <select
                value={categoryId || ''}
                onChange={(e) => setCategoryId(e.target.value || null)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="">(Chưa phân loại)</option>
                {categories.map((cat) => {
                  const parent = cat.parentId ? categories.find((c) => c.id === cat.parentId) : null;
                  return (
                    <option key={cat.id} value={cat.id}>
                      {parent ? `— ${parent.name} / ${cat.name}` : cat.name}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Favorite check */}
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isFavorite}
                  onChange={(e) => setIsFavorite(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Star className={`w-4 h-4 ${isFavorite ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                  <span>Đánh dấu yêu thích</span>
                </span>
              </label>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Thẻ từ khóa (Tags)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Nhập tag rồi ấn Enter (vd: react, ai, tailieu)"
                className="flex-1 px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-xl transition-colors"
              >
                Thêm
              </button>
            </div>

            {/* Current tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs rounded-md"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Tag suggestions */}
            {existingTags.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
                <span>Gợi ý:</span>
                {existingTags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTags([...tags, t])}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    +{t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notes Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Ghi chú cá nhân
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú thêm về mục đích lưu trữ hoặc lưu ý quan trọng..."
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white resize-none"
            />
          </div>

          {/* Thumbnail preview if any */}
          {imageUrl && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 flex items-center gap-3">
              <img
                src={imageUrl}
                alt="preview"
                className="w-16 h-12 rounded-lg object-cover shrink-0"
                onError={() => setImageUrl('')}
              />
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                <span className="font-medium text-slate-700 dark:text-slate-300 block truncate">
                  Ảnh xem trước OpenGraph
                </span>
                <span className="font-mono text-[11px] truncate block">{imageUrl}</span>
              </div>
            </div>
          )}

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
                <span>{initialBookmark ? 'Lưu thay đổi' : 'Lưu bookmark'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
