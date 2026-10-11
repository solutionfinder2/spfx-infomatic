import { WebPartContext } from '@microsoft/sp-webpart-base';
import { SPFI, spfi, SPFx } from '@pnp/sp';
import { IWeb, Web } from '@pnp/sp/webs';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import '@pnp/sp/fields';
import '@pnp/sp/files';
import '@pnp/sp/folders';

let _sp: SPFI | undefined;

/**
 * Initialize from the web part's onInit by passing the web part context.
 * Afterwards, call getSP() with no arguments anywhere in the solution.
 *
 * BUGFIX (stale context after SPA navigation / edit mode): SharePoint pages
 * navigate client-side, disposing old web part instances — their pageContext
 * becomes undefined. We must therefore RE-initialize whenever a fresh context
 * is provided instead of keeping the first (possibly dead) one, otherwise
 * requests fail with "e.pageContext is undefined" until a hard refresh.
 */
export const getSP = (context?: WebPartContext): SPFI => {
  if (context) {
    _sp = spfi().using(SPFx(context));
  }

  if (!_sp) {
    throw new Error('PnPjs is not initialized. Call getSP(this.context) inside the web part onInit first.');
  }

  return _sp;
};

/**
 * Trims a pasted URL down to the site: strips query / hash, page and list paths
 * (/SitePages/…, /Lists/…, /Shared Documents/…, /_layouts/…) and the trailing slash.
 * Returns '' for anything that is not an absolute http(s) URL.
 */
export const normalizeSiteUrl = (raw: string | undefined): string => {
  let v = (raw || '').trim();
  if (!v || !/^https?:\/\//i.test(v)) { return ''; }
  v = v.split('#')[0].split('?')[0];
  v = v.replace(/\/(SitePages|Lists|Shared%20Documents|Shared Documents|_layouts|SiteAssets|Forms)\/.*$/i, '');
  v = v.replace(/\/[^/]+\.aspx$/i, '');
  return v.replace(/\/+$/, '');
};

/** The web to query: another site when `siteUrl` is set, else the current one. */
export const getWeb = (siteUrl?: string): IWeb => {
  const sp = getSP();
  const url = normalizeSiteUrl(siteUrl);
  return url ? Web([sp.web, url]) : sp.web;
};
