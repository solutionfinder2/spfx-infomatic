import { useCallback, useEffect, useState } from 'react';
import { getWeb, normalizeSiteUrl } from '../services/pnpjsConfig';
import { ICountryRow, IFieldMeta, UNSUPPORTED_FIELD_TYPES, toCountryRow } from '../models/ICountryRow';
import { friendlyError } from './useLibraryFiles';

export interface IUseCountryListResult {
  rows: ICountryRow[];
  /** Visible, selectable columns in list order (what the facts panel iterates). */
  fields: IFieldMeta[];
  loading: boolean;
  error: string | undefined;
  checked: boolean;
  refresh: () => Promise<void>;
}

interface ILoaded { rows: ICountryRow[]; fields: IFieldMeta[] }

/** SharePoint rejects queries with more than 12 lookup-type columns; stay under it. */
const MAX_LOOKUPS = 11;

/** Module-level cache: the list is big (250 rows × 80 columns) and the screen is re-entered often. */
const cache: Record<string, Promise<ILoaded>> = {};

const load = async (site: string, title: string): Promise<ILoaded> => {
  const list = getWeb(site).lists.getByTitle(title);
  const [rawFields, root] = await Promise.all([
    list.fields
      .select('InternalName', 'Title', 'TypeAsString', 'Hidden', 'ReadOnlyField', 'RichText')
      .filter('Hidden eq false')() as Promise<{ InternalName: string; Title: string; TypeAsString: string; ReadOnlyField: boolean; RichText?: boolean }[]>,
    list.rootFolder.select('ServerRelativeUrl')() as Promise<{ ServerRelativeUrl: string }>
  ]);
  const fields: IFieldMeta[] = rawFields
    .filter(f => !f.ReadOnlyField && UNSUPPORTED_FIELD_TYPES.indexOf(f.TypeAsString) < 0)
    .map(f => ({ internalName: f.InternalName, title: f.Title, type: f.TypeAsString, richText: !!f.RichText }));

  const select: string[] = ['Id'];
  const expand: string[] = [];
  let lookups = 0;
  fields.forEach(f => {
    switch (f.type) {
      case 'Lookup': case 'LookupMulti':
        if (lookups < MAX_LOOKUPS) { lookups++; select.push(`${f.internalName}/Id`, `${f.internalName}/Title`); expand.push(f.internalName); }
        break;
      case 'User': case 'UserMulti':
        if (lookups < MAX_LOOKUPS) { lookups++; select.push(`${f.internalName}/Id`, `${f.internalName}/Title`, `${f.internalName}/EMail`); expand.push(f.internalName); }
        break;
      default:
        select.push(f.internalName);
    }
  });

  let q = list.items.select(...select).top(1000);
  if (expand.length) { q = q.expand(...expand); }
  const rows = (await q()) as Record<string, unknown>[];
  const mapped = rows
    .map(r => toCountryRow(r, root.ServerRelativeUrl))
    .filter(r => !!r.Title && r.values.Display !== false)
    .sort((a, b) => {
      const oa = typeof a.values.SortOrder === 'number' ? (a.values.SortOrder as number) : Number.MAX_SAFE_INTEGER;
      const ob = typeof b.values.SortOrder === 'number' ? (b.values.SortOrder as number) : Number.MAX_SAFE_INTEGER;
      return oa !== ob ? oa - ob : a.Title.localeCompare(b.Title);
    });
  return { rows: mapped, fields };
};

/**
 * FEATURE (ask: "use the country list … display the data from the list"): loads the
 * Countries list with every visible column, typed by the list schema, so the explorer
 * can show whatever the list has without a hard-coded field list.
 */
export const useCountryList = (listTitle: string, siteUrl?: string): IUseCountryListResult => {
  const site = normalizeSiteUrl(siteUrl);
  const title = (listTitle || '').trim();
  const [rows, setRows] = useState<ICountryRow[]>([]);
  const [fields, setFields] = useState<IFieldMeta[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [checked, setChecked] = useState<boolean>(false);

  const run = useCallback(async (bypass: boolean): Promise<void> => {
    if (!title) { setRows([]); setFields([]); setChecked(false); setError(undefined); return; }
    const key = `${site}|${title}`;
    if (bypass || !cache[key]) { cache[key] = load(site, title); }
    setLoading(true);
    setError(undefined);
    try {
      const r = await cache[key];
      setRows(r.rows);
      setFields(r.fields);
    } catch (e) {
      delete cache[key];
      setRows([]);
      setFields([]);
      setError(friendlyError(e, title, site));
    } finally {
      setChecked(true);
      setLoading(false);
    }
  }, [title, site]);

  useEffect(() => { run(false).catch(() => undefined); }, [run]);
  const refresh = useCallback((): Promise<void> => run(true), [run]);

  return { rows, fields, loading, error, checked, refresh };
};
