import { WebPartContext } from '@microsoft/sp-webpart-base';
import { SPFI, spfi, SPFx } from '@pnp/sp';
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
