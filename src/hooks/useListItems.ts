import { useCallback, useEffect, useState } from 'react';
import { getWeb, normalizeSiteUrl } from '../services/pnpjsConfig';
import { IListItem, LIST_OPTIONAL_COLUMNS } from '../models/IListItem';
import { friendlyError } from './useLibraryFiles';

export interface IUseListItemsResult {
  items: IListItem[];
  /** Total rows in the list (ItemCount), independent of `max`. */
  total: number;
  /** Optional columns that exist on the list (Description, Icon, …). */
  columns: string[];
  loading: boolean;
  error: string | undefined;
  refresh: () => Promise<void>;
}

interface IRow {
  Id: number; Title: string; Modified?: string; Author?: { Title?: string };
  Description?: string; Icon?: string; Category?: string; SortOrder?: number;
}

/**
 * FEATURE (ask: "display data from list"): loads up to `max` rows from a list by
 * title with PnPjs. Schema-aware: the optional columns in LIST_OPTIONAL_COLUMNS
 * are selected only when the list actually has them, so any list works.
 */
export const useListItems = (listTitle: string, max: number = 8, siteUrl?: string): IUseListItemsResult => {
  const site = normalizeSiteUrl(siteUrl);
  const [items, setItems] = useState<IListItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const refresh = useCallback(async (): Promise<void> => {
    const title = (listTitle || '').trim();
    if (!title) { setItems([]); setTotal(0); setColumns([]); setError(undefined); return; }
    setLoading(true);
    setError(undefined);
    try {
      const list = getWeb(site).lists.getByTitle(title);
      const [info, fields] = await Promise.all([
        list.select('ItemCount')() as Promise<{ ItemCount: number }>,
        list.fields.select('InternalName')() as Promise<{ InternalName: string }[]>
      ]);
      const have = new Set(fields.map(f => f.InternalName));
      const optional = LIST_OPTIONAL_COLUMNS.filter(c => have.has(c));
      const select = ['Id', 'Title', 'Modified', 'Author/Title'].concat(optional);
      let q = list.items.select(...select).expand('Author').top(Math.max(1, Math.min(max, 200)));
      q = have.has('SortOrder') ? q.orderBy('SortOrder', true).orderBy('Modified', false) : q.orderBy('Modified', false);
      const rows: IRow[] = await q();
      setItems(rows.map(r => ({
        Id: r.Id,
        Title: r.Title || `Item ${r.Id}`,
        Modified: r.Modified,
        AuthorName: r.Author ? r.Author.Title : undefined,
        Description: r.Description,
        Icon: r.Icon,
        Category: r.Category,
        SortOrder: r.SortOrder
      })));
      setTotal(info.ItemCount);
      setColumns(optional);
    } catch (e) {
      setItems([]);
      setTotal(0);
      setError(friendlyError(e, title, site));
    } finally {
      setLoading(false);
    }
  }, [listTitle, max, site]);

  useEffect(() => { refresh().catch(() => undefined); }, [refresh]);

  return { items, total, columns, loading, error, refresh };
};
