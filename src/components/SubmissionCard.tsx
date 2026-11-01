import React, { useEffect, useState } from 'react';
import { ExternalLink, FileText, Heart, Eye } from 'lucide-react';
import { StudentSubmission } from '../types';
import { getCleanDomain, getCleanFallbackThumbnail } from '../utils/thumbnail';
import { sendCounter } from '../services/api';

interface SubmissionCardProps {
  submission: StudentSubmission;
  onOpenSlide: (sub: StudentSubmission) => void;
}

// Dedupe like/view per browser. Tanpa login, ini tidak boleh dipaksa di server.
const LIKED_KEY = 'a261_liked';
const VIEWED_KEY = 'a261_viewed';

const readSet = (key: string): string[] => {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
};

const writeSet = (key: string, ids: string[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    // storan tidak tersedia: kiraan tetap dihantar, cuma tidak diingati
  }
};

export const SubmissionCard: React.FC<SubmissionCardProps> = ({
  submission,
  onOpenSlide,
}) => {
  const domain = getCleanDomain(submission.linkLamanWeb);
  const id = submission.id;

  const [likes, setLikes] = useState(submission.likes ?? 0);
  const [views, setViews] = useState(submission.views ?? 0);
  const [liked, setLiked] = useState(() => readSet(LIKED_KEY).includes(id));

  useEffect(() => setLikes(submission.likes ?? 0), [submission.likes]);
  useEffect(() => setViews(submission.views ?? 0), [submission.views]);

  const toggleLike = () => {
    const next = !liked;
    const ids = readSet(LIKED_KEY).filter((x) => x !== id);
    setLiked(next);
    setLikes((n) => Math.max(0, n + (next ? 1 : -1)));
    writeSet(LIKED_KEY, next ? [...ids, id] : ids);
    sendCounter('like', id, next ? 1 : -1).catch(() => {
      setLiked(!next);
      setLikes((n) => Math.max(0, n + (next ? -1 : 1)));
      writeSet(LIKED_KEY, next ? ids : [...ids, id]);
    });
  };

  // View dikira bila web/slaid dibuka, sekali setiap browser
  const countView = () => {
    const seen = readSet(VIEWED_KEY);
    if (seen.includes(id)) return;
    writeSet(VIEWED_KEY, [...seen, id]);
    setViews((n) => n + 1);
    sendCounter('view', id).catch(() => {});
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden flex flex-col transition-all duration-200 hover:shadow-md hover:border-zinc-300">
      {/* 1. Kotak Thumbnail Penghantar */}
      <div className="relative aspect-video bg-zinc-100 overflow-hidden border-b border-zinc-100">
        <img
          src={submission.thumbnailUrl}
          alt={submission.tajukWeb}
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = getCleanFallbackThumbnail(submission.tajukWeb);
          }}
          className="w-full h-full object-cover object-top transition-transform duration-300 hover:scale-105"
        />
      </div>

      {/* Kandungan Kad */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          {/* 2. Nama Pelajar */}
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <h3 className="font-bold text-zinc-900 text-base leading-snug truncate">
              {submission.nama}
            </h3>
            {submission.noMatrik && (
              <span className="text-[11px] font-mono text-zinc-400 shrink-0">
                {submission.noMatrik}
              </span>
            )}
          </div>

          {/* 3. Tajuk Web */}
          <p className="text-zinc-600 text-sm line-clamp-2 leading-relaxed">
            {submission.tajukWeb}
          </p>
        </div>

        {/* Like & View */}
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <button
            onClick={toggleLike}
            aria-pressed={liked}
            aria-label={liked ? 'Batal suka' : 'Suka projek ini'}
            className={`inline-flex items-center gap-1.5 py-1 px-2 -ml-2 rounded-md hover:bg-rose-50 transition-colors cursor-pointer ${
              liked ? 'text-rose-600' : 'hover:text-rose-600'
            }`}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span>{likes}</span>
          </button>
          <span className="inline-flex items-center gap-1.5" title="Bilangan paparan">
            <Eye className="w-4 h-4" />
            <span>{views}</span>
          </span>
        </div>

        {/* Baris Pautan */}
        <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2 text-xs">
          {/* 4. Pautan Slaid */}
          <button
            onClick={() => {
              countView();
              onOpenSlide(submission);
            }}
            aria-label={`Buka slaid ${submission.nama}`}
            className="inline-flex items-center gap-1.5 text-zinc-700 hover:text-blue-600 font-medium py-1 px-2 rounded-md hover:bg-zinc-50 transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-rose-500" />
            <span>Pautan Slaid</span>
          </button>

          {/* 5. Pautan Laman Web */}
          <a
            href={submission.linkLamanWeb}
            target="_blank"
            rel="noreferrer"
            onClick={countView}
            aria-label={`Buka laman web ${submission.nama}`}
            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium py-1 px-2 rounded-md hover:bg-blue-50 transition-colors"
          >
            <span className="truncate max-w-[130px]">{domain}</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </a>
        </div>
      </div>
    </div>
  );
};