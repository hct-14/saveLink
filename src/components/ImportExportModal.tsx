import React, { useState } from 'react';
import {
  X,
  Download,
  Upload,
  FileJson,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Category, Bookmark } from '../types';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  bookmarks: Bookmark[];
  onImportData: (data: { categories: Category[]; bookmarks: Bookmark[]; mode: 'merge' | 'overwrite' }) => Promise<void>;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  categories,
  bookmarks,
  onImportData,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importedFile, setImportedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<{ categories: Category[]; bookmarks: Bookmark[] } | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'overwrite'>('merge');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  // Handle Export
  const handleExport = () => {
    try {
      const exportObject = {
        app: 'Smart Bookmark',
        version: '1.0',
        exportedAt: new Date().toISOString(),
        categories,
        bookmarks,
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObject, null, 2));
      const downloadAnchor = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `smart_bookmark_backup_${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setStatusMsg({
        type: 'success',
        text: `Đã xuất thành công ${bookmarks.length} bookmark và ${categories.length} thư mục!`,
      });
    } catch {
      setStatusMsg({
        type: 'error',
        text: 'Có lỗi xảy ra trong quá trình xuất dữ liệu',
      });
    }
  };

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportedFile(file);
    setStatusMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.bookmarks && !json.categories) {
          throw new Error('Tệp JSON không đúng định dạng Smart Bookmark');
        }

        const validCategories: Category[] = Array.isArray(json.categories) ? json.categories : [];
        const validBookmarks: Bookmark[] = Array.isArray(json.bookmarks) ? json.bookmarks : [];

        setParsedData({
          categories: validCategories,
          bookmarks: validBookmarks,
        });
      } catch (err: unknown) {
        setStatusMsg({
          type: 'error',
          text: err instanceof Error ? err.message : 'Tệp JSON không hợp lệ',
        });
        setParsedData(null);
      }
    };
    reader.readAsText(file);
  };

  // Handle execute import
  const handleExecuteImport = async () => {
    if (!parsedData) return;
    setIsProcessing(true);
    setStatusMsg(null);

    try {
      await onImportData({
        categories: parsedData.categories,
        bookmarks: parsedData.bookmarks,
        mode: importMode,
      });

      setStatusMsg({
        type: 'success',
        text: `Đã nhập thành công ${parsedData.bookmarks.length} bookmark và ${parsedData.categories.length} thư mục vào cơ sở dữ liệu!`,
      });
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: unknown) {
      setStatusMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Lỗi khi nhập dữ liệu',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FileJson className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Sao lưu & Khôi phục dữ liệu
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 pt-2">
          <button
            onClick={() => {
              setActiveTab('export');
              setStatusMsg(null);
            }}
            className={`flex items-center gap-2 pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'export'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Xuất dữ liệu (Backup)</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('import');
              setStatusMsg(null);
            }}
            className={`flex items-center gap-2 pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'import'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Nhập dữ liệu (Restore)</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {statusMsg && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {activeTab === 'export' ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Xuất toàn bộ các đường link bookmark, danh mục thư mục phân cấp, tags và ghi chú cá nhân thành tệp tin định dạng JSON tiêu chuẩn.
              </p>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span>Tổng số đường link:</span>
                  <span className="font-semibold font-mono tabular-nums">{bookmarks.length}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span>Tổng số thư mục:</span>
                  <span className="font-semibold font-mono tabular-nums">{categories.length}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span>Trạng thái lưu trữ:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Firebase Firestore</span>
                </div>
              </div>

              <button
                onClick={handleExport}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Tải tệp JSON về máy tính</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Chọn tệp JSON sao lưu trước đó để khôi phục lại toàn bộ danh mục và các đường link của bạn.
              </p>

              {/* File upload box */}
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-5 text-center hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors">
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                  id="json-file-input"
                />
                <label
                  htmlFor="json-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center"
                >
                  <FileJson className="w-8 h-8 text-indigo-500 mb-2" />
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {importedFile ? importedFile.name : 'Nhấn để chọn tệp .json từ máy'}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Định dạng JSON sao lưu Smart Bookmark
                  </span>
                </label>
              </div>

              {parsedData && (
                <div className="space-y-3">
                  <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
                    <div className="font-semibold">Phát hiện dữ liệu hợp lệ:</div>
                    <div>• {parsedData.bookmarks.length} liên kết bookmark</div>
                    <div>• {parsedData.categories.length} danh mục thư mục</div>
                  </div>

                  {/* Import Mode Options */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      Phương thức nạp:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setImportMode('merge')}
                        className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-colors ${
                          importMode === 'merge'
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <div className="font-semibold mb-0.5">Hợp nhất (Merge)</div>
                        <div className="text-[11px] opacity-80">Giữ link cũ và thêm link mới</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setImportMode('overwrite')}
                        className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-colors ${
                          importMode === 'overwrite'
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <div className="font-semibold mb-0.5 text-rose-600 dark:text-rose-400">Ghi đè (Overwrite)</div>
                        <div className="text-[11px] opacity-80">Thay thế bằng file nhập</div>
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleExecuteImport}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-sm rounded-xl shadow-xs transition-colors disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang xử lý nạp dữ liệu...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Tiến hành nạp vào Firestore</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
