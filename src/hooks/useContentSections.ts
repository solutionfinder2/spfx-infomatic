import { useCallback, useEffect, useState } from 'react';
import { getWeb, normalizeSiteUrl } from '../services/pnpjsConfig';
import { IContentSection, SECTION_OPTIONAL_COLUMNS } from '../models/IContentSection';
import { friendlyError } from './useLibraryFiles';

export interface IContentSectionsOptions {
  /** Internal name of the rich text column (default "Content"). */
  contentField?: string;
  /** Internal name of the Choice column used for grouping (default "Category"; '' or 'none' = no grouping). */
  categoryField?: string;
  /** Site that holds the list; empty = current site. */
  siteUrl?: string;
  /** Maximum sections (default 30, max 500). */
  max?: number;
  /** Hide sections outside their StartDate / EndDate window (default true when both columns exist). */
  useSchedule?: boolean;
}

export interface IUseContentSectionsResult {
  sections: IContentSection[];
  loading: boolean;
  error: string | undefined;
  /** True once the list schema was read. */
  checked: boolean;
  /** The configured content column is missing on the list. */
  contentMissing: boolean;
  /** The list has the configured category column. */
  hasCategory: boolean;
  /** Optional core columns the list does not have. */
  missingOptional: string[];
  /** Eligible sections cut off by `max`. */
  hiddenByLimit: number;
  refresh: () => Promise<void>;
}

const inWindow = (s: IContentSection, now: Date): boolean =>
  !(s.StartDate && now < new Date(s.StartDate)) && !(s.EndDate && now > new Date(s.EndDate));

/**
 * FEATURE (ask: "content accordion solution on screen 3 … reusable for the other
 * screens"): schema-aware loader for rich text sections — reads the list's columns
 * first and only selects the ones that exist, so any list with a text column works.
 * Display = No and (optionally) out-of-schedule sections never reach the UI.
 */
export const useContentSections = (listTitle: string, options: IContentSectionsOptions = {}): IUseContentSectionsResult => {
  const site = normalizeSiteUrl(options.siteUrl);
  const contentCol = (options.contentField || 'Content').trim();
  const categoryCol = options.categoryField === 'none' ? '' : (options.categoryField || 'Category').trim();
  const max = Math.max(1, Math.min(options.max || 30, 500));
  const useSchedule = options.useSchedule !== false;

  const [sections, setSections] = useState<IContentSection[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [checked, setChecked] = useState<boolean>(false);
  const [contentMissing, setContentMissing] = useState<boolean>(false);
  const [hasCategory, setHasCategory] = useState<boolean>(false);
  const [missingOptional, setMissingOptional] = useState<string[]>([]);
  const [hiddenByLimit, setHiddenByLimit] = useState<number>(0);

  const refresh = useCallback(async (): Promise<void> => {
    const title = (listTitle || '').trim();
    if (!title) {
      setSections([]); setChecked(false); setContentMissing(false); setHasCategory(false); setMissingOptional([]); setHiddenByLimit(0); setError(undefined);
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const list = getWeb(site).lists.getByTitle(title);
      const fields = await list.fields.select('InternalName')() as { InternalName: string }[];
      const names = new Set(fields.map(f => f.InternalName));
      const has = (n: string): boolean => names.has(n);

      const catOk = !!categoryCol && has(categoryCol);
      const scheduleOk = has('StartDate') && has('EndDate');
      setChecked(true);
      setHasCategory(catOk);
      setMissingOptional(SECTION_OPTIONAL_COLUMNS.filter(n => !has(n)));

      if (!has(contentCol)) {
        setContentMissing(true);
        setSections([]);
        setHiddenByLimit(0);
        return;
      }
      setContentMissing(false);

      const select = ['Id', 'Title', contentCol]
        .concat(catOk ? [categoryCol] : [])
        .concat(SECTION_OPTIONAL_COLUMNS.filter(has));
      const rows = await list.items.select(...select).top(500)() as Record<string, unknown>[];

      const mapped: IContentSection[] = rows.map(r => ({
        Id: r.Id as number,
        Title: (r.Title as string) || '',
        Content: (r[contentCol] as string) || '',
        Category: catOk ? (r[categoryCol] as string | undefined) : undefined,
        SortOrder: r.SortOrder as number | undefined,
        Expanded: r.Expanded as boolean | undefined,
        Display: r.Display as boolean | undefined,
        StartDate: r.StartDate as string | undefined,
        EndDate: r.EndDate as string | undefined
      }));

      const now = new Date();
      const visible = mapped.filter(s => s.Display !== false && (!useSchedule || !scheduleOk || inWindow(s, now)));
      visible.sort((a, b) => {
        const oa = typeof a.SortOrder === 'number' ? a.SortOrder : Number.MAX_SAFE_INTEGER;
        const ob = typeof b.SortOrder === 'number' ? b.SortOrder : Number.MAX_SAFE_INTEGER;
        return oa !== ob ? oa - ob : a.Title.localeCompare(b.Title);
      });
      setHiddenByLimit(Math.max(0, visible.length - max));
      setSections(visible.slice(0, max));
    } catch (e) {
      setSections([]);
      setChecked(false);
      setHiddenByLimit(0);
      setError(friendlyError(e, title, site));
    } finally {
      setLoading(false);
    }
  }, [listTitle, contentCol, categoryCol, site, max, useSchedule]);

  useEffect(() => { refresh().catch(() => undefined); }, [refresh]);

  return { sections, loading, error, checked, contentMissing, hasCategory, missingOptional, hiddenByLimit, refresh };
};
