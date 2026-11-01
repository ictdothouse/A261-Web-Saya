import React from 'react';
import { X, ExternalLink, Download, FileText } from 'lucide-react';
import { StudentSubmission } from '../types';

interface SlideViewerModalProps {
  submission: StudentSubmission | null;
  onClose: () => void;
}

export const SlideViewerModal: React.FC<SlideViewerModalProps> = ({
  submission,
  onClose,
}) => {
  if (!submission) return null;

  const isDataUrl = submission.slidePdfUrl.startsWith('data:');

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      <div className="bg-white border border-zinc-200 w-full max-w-4xl h-[88vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Pengepala */}
        <div className="px-5 py-3.5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="truncate">
              <h3 className="font-bold text-sm text-zinc-900 truncate">
                Slaid PDF: {submission.nama}
              </h3>
              <p className="text-xs text-zinc-500 font-mono">
                {submission.noMatrik} &bull; {submission.tajukWeb}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isDataUrl ? (
              <a
                href={submission.slidePdfUrl}
                download={submission.slideFileName || `Slaid_${submission.nama}.pdf`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Muat Turun PDF</span>
              </a>
            ) : (
              <a
                href={submission.slidePdfUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <span>Buka di Tab Baru</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <button
              onClick={onClose}
              aria-label="Tutup"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paparan Bingkai PDF */}
        <div className="flex-1 bg-zinc-100 p-2 sm:p-4 flex items-center justify-center overflow-hidden">
          {submission.slidePdfUrl ? (
            <iframe
              src={submission.slidePdfUrl}
              title={`Slaid PDF - ${submission.nama}`}
              sandbox="allow-scripts allow-same-origin allow-popups"
              className="w-full h-full border border-zinc-200 rounded-xl bg-white shadow-xs"
            />
          ) : (
            <div className="text-center p-8 text-zinc-500 text-xs">
              Tiada pautan fail PDF ditemui.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
