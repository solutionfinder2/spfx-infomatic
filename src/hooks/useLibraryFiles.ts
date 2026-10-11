import { useCallback, useEffect, useState } from 'react';
import { getSP } from '../services/pnpjsConfig';
import { ILibraryFile } from '../models/ILibraryFile';

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
  Id: number; FileLeafRef: string; FileRef: string; File_x0020_Size?: string | number; Modified: string;
  Editor?: { Title?: string; EMail?: string };
}

/**
 * FEATURE (ask: "display data from … library"): the newest `max` files of a
 * document library (folders excluded), newest first, with editor and size.
 * Reads the library as a list so the same code works for any library title.
 */
export const useLibraryFiles = (libraryTitle: string, max: number = 8): IUseLibraryFilesResult => {
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
      const list = getSP().web.lists.getByTitle(title);
      const [info, rows] = await Promise.all([
        list.select('ItemCount', 'BaseTemplate')() as Promise<{ ItemCount: number; BaseTemplate: number }>,
        list.items
          .select('Id', 'FileLeafRef', 'FileRef', 'File_x0020_Size', 'Modified', 'Editor/Title', 'Editor/EMail')
          .expand('Editor')
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
          Size: Number(r.File_x0020_Size) || 0,
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
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [libraryTitle, max]);

  useEffect(() => { refresh().catch(() => undefined); }, [refresh]);

  return { files, total, bytes, loading, error, refresh };
};
