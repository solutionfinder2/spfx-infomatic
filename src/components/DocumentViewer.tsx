/**
 * FEATURE (ask: "for screen 2, on the right add a document viewer from the document
 * library, including displaying video if there is a video file").
 *
 * A file strip (the library's newest files) and a viewer:
 *   video  → browser <video> for mp4 / webm / m4v / ogv, SharePoint (Stream) player for mov / avi / wmv / mkv
 *   audio  → <audio>
 *   image  → <img>
 *   pdf / Office / other → SharePoint embed page  <site>/_layouts/15/embed.aspx?UniqueId=<guid>
 * Every file also has an "Open" button (new tab) in case the embed is blocked.
 */
import * as React from 'react';
import { Icon, Spinner, SpinnerSize } from '@fluentui/react';
import styles from './DocumentViewer.module.scss';
import { neu, NeuButton, NeuCircle, NeuNotice } from './neu';
import { ILibraryFile, fileIcon, fileKind, formatBytes, isNativeVideo, timeAgo } from '../models/ILibraryFile';

/**
 * FEATURE (ask: "add a layout setting for the document viewer as well"):
 *   strip        — viewer on top, horizontal file strip below (default)
 *   sidebarLeft  — vertical file list on the left, viewer on the right
 *   sidebarRight — viewer on the left, vertical file list on the right
 *   grid         — viewer on top, gallery of file tiles below
 */
export type DocumentViewerLayout = 'strip' | 'sidebarLeft' | 'sidebarRight' | 'grid';

export interface IDocumentViewerProps {
  files: ILibraryFile[];
  /** Absolute URL of the site that holds the library (for the embed page). */
  siteUrl: string;
  libraryTitle: string;
  loading: boolean;
  error?: string;
  isEditMode: boolean;
  layout?: DocumentViewerLayout;
  /** FEATURE (ask: "a document viewer but for one document only"): no file picker, one file. */
  single?: boolean;
  /** File to show in `single` mode — leaf name ("Handbook.pdf") or server-relative URL; empty = newest file. */
  fileName?: string;
}

