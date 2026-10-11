/**
 * Schema-driven view of the Countries list (spfx-vector-map's reference list, but any
 * list with a Title and a Continent column works). The hook reads the column metadata
 * and keeps every value keyed by internal name; the UI formats values by column type.
 */
export interface IFieldMeta {
  internalName: string;
  title: string;
  /** SharePoint TypeAsString: Text, Note, Number, Boolean, DateTime, Choice, MultiChoice, URL, Lookup, LookupMulti, User, UserMulti, Thumbnail, Currency … */
  type: string;
  richText: boolean;
}

export interface ICountryRow {
  Id: number;
  Title: string;
  Alpha2?: string;
  /** ISO 3166-1 numeric as text ("840") — the world-atlas shape id. */
  Numeric?: string;
  Continent?: string;
  /** Server-relative URL of the flag image, when the list has a Flag image column. */
  FlagUrl?: string;
  Latitude?: number;
  Longitude?: number;
  /** Every selected value, keyed by internal column name (raw REST shape). */
  values: Record<string, unknown>;
}

/** Columns the explorer treats specially (hero / map) rather than listing as facts. */
export const COUNTRY_HERO_COLUMNS = ['Title', 'OfficialName', 'NativeName', 'Flag', 'Continent', 'Capital', 'Alpha2', 'Alpha3', 'Numeric'];

/** Columns never shown (system / technical). */
export const COUNTRY_SKIP_COLUMNS = ['Display', 'SortOrder', 'FlagSvg', 'FlagSvgPowerApps', 'ContentType', 'Attachments', 'Aliases', 'Latitude', 'Longitude', 'Neighbours'];

/** Field types that cannot be selected / rendered generically. */
export const UNSUPPORTED_FIELD_TYPES = ['Computed', 'Attachments', 'Counter', 'Calculated', 'TaxonomyFieldType', 'TaxonomyFieldTypeMulti', 'Geolocation', 'ContentTypeId', 'File', 'Guid', 'Location', 'Image'];

interface IImageJson { serverRelativeUrl?: string; serverUrl?: string; fileName?: string }

/**
 * SharePoint Image ("Thumbnail") columns return a JSON string with `serverRelativeUrl` when
 * the file lives in Site Assets, or only `fileName` when it was uploaded through the list
 * form (stored as an item attachment: <list root>/Attachments/<id>/<fileName>).
 */
export const imageUrl = (raw: unknown, listRootUrl?: string, itemId?: number): string | undefined => {
  if (!raw) { return undefined; }
  let o: IImageJson | undefined;
  if (typeof raw === 'object') {
    o = raw as IImageJson;
  } else if (typeof raw === 'string') {
    const s = raw.trim();
    if (!s) { return undefined; }
    if (s.charAt(0) !== '{') { return s; }
    try { o = JSON.parse(s) as IImageJson; } catch { return undefined; }
  }
  if (!o) { return undefined; }
  if (o.serverRelativeUrl) { return o.serverRelativeUrl; }
  if (o.fileName && listRootUrl && itemId) { return `${listRootUrl.replace(/\/+$/, '')}/Attachments/${itemId}/${encodeURIComponent(o.fileName)}`; }
  return undefined;
};

const str = (raw: unknown): string | undefined => (typeof raw === 'string' && raw.trim() ? raw.trim() : undefined);
const num = (raw: unknown): number | undefined => (typeof raw === 'number' && !isNaN(raw) ? raw : undefined);

export const toCountryRow = (row: Record<string, unknown>, listRootUrl?: string): ICountryRow => ({
  Id: row.Id as number,
  Title: (row.Title as string) || '',
  Alpha2: str(row.Alpha2) ? (str(row.Alpha2) as string).toUpperCase() : undefined,
  Numeric: str(row.Numeric),
  Continent: str(row.Continent),
  FlagUrl: imageUrl(row.Flag, listRootUrl, row.Id as number),
  Latitude: num(row.Latitude),
  Longitude: num(row.Longitude),
  values: row
});
