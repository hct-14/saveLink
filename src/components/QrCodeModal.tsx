import React from 'react';
import { X, QrCode as QrIcon, ExternalLink, Copy, Check } from 'lucide-react';
import { Bookmark } from '../types';
import { getDomainFromUrl } from '../lib/urlUtils';

interface QrCodeModalProps {
  bookmark: Bookmark | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ bookmark, isOpen, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !bookmark) return null;

  const domain = getDomainFromUrl(bookmark.url);
  // Using reliable public QR code generator API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    bookmark.url
  )}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(bookmark.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden p-6 text-center space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <QrIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
              Mã QR Liên kết
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Image */}
        <div className="py-2 flex flex-col items-center">
          <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200/80 inline-block">
            <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 object-contain" />
          </div>
          <p className="mt-3 text-xs font-medium text-slate-700 dark:text-slate-300 line-clamp-1 px-2">
            {bookmark.title}
          </p>
          <span className="text-[11px] font-mono text-slate-400 mt-0.5">{domain}</span>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-2">
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-xl transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Đã sao chép URL!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Sao chép đường link</span>
              </>
            )}
          </button>

          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl transition-colors shadow-xs"
          >
            <span>Mở trang web</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