export const DocumentViewer: React.FC<IDocumentViewerProps> = ({ files, siteUrl, libraryTitle, loading, error, isEditMode, layout = 'strip', single = false, fileName }) => {
  const isSidebar = !single && (layout === 'sidebarLeft' || layout === 'sidebarRight');
  const origin = window.location.origin;
  const [selectedId, setSelectedId] = React.useState<number | undefined>(undefined);
  const [frameLoading, setFrameLoading] = React.useState<boolean>(false);

  // single mode: the named file (case-insensitive leaf name or server-relative path), else the newest
  const wanted = (fileName || '').trim().toLowerCase();
  const named = single && wanted ? files.filter(f => f.Name.toLowerCase() === wanted || f.Url.toLowerCase() === wanted || f.Url.toLowerCase().endsWith(`/${wanted}`))[0] : undefined;
  const namedMissing = single && !!wanted && files.length > 0 && !named;

  // keep the selection valid; default to the newest file
  const selected = single ? (named || files[0]) : (files.filter(f => f.Id === selectedId)[0] || files[0]);
  React.useEffect(() => {
    if (selected && selected.Id !== selectedId) { setSelectedId(selected.Id); }
  }, [selected, selectedId]);

  const select = (f: ILibraryFile): void => {
    if (f.Id === selectedId) { return; }
    setSelectedId(f.Id);
    setFrameLoading(fileKind(f.Extension) !== 'image' && fileKind(f.Extension) !== 'audio' && !isNativeVideo(f.Extension));
  };

  const fileUrl = (f: ILibraryFile): string => `${origin}${f.Url}`;
  const openUrl = (f: ILibraryFile): string => `${fileUrl(f)}?web=1`;
  const embedUrl = (f: ILibraryFile): string => `${siteUrl}/_layouts/15/embed.aspx?UniqueId=${encodeURIComponent(f.UniqueId)}`;

  const renderViewer = (f: ILibraryFile): JSX.Element => {
    const kind = fileKind(f.Extension);
    switch (kind) {
      case 'video':
        if (isNativeVideo(f.Extension)) {
          return (
            <video key={f.Id} className={styles.media} controls preload="metadata" src={fileUrl(f)}>
              Your browser cannot play this video. <a href={openUrl(f)} target="_blank" rel="noopener noreferrer">Open it</a> instead.
            </video>
          );
        }
        // .mov / .avi / .wmv / .mkv — let SharePoint's Stream player handle them
        return <iframe key={f.Id} className={styles.frame} src={embedUrl(f)} title={f.Name} allow="autoplay; fullscreen" allowFullScreen onLoad={() => setFrameLoading(false)} />;
      case 'audio':
        return (
          <div className={styles.audioWrap}>
            <NeuCircle icon="MusicInCollection" size={96} />
            <audio key={f.Id} className={styles.audio} controls preload="metadata" src={fileUrl(f)} />
          </div>
        );
      case 'image':
        return <img key={f.Id} className={styles.image} src={fileUrl(f)} alt={f.Name} />;
      default:
        return <iframe key={f.Id} className={styles.frame} src={embedUrl(f)} title={f.Name} allowFullScreen onLoad={() => setFrameLoading(false)} />;
    }
  };

  if (!libraryTitle) {
    return <NeuNotice kind={isEditMode ? 'warn' : 'info'}>{isEditMode ? 'Set a document library title in the property pane to use the viewer.' : 'No document library configured.'}</NeuNotice>;
  }

  const viewer = (
    <div className={`${neu.pressed} ${styles.viewer} ${selected && fileKind(selected.Extension) === 'video' ? styles.viewerDark : ''}`}>
      {loading && files.length === 0 && <div className={styles.center}><Spinner size={SpinnerSize.large} label="Loading files…" /></div>}
      {!loading && files.length === 0 && <div className={styles.center}><NeuCircle icon="DocumentSet" size={96} /><p className={neu.muted}>No files in &quot;{libraryTitle}&quot;.</p></div>}
      {selected && renderViewer(selected)}
      {selected && frameLoading && <div className={styles.frameLoading}><Spinner size={SpinnerSize.medium} /></div>}
    </div>
  );

  const current = selected && (
    <div className={styles.current}>
      <NeuCircle icon={fileIcon(selected.Extension)} size={48} small />
      <div className={styles.currentText}>
        <span className={styles.currentName} title={selected.Name}>{selected.Name}</span>
        <span className={styles.currentMeta}>
          {[selected.Extension ? selected.Extension.toUpperCase() : '', formatBytes(selected.Size), selected.EditorName, selected.Modified ? `updated ${timeAgo(selected.Modified)}` : ''].filter(Boolean).join(' · ')}
        </span>
      </div>
      <div className={styles.currentActions}>
        <NeuButton icon="OpenInNewWindow" text="Open" title="Open the file in a new tab" href={openUrl(selected)} />
        <NeuButton icon="Download" title="Download" href={`${fileUrl(selected)}?download=1`} />
      </div>
    </div>
  );

  const tip = (f: ILibraryFile): string => `${f.Name}\n${formatBytes(f.Size)} · ${timeAgo(f.Modified)}`;
  const isActive = (f: ILibraryFile): boolean => !!selected && f.Id === selected.Id;
  const listLabel = `Files in ${libraryTitle}`;

  // horizontal chips (strip layout)
  const strip = files.length > 1 && (
    <div className={styles.strip} role="listbox" aria-label={listLabel}>
      {files.map(f => (
        <button key={f.Id} type="button" role="option" aria-selected={isActive(f)}
          className={`${isActive(f) ? neu.pressedSm : neu.raisedSm} ${styles.chip} ${isActive(f) ? styles.chipActive : ''}`}
          onClick={() => select(f)} title={tip(f)}>
          <Icon iconName={fileIcon(f.Extension)} className={styles.chipIcon} />
          <span className={styles.chipName}>{f.Name}</span>
          {fileKind(f.Extension) === 'video' && <Icon iconName="Play" className={styles.chipPlay} />}
        </button>
      ))}
    </div>
  );

  // vertical rows (sidebar layouts)
  const sideList = (
    <nav className={styles.sideList} aria-label={listLabel}>
      {files.map(f => (
        <button key={f.Id} type="button" aria-current={isActive(f) ? 'true' : undefined}
          className={`${isActive(f) ? neu.pressedSm : neu.raisedSm} ${styles.row} ${isActive(f) ? styles.rowActive : ''}`}
          onClick={() => select(f)} title={tip(f)}>
          <NeuCircle icon={fileIcon(f.Extension)} size={36} small />
          <span className={styles.rowText}>
            <span className={styles.rowName}>{f.Name}</span>
            <span className={styles.rowMeta}>{formatBytes(f.Size)} · {timeAgo(f.Modified)}</span>
          </span>
          {fileKind(f.Extension) === 'video' && <Icon iconName="Play" className={styles.chipPlay} />}
        </button>
      ))}
    </nav>
  );

  // gallery tiles (grid layout)
  const grid = files.length > 1 && (
    <div className={styles.grid} role="listbox" aria-label={listLabel}>
      {files.map(f => (
        <button key={f.Id} type="button" role="option" aria-selected={isActive(f)}
          className={`${isActive(f) ? neu.pressedSm : neu.raisedSm} ${styles.tile} ${isActive(f) ? styles.tileActive : ''}`}
          onClick={() => select(f)} title={tip(f)}>
          <NeuCircle icon={fileIcon(f.Extension)} size={56} />
          <span className={styles.tileExt}>{f.Extension || 'file'}</span>
          <span className={styles.tileName}>{f.Name}</span>
          <span className={styles.rowMeta}>{formatBytes(f.Size)} · {timeAgo(f.Modified)}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className={styles.root}>
      {isEditMode && error && <NeuNotice kind="warn">Library &quot;{libraryTitle}&quot;: {error}</NeuNotice>}
      {isEditMode && namedMissing && <NeuNotice kind="warn">&quot;{fileName}&quot; was not found among the newest {files.length} files of &quot;{libraryTitle}&quot; — showing the newest file instead. Check the name in <strong>Single document</strong>.</NeuNotice>}
      {single
        ? (
          <>
            {viewer}
            {current}
          </>
        )
        : isSidebar
        ? (
          <div className={`${styles.sidebarWrap} ${layout === 'sidebarRight' ? styles.sidebarOnRight : ''}`}>
            {sideList}
            <div className={styles.sidebarMain}>
              {viewer}
              {current}
            </div>
          </div>
        )
          : (
            <>
              {viewer}
              {current}
              {layout === 'grid' ? grid : strip}
            </>
          )}
    </div>
  );
};

export default DocumentViewer;
