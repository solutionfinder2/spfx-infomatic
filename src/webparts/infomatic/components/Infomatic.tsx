import * as React from 'react';
import { Icon, Spinner, SpinnerSize } from '@fluentui/react';
import styles from './Infomatic.module.scss';
import type { IInfomaticProps } from './IInfomaticProps';
import { ThemeProvider } from '../../../theme/ThemeContext';
import { neu, NeuButton, NeuCard, NeuCircle, NeuNotice, NeuRoot, ThemeToggle } from '../../../components/neu';
import { NeuRing, IRingNode } from '../../../components/neu/NeuRing';
import { useListItems } from '../../../hooks/useListItems';
import { useLibraryFiles } from '../../../hooks/useLibraryFiles';
import { fileIcon, formatBytes, formatDate, timeAgo } from '../../../models/ILibraryFile';
import { normalizeSiteUrl } from '../../../services/pnpjsConfig';

/** Icons cycled for list rows without an "Icon" column — same set as the sample. */
const RING_ICONS = ['Ringer', 'Work', 'Globe', 'Lightbulb', 'Contact', 'PieDouble', 'Settings', 'Rocket', 'Shield'];

const pad = (n: number): string => String(n).padStart(2, '0');

/**
 * FEATURE (asks: "display data from list and library", "look and feel like the
 * sample", "theme changer for dark and light mode"):
 * header (gradient title + switcher) → KPI discs → infographic ring → list rows
 * + file tiles. Pure presentation: data comes from the two hooks.
 */
