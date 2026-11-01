import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle2, Globe, AlertCircle } from 'lucide-react';
import { StudentSubmission } from '../types';
import { normalizeUrl } from '../utils/thumbnail';
import { validateSubmission } from '../utils/validation';

interface SubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: Pick<
      StudentSubmission,
      'nama' | 'noMatrik' | 'tajukWeb' | 'linkLamanWeb' | 'slidePdfUrl' | 'slideFileName'
    >
  ) => Promise<void>;
}

export const SubmitModal: React.FC<SubmitModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [nama, setNama] = useState('');
  const [noMatrik, setNoMatrik] = useState('');
  const [tajukWeb, setTajukWeb] = useState('');
  // Default Canva website placeholder / pre-fill
  const [linkLamanWeb, setLinkLamanWeb] = useState('');
  const [slidePdfUrl, setSlidePdfUrl] = useState('');
  const [slideFileName, setSlideFileName] = useState('');
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Pengendali fail PDF
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrors((prev) => ({ ...prev, slidePdfUrl: 'Sila pilih fail berformat PDF sahaja.' }));
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, slidePdfUrl: 'Saiz fail PDF melebihi had 15MB.' }));
      return;
    }

    setIsUploadingPdf(true);
    setSlideFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setSlidePdfUrl(reader.result as string);
      setIsUploadingPdf(false);
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.slidePdfUrl;
        return copy;
      });
    };
    reader.onerror = () => {
      setIsUploadingPdf(false);
      setErrors((prev) => ({ ...prev, slidePdfUrl: 'Ralat semasa memproses fail PDF.' }));
    };
    reader.readAsDataURL(file);
  };

  const handleSetCanvaPrefix = () => {
    if (!linkLamanWeb.includes('canva.site')) {
      setLinkLamanWeb('https://projek-pelajar.my.canva.site');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedWeb = normalizeUrl(linkLamanWeb);

    const validation = validateSubmission({
      nama,
      noMatrik,
      tajukWeb,
      linkLamanWeb: normalizedWeb,
      slidePdfUrl,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        nama: nama.trim(),
        noMatrik: noMatrik.trim(),
        tajukWeb: tajukWeb.trim(),
        linkLamanWeb: normalizedWeb,
        slidePdfUrl,
        slideFileName: slideFileName || 'Slaid_Assignment.pdf',
      });
      setNama('');
      setNoMatrik('');
      setTajukWeb('');
      setLinkLamanWeb('');
      setSlidePdfUrl('');
      setSlideFileName('');
      setErrors({});
      onClose();
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Gagal menghantar. Cuba lagi.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-zinc-200 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden my-6 text-zinc-900 animate-in fade-in zoom-in-95 duration-150">
        {/* Pengepala */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-zinc-900">
              Borang Hantar Tugasan
            </h2>
            <p className="text-xs text-zinc-500">
              Sila lengkapkan butiran projek website Canva dan slaid PDF anda.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Borang */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 1. Nama */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Nama Pelajar <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nama}
              onChange={(e) => {
                setNama(e.target.value);
                if (errors.nama) setErrors((prev) => ({ ...prev, nama: '' }));
              }}
              placeholder="Contoh: Muhammad Amirul bin Rosli"
              className="w-full bg-white border border-zinc-300 rounded-lg px-3.5 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
            {errors.nama && <p className="text-rose-600 text-xs mt-1">{errors.nama}</p>}
          </div>

          {/* 2. No Matrik */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Nombor Matrik <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={noMatrik}
              onChange={(e) => {
                setNoMatrik(e.target.value);
                if (errors.noMatrik) setErrors((prev) => ({ ...prev, noMatrik: '' }));
              }}
              placeholder="Contoh: 1210452"
              className="w-full bg-white border border-zinc-300 rounded-lg px-3.5 py-2 text-sm font-mono text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
            {errors.noMatrik && <p className="text-rose-600 text-xs mt-1">{errors.noMatrik}</p>}
          </div>

          {/* 3. Tajuk Web */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Tajuk Laman Web <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={tajukWeb}
              onChange={(e) => {
                setTajukWeb(e.target.value);
                if (errors.tajukWeb) setErrors((prev) => ({ ...prev, tajukWeb: '' }));
              }}
              placeholder="Contoh: Galeri Seni Digital & Warisan Islam"
              className="w-full bg-white border border-zinc-300 rounded-lg px-3.5 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
            {errors.tajukWeb && <p className="text-rose-600 text-xs mt-1">{errors.tajukWeb}</p>}
          </div>

          {/* 4. Upload Slide (PDF) */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Muat Naik Slaid (PDF) <span className="text-rose-500">*</span>
            </label>

            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                slideFileName
                  ? 'border-emerald-300 bg-emerald-50/50'
                  : 'border-zinc-300 hover:border-zinc-400 bg-zinc-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handlePdfUpload}
              />

              {slideFileName ? (
                <div className="flex items-center justify-center gap-2 text-emerald-800">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs font-medium truncate max-w-xs">{slideFileName}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="w-6 h-6 text-zinc-400 mx-auto" />
                  <p className="text-xs font-medium text-zinc-700">
                    {isUploadingPdf ? 'Sedang memuat naik...' : 'Klik untuk pilih fail Slaid PDF'}
                  </p>
                  <p className="text-[11px] text-zinc-400">Format .pdf sahaja (Maksimum 15MB)</p>
                </div>
              )}
            </div>

            {/* Pautan alternatif PDF jika berada dalam Google Drive */}
            <div className="mt-2 text-[11px] text-zinc-500">
              <span>Atau tampal pautan fail PDF terus dari Google Drive:</span>
            </div>
            <input
              type="text"
              value={slidePdfUrl.startsWith('data:') ? '' : slidePdfUrl}
              onChange={(e) => {
                setSlidePdfUrl(e.target.value);
                setSlideFileName('Slaid_Dalam_Talian.pdf');
                if (errors.slidePdfUrl) setErrors((prev) => ({ ...prev, slidePdfUrl: '' }));
              }}
              placeholder="https://drive.google.com/file/d/.../view"
              className="mt-1 w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400"
            />

            {errors.slidePdfUrl && (
              <p className="text-rose-600 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.slidePdfUrl}</span>
              </p>
            )}
          </div>

          {/* 5. Link Laman Web (Default Canva) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-zinc-700">
                Pautan Laman Web Canva <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleSetCanvaPrefix}
                className="text-[11px] text-blue-600 hover:text-blue-700 underline cursor-pointer"
              >
                Guna Contoh Canva
              </button>
            </div>
            <div className="relative">
              <Globe className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={linkLamanWeb}
                onChange={(e) => {
                  setLinkLamanWeb(e.target.value);
                  if (errors.linkLamanWeb) setErrors((prev) => ({ ...prev, linkLamanWeb: '' }));
                }}
                placeholder="https://projek-saya.my.canva.site"
                className="w-full bg-white border border-zinc-300 rounded-lg pl-9 pr-3.5 py-2 text-sm font-mono text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
            </div>
            {errors.linkLamanWeb && (
              <p className="text-rose-600 text-xs mt-1">{errors.linkLamanWeb}</p>
            )}
            <p className="text-[11px] text-zinc-500 mt-1">
              Pautan laman web Canva pelajar (cth: https://projek-anda.my.canva.site atau pautan terbitan Canva).
            </p>
          </div>

          {errors.form && <p className="text-rose-600 text-xs">{errors.form}</p>}

          {/* Butang Tindakan */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || isUploadingPdf}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg text-xs transition-colors shadow-xs cursor-pointer"
            >
              {submitting ? 'Menghantar...' : 'Hantar Tugasan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
