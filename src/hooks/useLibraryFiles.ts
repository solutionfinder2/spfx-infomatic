import { useCallback, useEffect, useState } from 'react';
import { getWeb, normalizeSiteUrl } from '../services/pnpjsConfig';
import { ILibraryFile } from '../models/ILibraryFile';

/** Turns PnPjs / OData errors into one readable line for editors. */
export const friendlyError = (e: unknown, title: string, site: string): string => {
  const raw = e instanceof Error ? e.message : String(e);
  const m = /"value":"([^"]+)"/.exec(raw);
  const msg = m ? m[1] : raw;
  if (/does not exist at site/i.test(msg) || /\[404\]/.test(raw)) {
    return `"${title}" was not found on ${site || 'this site'}. Check the title, or set Site URL if it lives on another site.`;
  }
  return msg;
};

export interface IUseLibraryFilesResult {
  files: ILibraryFile[];
  /** Files + folders in the library (ItemCount). */
  total: number;
  /** Sum of the sizes of the files returned (bytes). */
  bytes: number;
  loading: boolean;
  error: string | undefined;
  refresh: () => Promise<void>;
}

interface IRow {
  Id: number; FileLeafRef: string; FileRef: string; Modified: string;
  Editor?: { Title?: string; EMail?: string };
  /** File_x0020_Size is a computed view field and cannot be $selected; File/Length can. */
  File?: { Length?: string | number };
}

/**
 * FEATURE (ask: "display data from … library"): the newest `max` files of a
 * document library (folders excluded), newest first, with editor and size.
 * Reads the library as a list so the same code works for any library title.
 * `siteUrl` (optional) reads the library from another site.
 */
export const useLibraryFiles = (libraryTitle: string, max: number = 8, siteUrl?: string): IUseLibraryFilesResult => {
  const site = normalizeSiteUrl(siteUrl);
  const [files, setFiles] = useState<ILibraryFile[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [bytes, setBytes] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const refresh = useCallback(async (): Promise<void> => {
    const title = (libraryTitle || '').trim();
    if (!title) { setFiles([]); setTotal(0); setBytes(0); setError(undefined); return; }
    setLoading(true);
    setError(undefined);
    try {
      const list = getWeb(site).lists.getByTitle(title);
      const [info, rows] = await Promise.all([
        list.select('ItemCount', 'BaseTemplate')() as Promise<{ ItemCount: number; BaseTemplate: number }>,
        list.items
          .select('Id', 'FileLeafRef', 'FileRef', 'Modified', 'Editor/Title', 'Editor/EMail', 'File/Length')
          .expand('Editor', 'File')
          .filter('FSObjType eq 0')
          .orderBy('Modified', false)
          .top(Math.max(1, Math.min(max, 200)))() as Promise<IRow[]>
      ]);
      if (info.BaseTemplate !== 101 && info.BaseTemplate !== 700 && info.BaseTemplate !== 109 && info.BaseTemplate !== 119) {
        // not a library — still works (FileLeafRef exists on every list) but tell the editor
        throw new Error(`"${title}" is a list, not a document library (template ${info.BaseTemplate}).`);
      }
      const mapped: ILibraryFile[] = rows.map(r => {
        const name = r.FileLeafRef || '';
        const dot = name.lastIndexOf('.');
        return {
          Id: r.Id,
          Name: name,
          Url: r.FileRef,
          Extension: dot >= 0 ? name.slice(dot + 1).toLowerCase() : '',
          Size: r.File && r.File.Length !== undefined ? Number(r.File.Length) || 0 : 0,
          Modified: r.Modified,
          EditorName: r.Editor ? r.Editor.Title : undefined,
          EditorEmail: r.Editor ? r.Editor.EMail : undefined
        };
      });
      setFiles(mapped);
      setTotal(info.ItemCount);
      setBytes(mapped.reduce((s, f) => s + f.Size, 0));
    } catch (e) {
      setFiles([]);
      setTotal(0);
      setBytes(0);
      setError(friendlyError(e, title, site));
    } finally {
      setLoading(false);
    }
  }, [libraryTitle, max, site]);

  useEffect(() => { refresh().catch(() => undefined); }, [refresh]);

  return { files, total, bytes, loading, error, refresh };
};