const InfomaticBody: React.FC<IInfomaticProps> = (props) => {
  const max = Math.max(1, Math.min(props.maxItems || 8, 50));
  const list = useListItems(props.listTitle, max, props.dataSiteUrl);
  const library = useLibraryFiles(props.libraryTitle, max, props.dataSiteUrl);
  const loading = list.loading || library.loading;
  // links (item forms, list / library pages) must point at the site the data comes from
  const siteUrl = normalizeSiteUrl(props.dataSiteUrl) || props.siteUrl;
  const origin = window.location.origin;

  const ringNodes: IRingNode[] = React.useMemo(() => {
    if (props.listTitle && list.items.length > 0) {
      return list.items.map((it, i) => ({
        key: it.Id,
        icon: it.Icon || RING_ICONS[i % RING_ICONS.length],
        caption: it.Category || `Step ${pad(i + 1)}`,
        label: it.Title,
        description: it.Description || (it.Modified ? `Updated ${timeAgo(it.Modified)}` : undefined),
        href: `${siteUrl}/Lists/${encodeURIComponent(props.listTitle)}/DispForm.aspx?ID=${it.Id}`
      }));
    }
    return library.files.map((f, i) => ({
      key: f.Id,
      icon: fileIcon(f.Extension),
      caption: f.Extension ? f.Extension.toUpperCase() : `File ${pad(i + 1)}`,
      label: f.Name,
      description: `${formatBytes(f.Size)} · ${timeAgo(f.Modified)}`,
      href: `${origin}${f.Url}?web=1`
    }));
  }, [props.listTitle, siteUrl, list.items, library.files, origin]);

  const lastUpdate = React.useMemo(() => {
    const dates = list.items.map(i => i.Modified).concat(library.files.map(f => f.Modified)).filter(Boolean) as string[];
    if (dates.length === 0) { return undefined; }
    return dates.reduce((a, b) => (new Date(a) > new Date(b) ? a : b));
  }, [list.items, library.files]);

  const refresh = (): void => {
    list.refresh().catch(() => undefined);
    library.refresh().catch(() => undefined);
  };

  const nothingConfigured = !props.listTitle && !props.libraryTitle;

  return (
    <NeuRoot>
      <header className={styles.header}>
        <div className={styles.titleBlock}>
          <h2 className={`${styles.title} ${neu.gradientText}`}>{props.title || 'Infomatic'}</h2>
          {props.subtitle && <p className={styles.subtitle}>{props.subtitle}</p>}
        </div>
        <div className={styles.headerActions}>
          <NeuButton icon="Refresh" title="Refresh" onClick={refresh} disabled={loading} />
          {props.showThemeToggle && <ThemeToggle />}
        </div>
      </header>

      {nothingConfigured && (
        <div className={styles.section}>
          <NeuNotice kind={props.isEditMode ? 'warn' : 'info'}>
            {props.isEditMode
              ? 'Set a list title and / or a document library title in the property pane.'
              : 'Nothing to show yet.'}
          </NeuNotice>
        </div>
      )}
      {props.isEditMode && list.error && (
        <div className={styles.section}><NeuNotice kind="warn">List &quot;{props.listTitle}&quot;: {list.error}</NeuNotice></div>
      )}
      {props.isEditMode && library.error && (
        <div className={styles.section}><NeuNotice kind="warn">Library &quot;{props.libraryTitle}&quot;: {library.error}</NeuNotice></div>
      )}

      {/* ---- KPI row ---- */}
      {!nothingConfigured && (
        <div className={styles.stats}>
          {props.listTitle && (
            <div className={`${neu.raised} ${styles.stat}`}>
              <NeuCircle icon="BulletedList" size={54} small />
              <div className={styles.statText}>
                <span className={styles.statValue}>{list.total}</span>
                <span className={styles.statLabel}>List items</span>
              </div>
            </div>
          )}
          {props.libraryTitle && (
            <div className={`${neu.raised} ${styles.stat}`}>
              <NeuCircle icon="DocumentSet" size={54} small />
              <div className={styles.statText}>
                <span className={styles.statValue}>{library.total}</span>
                <span className={styles.statLabel}>Files &amp; folders</span>
              </div>
            </div>
          )}
          {props.libraryTitle && (
            <div className={`${neu.raised} ${styles.stat}`}>
              <NeuCircle icon="HardDriveGroup" size={54} small />
              <div className={styles.statText}>
                <span className={styles.statValue}>{formatBytes(library.bytes)}</span>
                <span className={styles.statLabel}>Size (latest {library.files.length})</span>
              </div>
            </div>
          )}
          <div className={`${neu.raised} ${styles.stat}`}>
            <NeuCircle icon="Clock" size={54} small />
            <div className={styles.statText}>
              <span className={styles.statValue}>{lastUpdate ? timeAgo(lastUpdate) : '—'}</span>
              <span className={styles.statLabel}>Last update</span>
            </div>
          </div>
        </div>
      )}

      {loading && ringNodes.length === 0 && <Spinner size={SpinnerSize.large} label="Loading…" />}

      {/* ---- infographic ring ---- */}
      {props.showRing && ringNodes.length > 0 && (
        <div className={styles.section}>
          <NeuRing title={props.title || 'Infomatic'} subtitle={props.listTitle && list.items.length > 0 ? props.listTitle : props.libraryTitle} nodes={ringNodes} />
        </div>
      )}

      {/* ---- list + files ---- */}
      {(props.showList && props.listTitle) || (props.showFiles && props.libraryTitle) ? (
        <div className={styles.columns}>
          {props.showList && props.listTitle && (
            <NeuCard title={props.listTitle} meta={list.total > list.items.length ? `${list.items.length} of ${list.total}` : `${list.items.length} item${list.items.length === 1 ? '' : 's'}`}>
              {list.items.length === 0 && !list.loading && <div className={styles.empty}>No items.</div>}
              <div className={styles.rows}>
                {list.items.map((it, i) => (
                  <a key={it.Id} className={`${neu.pressedSm} ${styles.row}`} href={`${siteUrl}/Lists/${encodeURIComponent(props.listTitle)}/DispForm.aspx?ID=${it.Id}`} target="_blank" rel="noopener noreferrer">
                    <NeuCircle icon={it.Icon || RING_ICONS[i % RING_ICONS.length]} size={40} small />
                    <div className={styles.rowText}>
                      <span className={styles.rowTitle}>{it.Title}</span>
                      <span className={styles.rowMeta}>
                        {it.Description || [it.AuthorName, it.Modified ? formatDate(it.Modified) : ''].filter(Boolean).join(' · ')}
                      </span>
                    </div>
                    {it.Category && <span className={styles.chip}>{it.Category}</span>}
                    <span className={styles.rowRight}>{it.Modified ? timeAgo(it.Modified) : ''}</span>
                  </a>
                ))}
              </div>
              <div className={styles.footer}>
                <span>{list.columns.length > 0 ? `Extra columns: ${list.columns.join(', ')}` : 'Add Description / Icon / Category / SortOrder columns to enrich the view.'}</span>
                <a className={neu.link} href={`${siteUrl}/Lists/${encodeURIComponent(props.listTitle)}`} target="_blank" rel="noopener noreferrer">Open list <Icon iconName="OpenInNewWindow" /></a>
              </div>
            </NeuCard>
          )}

          {props.showFiles && props.libraryTitle && (
            <NeuCard title={props.libraryTitle} meta={`latest ${library.files.length}`}>
              {library.files.length === 0 && !library.loading && <div className={styles.empty}>No files.</div>}
              <div className={styles.tiles}>
                {library.files.map(f => (
                  <a key={f.Id} className={`${neu.raisedSm} ${styles.tile}`} href={`${origin}${f.Url}?web=1`} target="_blank" rel="noopener noreferrer" title={`${f.Name}\n${formatBytes(f.Size)} · ${f.EditorName || ''} · ${formatDate(f.Modified)}`}>
                    <NeuCircle icon={fileIcon(f.Extension)} size={60} />
                    <span className={styles.ext}>{f.Extension || 'file'}</span>
                    <span className={styles.tileName}>{f.Name}</span>
                    <span className={styles.tileMeta}>{formatBytes(f.Size)} · {timeAgo(f.Modified)}</span>
                  </a>
                ))}
              </div>
              <div className={styles.footer}>
                <span>{library.total} item{library.total === 1 ? '' : 's'} in the library</span>
                <a className={neu.link} href={`${siteUrl}/${encodeURIComponent(props.libraryTitle)}`} target="_blank" rel="noopener noreferrer">Open library <Icon iconName="OpenInNewWindow" /></a>
              </div>
            </NeuCard>
          )}
        </div>
      ) : null}
    </NeuRoot>
  );
};

const Infomatic: React.FC<IInfomaticProps> = (props) => (
  <ThemeProvider defaultMode={props.defaultTheme} allowUserChoice={props.showThemeToggle}>
    <InfomaticBody {...props} />
  </ThemeProvider>
);

export default Infomatic;
