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

export interface IDocumentViewerProps {
  files: ILibraryFile[];
  /** Absolute URL of the site that holds the library (for the embed page). */
  siteUrl: string;
  libraryTitle: string;
  loading: boolean;
  error?: string;
  isEditMode: boolean;
}

export const DocumentViewer: React.FC<IDocumentViewerProps> = ({ files, siteUrl, libraryTitle, loading, error, isEditMode }) => {
  const origin = window.location.origin;
  const [selectedId, setSelectedId] = React.useState<number | undefined>(undefined);
  const [frameLoading, setFrameLoading] = React.useState<boolean>(false);

  // keep the selection valid; default to the newest file
  const selected = files.filter(f => f.Id === selectedId)[0] || files[0];
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

  return (
    <div className={styles.root}>
      {isEditMode && error && <NeuNotice kind="warn">Library &quot;{libraryTitle}&quot;: {error}</NeuNotice>}

      {/* viewer */}
      <div className={`${neu.pressed} ${styles.viewer} ${selected && fileKind(selected.Extension) === 'video' ? styles.viewerDark : ''}`}>
        {loading && files.length === 0 && <div className={styles.center}><Spinner size={SpinnerSize.large} label="Loading files…" /></div>}
        {!loading && files.length === 0 && <div className={styles.center}><NeuCircle icon="DocumentSet" size={96} /><p className={neu.muted}>No files in &quot;{libraryTitle}&quot;.</p></div>}
        {selected && renderViewer(selected)}
        {selected && frameLoading && <div className={styles.frameLoading}><Spinner size={SpinnerSize.medium} /></div>}
      </div>

      {/* current file */}
      {selected && (
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
      )}

      {/* file strip */}
      {files.length > 1 && (
        <div className={styles.strip} role="listbox" aria-label={`Files in ${libraryTitle}`}>
          {files.map(f => {
            const active = selected && f.Id === selected.Id;
            return (
              <button key={f.Id} type="button" role="option" aria-selected={!!active}
                className={`${active ? neu.pressedSm : neu.raisedSm} ${styles.chip} ${active ? styles.chipActive : ''}`}
                onClick={() => select(f)} title={`${f.Name}\n${formatBytes(f.Size)} · ${timeAgo(f.Modified)}`}>
                <Icon iconName={fileIcon(f.Extension)} className={styles.chipIcon} />
                <span className={styles.chipName}>{f.Name}</span>
                {fileKind(f.Extension) === 'video' && <Icon iconName="Play" className={styles.chipPlay} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DocumentViewer;
