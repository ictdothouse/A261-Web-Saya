export interface StudentSubmission {
  id: string;
  nama: string;
  noMatrik: string;
  tajukWeb: string;
  slidePdfUrl: string; // PDF Blob URL, Data URL, or drive/web link
  slideFileName?: string;
  linkLamanWeb: string;
  thumbnailUrl: string;
  submittedAt: string;
  status?: 'Aktif' | 'Dipadam';
}

export interface TeacherUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}
