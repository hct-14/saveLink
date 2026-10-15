import React, { useState } from 'react';
import {
  ExternalLink,
  Star,
  Copy,
  Check,
  Edit2,
  Trash2,
  Globe,
  FileText,
} from 'lucide-react';
import { Bookmark, Category } from '../types';
import { getDomainFromUrl, formatTimeAgoVi } from '../lib/urlUtils';

interface BookmarkRowProps {
  bookmark: Bookmark;
  categories: Category[];
  onToggleFavorite: (bookmark: Bookmark) => void;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmark: Bookmark) => void;
  onSelectTag: (tag: string) => void;
}

export const BookmarkRow: React.FC<BookmarkRowProps> = ({
  bookmark,
  categories,
  onToggleFavorite,
  onEdit,
  onDelete,
  onSelectTag,
}) => {
  const [copied, setCopied] = useState(false);
  const domain = getDomainFromUrl(bookmark.url);
  const category = categories.find((c) => c.id === bookmark.categoryId);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(bookmark.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group flex items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-600/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all">
      {/* Left: Favicon + Title + Notes preview */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Favicon */}
        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 flex items-center justify-center shrink-0">
          {bookmark.favicon ? (
            <img
              src={bookmark.favicon}
              alt={domain}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
              className="w-4 h-4 object-contain"
            />
          ) : (
            <Globe className="w-4 h-4 text-indigo-500" />
          )}
        </div>

        {/* Title & Metadata */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-slate-900 dark:text-white truncate hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              title={bookmark.title}
            >
              {bookmark.title}
            </a>
            <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            <span className="font-mono truncate max-w-[140px]">{domain}</span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
            {category && (
              <>
                <span className="truncate max-w-[120px]" style={{ color: category.color || undefined }}>
                  {category.name}
                </span>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
              </>
            )}
            <span className="font-mono text-[11px] text-slate-400 shrink-0">
              {formatTimeAgoVi(bookmark.createdAt)}
            </span>

            {/* Note badge indicator */}
            {bookmark.notes && (
              <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 truncate max-w-[200px]" title={bookmark.notes}>
                <FileText className="w-3 h-3 shrink-0" />
                <span className="truncate">{bookmark.notes}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Middle/Right: Tags */}
      {bookmark.tags && bookmark.tags.length > 0 && (
        <div className="hidden lg:flex items-center gap-1.5 shrink-0">
          {bookmark.tags.slice(0, 3).map((tag) => (
            <button
              key={tag}
              onClick={() => onSelectTag(tag)}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:underline"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Right: Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onToggleFavorite(bookmark)}
          className={`p-1.5 rounded-lg transition-colors ${
            bookmark.isFavorite
              ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
              : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title={bookmark.isFavorite ? 'Bỏ yêu thích' : 'Đánh dấu yêu thích'}
        >
          <Star
            className={`w-4 h-4 ${bookmark.isFavorite ? 'fill-current' : ''}`}
          />
        </button>

        <button
          onClick={handleCopy}
          className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title={copied ? 'Đã sao chép link!' : 'Sao chép link'}
        >
          {copied ? (
            <Check className="w-4 h-4 text-emerald-600" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>

        <button
          onClick={() => onEdit(bookmark)}
          className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Chỉnh sửa"
        >
          <Edit2 className="w-4 h-4" />
        </button>

        <button
          onClick={() => onDelete(bookmark)}
          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Xóa link"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
