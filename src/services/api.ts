import { API_URL } from '../config';
import { StudentSubmission } from '../types';
import { generateWebsiteThumbnail, getCleanFallbackThumbnail } from '../utils/thumbnail';

type Row = Omit<StudentSubmission, 'thumbnailUrl'>;

export interface AdminData {
  sheetUrl: string;
  folderUrl: string;
  submissions: StudentSubmission[];
}

const toSubmission = (r: Row): StudentSubmission => ({
  ...r,
  thumbnailUrl: generateWebsiteThumbnail(r.linkLamanWeb) || getCleanFallbackThumbnail(r.tajukWeb),
});

async function parse(res: Response) {
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Ralat pelayan.');
  return data;
}

// text/plain elak preflight CORS yang tidak disokong Apps Script
const post = (body: object) =>
  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
  }).then(parse);

export async function listSubmissions(): Promise<StudentSubmission[]> {
  if (!API_URL) return [];
  const data = await fetch(`${API_URL}?action=list`).then(parse);
  return data.submissions.map(toSubmission);
}

export const submitAssignment = (
  d: Pick<StudentSubmission, 'nama' | 'noMatrik' | 'tajukWeb' | 'linkLamanWeb' | 'slidePdfUrl' | 'slideFileName'>
) => post({ action: 'submit', ...d });

export const sendCounter = (action: 'like' | 'view', id: string, delta?: 1 | -1) =>
  post({ action, id, delta });

export async function adminList(password: string): Promise<AdminData> {
  const data = await post({ action: 'adminList', password });
  return { ...data, submissions: data.submissions.map(toSubmission) };
}

export const adminSetStatus = (password: string, id: string, status: 'Aktif' | 'Dipadam') =>
  post({ action: 'adminSetStatus', password, id, status });
