/** A file from the configured document library (folders are skipped). */
export interface ILibraryFile {
  Id: number;
  /** File GUID — used by the SharePoint embed viewer (`_layouts/15/embed.aspx?UniqueId=`). */
  UniqueId: string;
  Name: string;
  /** Server-relative URL — open with window.location.origin + Url. */
  Url: string;
  /** Lower-case extension without the dot ("docx", "pdf"). */
  Extension: string;
  Size: number;
  Modified: string;
  EditorName?: string;
  EditorEmail?: string;
}

/** Fluent UI icon per extension (fallback "Page"). */
export const fileIcon = (ext: string): string => {
  switch ((ext || '').toLowerCase()) {
    case 'doc': case 'docx': return 'WordDocument';
    case 'xls': case 'xlsx': case 'csv': return 'ExcelDocument';
    case 'ppt': case 'pptx': return 'PowerPointDocument';
    case 'pdf': return 'PDF';
    case 'one': return 'OneNoteLogo';
    case 'png': case 'jpg': case 'jpeg': case 'gif': case 'svg': case 'webp': return 'Photo2';
    case 'mp4': case 'mov': case 'avi': case 'wmv': return 'Video';
    case 'zip': case '7z': case 'rar': return 'ZipFolder';
    case 'txt': case 'md': return 'TextDocument';
    case 'aspx': case 'html': case 'htm': return 'Globe';
    case 'vsdx': case 'vsd': return 'VisioDocument';
    case 'msg': case 'eml': return 'Mail';
    default: return 'Page';
  }
};

export type FileKind = 'video' | 'audio' | 'image' | 'pdf' | 'office' | 'text' | 'other';

/** What the document viewer should do with a file. */
export const fileKind = (ext: string): FileKind => {
  switch ((ext || '').toLowerCase()) {
    case 'mp4': case 'm4v': case 'webm': case 'ogv': case 'mov': case 'avi': case 'wmv': case 'mkv': return 'video';
    case 'mp3': case 'wav': case 'm4a': case 'ogg': case 'aac': return 'audio';
    case 'png': case 'jpg': case 'jpeg': case 'gif': case 'svg': case 'webp': case 'bmp': return 'image';
    case 'pdf': return 'pdf';
    case 'doc': case 'docx': case 'xls': case 'xlsx': case 'csv': case 'ppt': case 'pptx': case 'one': case 'vsdx': case 'vsd': return 'office';
    case 'txt': case 'md': case 'json': case 'xml': case 'log': return 'text';
    default: return 'other';
  }
};

/** Extensions the browser's own <video> element plays; others go through the SharePoint / Stream player. */
export const isNativeVideo = (ext: string): boolean => ['mp4', 'm4v', 'webm', 'ogv'].indexOf((ext || '').toLowerCase()) >= 0;

export const formatBytes = (bytes: number): string => {
  if (!bytes || bytes <= 0) { return '0 KB'; }
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v < 10 && i > 0 ? v.toFixed(1) : Math.round(v)} ${units[i]}`;
};

export const formatDate = (iso: string | undefined): string => {
  if (!iso) { return ''; }
  const d = new Date(iso);
  if (isNaN(d.getTime())) { return ''; }
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

/** "2 hours ago", "3 days ago" — falls back to the date beyond 30 days. */
export const timeAgo = (iso: string | undefined): string => {
  if (!iso) { return ''; }
  const d = new Date(iso);
  if (isNaN(d.getTime())) { return ''; }
  const s = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000));
  if (s < 60) { return 'just now'; }
  const m = Math.round(s / 60);
  if (m < 60) { return `${m} min ago`; }
  const h = Math.round(m / 60);
  if (h < 24) { return `${h} hour${h === 1 ? '' : 's'} ago`; }
  const days = Math.round(h / 24);
  if (days <= 30) { return `${days} day${days === 1 ? '' : 's'} ago`; }
  return formatDate(iso);
};
