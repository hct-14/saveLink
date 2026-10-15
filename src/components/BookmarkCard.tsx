import React, { useState } from 'react';
import {
  ExternalLink,
  Star,
  Copy,
  Check,
  Edit2,
  Trash2,
  Tag as TagIcon,
  Globe,
  FileText,
} from 'lucide-react';
import { Bookmark, Category } from '../types';
import { getDomainFromUrl, formatTimeAgoVi } from '../lib/urlUtils';

interface BookmarkCardProps {
  bookmark: Bookmark;
  categories: Category[];
  onToggleFavorite: (bookmark: Bookmark) => void;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmark: Bookmark) => void;
  onSelectTag: (tag: string) => void;
}

export const BookmarkCard: React.FC<BookmarkCardProps> = ({
  bookmark,
  categories,
  onToggleFavorite,
  onEdit,
  onDelete,
  onSelectTag,
}) => {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  const domain = getDomainFromUrl(bookmark.url);
  const category = categories.find((c) => c.id === bookmark.categoryId);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(bookmark.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative flex flex-col bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-indigo-300 dark:hover:border-indigo-600/50 hover:shadow-md transition-all duration-200">
      {/* Thumbnail Banner (or fallback aesthetic pattern) */}
      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block h-36 w-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden shrink-0 cursor-pointer"
      >
        {bookmark.imageUrl && !imgError ? (
          <img
            src={bookmark.imageUrl}
            alt={bookmark.title}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-50/50 via-slate-50 to-slate-100 dark:from-slate-800/50 dark:via-slate-900 dark:to-slate-800 text-slate-400">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 flex items-center justify-center shadow-2xs mb-2">
              {bookmark.favicon ? (
                <img
                  src={bookmark.favicon}
                  alt={domain}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                  className="w-5 h-5 object-contain"
                />
              ) : (
                <Globe className="w-5 h-5 text-indigo-500" />
              )}
            </div>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-medium tracking-tight">
              {domain}
            </span>
          </div>
        )}

        {/* Favorite toggle button pinned on thumbnail */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite(bookmark);
          }}
          className={`absolute top-2.5 right-2.5 p-1.5 rounded-full backdrop-blur-md transition-colors ${
            bookmark.isFavorite
              ? 'bg-amber-500/90 text-white shadow-xs'
              : 'bg-white/80 dark:bg-slate-900/80 text-slate-500 hover:text-amber-500 opacity-90 group-hover:opacity-100'
          }`}
          title={bookmark.isFavorite ? 'Bỏ yêu thích' : 'Đánh dấu yêu thích'}
        >
          <Star
            className={`w-3.5 h-3.5 ${
              bookmark.isFavorite ? 'fill-current text-white' : ''
            }`}
          />
        </button>
      </a>

      {/* Content Area */}
      <div className="flex-1 p-4 flex flex-col justify-between gap-3">
        <div>
          {/* Unboxed Metadata Line with typographic separators */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="font-mono text-slate-600 dark:text-slate-300 font-medium truncate max-w-[130px]">
              {domain}
            </span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
            {category && (
              <>
                <span className="truncate max-w-[110px]" style={{ color: category.color || undefined }}>
                  {category.name}
                </span>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
              </>
            )}
            <span className="shrink-0 font-mono text-[11px] text-slate-400">
              {formatTimeAgoVi(bookmark.createdAt)}
            </span>
          </div>

          {/* Title */}
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group/title block text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors leading-snug"
            title={bookmark.title}
          >
            <span className="align-middle">{bookmark.title}</span>
            <ExternalLink className="inline-block w-3 h-3 ml-1 text-slate-400 opacity-0 group-hover/title:opacity-100 transition-opacity" />
          </a>

          {/* Description */}
          {bookmark.description && (
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {bookmark.description}
            </p>
          )}

          {/* Personal Notes (if present) */}
          {bookmark.notes && (
            <div className="mt-2.5 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5 border border-slate-100 dark:border-slate-800">
              <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <span className="line-clamp-2 italic">{bookmark.notes}</span>
            </div>
          )}
        </div>

        {/* Footer: Tags + Quick Action Buttons */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
          {/* Tags */}
          <div className="flex flex-wrap items-center gap-1 min-w-0 overflow-hidden">
            {bookmark.tags && bookmark.tags.length > 0 ? (
              bookmark.tags.slice(0, 3).map((tag) => (
                <button
                  key={tag}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTag(tag);
                  }}
                  className="text-[11px] text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300 hover:underline"
                  title={`Lọc theo #${tag}`}
                >
                  #{tag}
                </button>
              ))
            ) : (
              <span className="text-[11px] text-slate-400 dark:text-slate-600 italic">
                Chưa có thẻ
              </span>
            )}
          </div>

          {/* Action toolbar */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={handleCopy}
              className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
              title={copied ? 'Đã sao chép link!' : 'Sao chép đường link'}
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={() => onEdit(bookmark)}
              className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
              title="Chỉnh sửa bookmark"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(bookmark)}
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
              title="Xóa bookmark"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
