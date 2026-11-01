/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { SubmissionCard } from './components/SubmissionCard';
import { SubmitModal } from './components/SubmitModal';
import { TeacherDashboard } from './components/TeacherDashboard';
import { SlideViewerModal } from './components/SlideViewerModal';
import { StudentSubmission } from './types';
import { API_URL } from './config';
import { listSubmissions, submitAssignment } from './services/api';
import { Search, Plus, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [currentView, setCurrentView] = useState<'listing' | 'admin'>('listing');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [viewingSlideSubmission, setViewingSlideSubmission] = useState<StudentSubmission | null>(
    null
  );

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showNotice = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const refresh = useCallback(async () => {
    try {
      setSubmissions(await listSubmissions());
      setLoadError('');
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Gagal memuatkan senarai.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Ralat dilontar semula supaya borang kekal terbuka dan pelajar boleh cuba lagi
  const handleAddSubmission = async (
    data: Pick<
      StudentSubmission,
      'nama' | 'noMatrik' | 'tajukWeb' | 'linkLamanWeb' | 'slidePdfUrl' | 'slideFileName'
    >
  ) => {
    await submitAssignment(data);
    showNotice(`Tugasan "${data.nama}" berjaya dihantar!`);
    refresh();
  };

  const filteredSubmissions = useMemo(() => {
    if (!searchQuery.trim()) return submissions;
    const q = searchQuery.toLowerCase();
    return submissions.filter(
      (s) =>
        s.nama.toLowerCase().includes(q) ||
        s.noMatrik.toLowerCase().includes(q) ||
        s.tajukWeb.toLowerCase().includes(q)
    );
  }, [submissions, searchQuery]);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white text-xs px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <Navbar
        currentView={currentView}
        onNavigate={(v) => setCurrentView(v)}
        onOpenSubmit={() => setIsSubmitModalOpen(true)}
      />

      {!API_URL && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-xs px-4 py-2 text-center">
          Belum disambung ke Google Sheet. Isi <code>API_URL</code> dalam <code>src/config.ts</code>.
        </div>
      )}

      {currentView === 'admin' ? (
        <TeacherDashboard
          onViewSlide={(sub) => setViewingSlideSubmission(sub)}
          onShowNotice={showNotice}
          onChanged={refresh}
        />
      ) : (
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
          <div className="max-w-xl mx-auto mb-8">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama pelajar, no. matrik, atau tajuk web..."
                className="w-full bg-white border border-zinc-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-xs"
              />
            </div>
          </div>

          {loadError && <p className="text-center text-xs text-rose-600 mb-4">{loadError}</p>}

          {loading ? (
            <p className="text-center text-xs text-zinc-500 py-12">Memuatkan senarai...</p>
          ) : filteredSubmissions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSubmissions.map((sub) => (
                <SubmissionCard
                  key={sub.id}
                  submission={sub}
                  onOpenSlide={(s) => setViewingSlideSubmission(s)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center max-w-md mx-auto my-8 shadow-xs">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Plus className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-zinc-900 mb-1">
                {searchQuery ? 'Tiada Projek Dijumpai' : 'Belum Ada Hantaran Projek'}
              </h3>
              <p className="text-xs text-zinc-500 mb-5 leading-relaxed">
                {searchQuery
                  ? 'Cuba buat carian dengan kata kunci yang lain.'
                  : 'Pelajar boleh klik butang "Hantar Tugasan" di atas untuk memasukkan pautan laman web Canva dan memuat naik fail slaid PDF.'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-xs transition-colors shadow-xs cursor-pointer"
                >
                  Hantar Tugasan Sekarang
                </button>
              )}
            </div>
          )}
        </main>
      )}

      <footer className="border-t border-zinc-200 bg-white py-6 text-xs text-zinc-500 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p className="font-medium text-zinc-700">Projek Website Saya</p>
          <p className="text-zinc-400">Portal Hantaran Tugasan Pelajar</p>
        </div>
      </footer>

      <SubmitModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSubmit={handleAddSubmission}
      />

      <SlideViewerModal
        submission={viewingSlideSubmission}
        onClose={() => setViewingSlideSubmission(null)}
      />
    </div>
  );
}