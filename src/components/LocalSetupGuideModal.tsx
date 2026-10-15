import React, { useState } from 'react';
import {
  X,
  Terminal,
  Copy,
  Check,
  Laptop,
  CheckCircle2,
  ExternalLink,
  Code2,
} from 'lucide-react';

interface LocalSetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocalSetupGuideModal: React.FC<LocalSetupGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const copyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const codeSnippets = [
    {
      title: 'Bước 1: Cài đặt các thư viện cần thiết',
      code: 'npm install',
    },
    {
      title: 'Bước 2: Khởi chạy máy chủ phát triển trên máy tính',
      code: 'npm run dev',
    },
    {
      title: 'Hoặc chạy đồng thời cả hai lệnh (One-liner):',
      code: 'npm install && npm run dev',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white leading-tight">
                Hướng dẫn chạy website trên máy tính
              </h3>
              <p className="text-xs text-slate-400">
                Các bước thiết lập và chạy Smart Bookmark cục bộ (Localhost)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[calc(85vh-120px)] overflow-y-auto text-sm text-slate-600 dark:text-slate-300">
          {/* Requirement */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-1.5">
            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Yêu cầu cấu hình máy tính:</span>
            </div>
            <ul className="text-xs space-y-1 text-slate-600 dark:text-slate-400 pl-5 list-disc">
              <li>Đã cài đặt <strong>Node.js</strong> phiên bản 18 trở lên (khuyên dùng Node.js 20 hoặc 22 LTS).</li>
              <li>Trình quản lý gói <strong>npm</strong> (đi kèm sẵn khi cài Node.js).</li>
            </ul>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            <h4 className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
              Các bước thực hiện trong Terminal:
            </h4>

            {codeSnippets.map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {item.title}
                </span>
                <div className="flex items-center justify-between p-2.5 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs">
                  <div className="flex items-center gap-2 overflow-x-auto">
                    <span className="text-indigo-400 select-none">$</span>
                    <span>{item.code}</span>
                  </div>
                  <button
                    onClick={() => copyCode(item.code, idx)}
                    className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors shrink-0 ml-2"
                    title="Sao chép câu lệnh"
                  >
                    {copiedIndex === idx ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}

            {/* Step 3: Open browser */}
            <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-950 dark:text-indigo-200 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Bước 3: Mở trình duyệt web</span>
              </div>
              <p>
                Sau khi lệnh <code className="bg-indigo-100/80 dark:bg-indigo-900/80 px-1 py-0.5 rounded font-mono">npm run dev</code> khởi động xong, bạn mở trình duyệt và truy cập:
              </p>
              <div className="pt-1">
                <a
                  href="http://localhost:3000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono font-semibold text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-800"
                >
                  http://localhost:3000
                </a>
              </div>
            </div>

            {/* Note on Architecture & Firebase */}
            <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
              <div className="font-semibold text-slate-700 dark:text-slate-300">
                Ghi chú kiến trúc Full-stack & Firebase:
              </div>
              <p>
                • File <code className="font-mono text-slate-700 dark:text-slate-300">server.ts</code> sẽ tự động xử lý cả máy chủ Vite và endpoint cào thông tin trang web <code className="font-mono">/api/metadata</code>.
              </p>
              <p>
                • Cấu hình Firestore đã được tích hợp sẵn trong <code className="font-mono text-slate-700 dark:text-slate-300">firebase-applet-config.json</code>, dữ liệu sẽ tự động lưu và đồng bộ trực tuyến.
              </p>
            </div>
          </div>

          {/* Footer close */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
