import React, { useState } from 'react';
import { FileSpreadsheet, FolderOpen, RefreshCw, Trash2, Undo2, FileText, Globe } from 'lucide-react';
import { StudentSubmission } from '../types';
import { AdminData, adminList, adminSetStatus } from '../services/api';

interface TeacherDashboardProps {
  onViewSlide: (sub: StudentSubmission) => void;
  onShowNotice: (msg: string) => void;
  onChanged: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  onViewSlide,
  onShowNotice,
  onChanged,
}) => {
  const [password, setPassword] = useState('');
  const [data, setData] = useState<AdminData | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = async (pw = password) => {
    setBusy(true);
    setError('');
    try {
      setData(await adminList(pw));
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : 'Gagal.');
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (s: StudentSubmission, status: 'Aktif' | 'Dipadam') => {
    if (status === 'Dipadam' && !confirm(`Sembunyikan hantaran ${s.nama}? Data kekal dalam Sheet dan boleh dipulihkan.`)) return;
    try {
      await adminSetStatus(password, s.id, status);
      onShowNotice(status === 'Dipadam' ? 'Hantaran disembunyikan.' : 'Hantaran dipulihkan.');
      await load();
      onChanged();
    } catch (e) {
      onShowNotice(e instanceof Error ? e.message : 'Gagal.');
    }
  };

  if (!data) {
    return (
      <main className="flex-1 max-w-sm w-full mx-auto px-4 py-16">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
          className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-3 shadow-xs"
        >
          <h2 className="font-bold text-base">Admin / Guru</h2>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Kata laluan admin"
            autoComplete="current-password"
            className="w-full border border-zinc-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
          {error && <p className="text-rose-600 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={busy || !password}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-xs cursor-pointer"
          >
            {busy ? 'Menyemak...' : 'Masuk'}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={data.sheetUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700"
        >
          <FileSpreadsheet className="w-4 h-4" /> Buka Google Sheet
        </a>
        <a
          href={data.folderUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white border border-zinc-200 px-3 py-2 rounded-lg hover:bg-zinc-100"
        >
          <FolderOpen className="w-4 h-4" /> Folder Drive
        </a>
        <button
          onClick={() => load()}
          disabled={busy}
          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white border border-zinc-200 px-3 py-2 rounded-lg hover:bg-zinc-100 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} /> Muat semula
        </button>
        <span className="text-xs text-zinc-500 ml-auto">{data.submissions.length} rekod</span>
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl overflow-x-auto shadow-xs">
        <table className="w-full text-xs text-left">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-4 py-2.5">Tarikh</th>
              <th className="px-4 py-2.5">Pelajar</th>
              <th className="px-4 py-2.5">Tajuk</th>
              <th className="px-4 py-2.5">Pautan</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {data.submissions.map((s) => (
              <tr key={s.id} className={`border-t border-zinc-100 ${s.status === 'Dipadam' ? 'opacity-50' : ''}`}>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  {s.submittedAt ? new Date(s.submittedAt).toLocaleString('ms-MY') : ''}
                </td>
                <td className="px-4 py-2.5">
                  <div className="font-semibold">{s.nama}</div>
                  <div className="font-mono text-zinc-500">{s.noMatrik}</div>
                </td>
                <td className="px-4 py-2.5">{s.tajukWeb}</td>
                <td className="px-4 py-2.5 whitespace-nowrap space-x-3">
                  <a href={s.linkLamanWeb} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                    <Globe className="w-3.5 h-3.5" /> Web
                  </a>
                  <button onClick={() => onViewSlide(s)} className="inline-flex items-center gap-1 text-rose-600 hover:underline cursor-pointer">
                    <FileText className="w-3.5 h-3.5" /> PDF
                  </button>
                </td>
                <td className="px-4 py-2.5">{s.status}</td>
                <td className="px-4 py-2.5 text-right">
                  {s.status === 'Dipadam' ? (
                    <button onClick={() => setStatus(s, 'Aktif')} title="Pulihkan" className="p-1.5 text-zinc-500 hover:text-emerald-600 cursor-pointer">
                      <Undo2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <button onClick={() => setStatus(s, 'Dipadam')} title="Sembunyikan" className="p-1.5 text-zinc-500 hover:text-rose-600 cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {data.submissions.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-zinc-500">
                  Tiada rekod hantaran pelajar setakat ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
};