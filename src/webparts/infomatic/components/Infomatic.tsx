import * as React from 'react';
import { Icon, Spinner, SpinnerSize } from '@fluentui/react';
import styles from './Infomatic.module.scss';
import type { IInfomaticProps } from './IInfomaticProps';
import { ThemeProvider } from '../../../theme/ThemeContext';
import { neu, NeuButton, NeuCard, NeuCircle, NeuNotice, NeuRoot, ThemeToggle } from '../../../components/neu';
import { NeuRing, IRingNode } from '../../../components/neu/NeuRing';
import { useListItems } from '../../../hooks/useListItems';
import { useLibraryFiles } from '../../../hooks/useLibraryFiles';
import { IListItem } from '../../../models/IListItem';
import { fileIcon, formatBytes, formatDate, timeAgo } from '../../../models/ILibraryFile';
import { normalizeSiteUrl } from '../../../services/pnpjsConfig';
import { SCREENS } from '../screens';
import { ScreenContent } from './ScreenContent';

/** Icons cycled for list rows without an "Icon" column — same set as the sample. */
const RING_ICONS = ['Ringer', 'Work', 'Globe', 'Lightbulb', 'Contact', 'PieDouble', 'Settings', 'Rocket', 'Shield'];

/**
 * Views of the app. The landing page is the ring; its 8 buttons open the 8
 * screens (1.2.0, content to come). List / files views come from the KPI
 * discs, the item page from a list row. Every non-landing view shows the
 * compact ring on the left and the browser Back button walks the history.
 */
type View =
  | { kind: 'home' }
  | { kind: 'screen'; index: number }
  | { kind: 'list' }
  | { kind: 'files' }
  | { kind: 'item'; id: number };
const HOME: View = { kind: 'home' };
const sameView = (a: View, b: View): boolean => {
  if (a.kind !== b.kind) { return false; }
  if (a.kind === 'item' && b.kind === 'item') { return a.id === b.id; }
  if (a.kind === 'screen' && b.kind === 'screen') { return a.index === b.index; }
  return true;
};

/**
 * FEATURE (asks: "display data from list and library", "look and feel like the
 * sample", "theme changer", "full screen like the Biography", "landing screen
 * using the ring as navigation with 8 buttons around the circle, centre = back
 * to the landing page"). Pure presentation: data comes from the two hooks.
 */
const InfomaticBody: React.FC<IInfomaticProps> = (props) => {
  const max = Math.max(1, Math.min(props.maxItems || 8, 50));
  const list = useListItems(props.listTitle, max, props.dataSiteUrl);
  const library = useLibraryFiles(props.libraryTitle, max, props.dataSiteUrl);
  const loading = list.loading || library.loading;
  // header Refresh → screen content blocks (they own their hooks) reload when this changes
  const [reloadToken, setReloadToken] = React.useState<number>(0);
  // links (item forms, list / library pages) must point at the site the data comes from
  const siteUrl = normalizeSiteUrl(props.dataSiteUrl) || props.siteUrl;
  const origin = window.location.origin;
  const title = props.title || 'Infomatic';

  /* ---------------- navigation (views + browser history) ---------------- */
  const [view, setViewState] = React.useState<View>(() => {
    const s = window.history.state as { infomatic?: View } | null;
    return s && s.infomatic ? s.infomatic : HOME;
  });
  const go = React.useCallback((next: View): void => {
    setViewState(prev => {
      if (sameView(prev, next)) { return prev; }
      try { window.history.pushState({ ...(window.history.state || {}), infomatic: next }, ''); } catch { /* sandboxed */ }
      return next;
    });
  }, []);
  React.useEffect(() => {
    const onPop = (e: PopStateEvent): void => {
      const s = e.state as { infomatic?: View } | null;
      setViewState(s && s.infomatic ? s.infomatic : HOME);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const goHome = React.useCallback((): void => go(HOME), [go]);

  /* ---------------- full screen (same behaviour as the Biography web part) ---------------- */
  const [isFullScreen, setIsFullScreen] = React.useState<boolean>(false);
  const [fullScreenTop, setFullScreenTop] = React.useState<number>(0);
  React.useEffect(() => {
    if (!isFullScreen) { return; }
    window.scrollTo(0, 0);
    const measure = (): void => {
      let bottom = 0;
      ['#SuiteNavWrapper', '#SuiteNavPlaceholder', '#SuiteNavPlaceHolder', '#O365_NavHeader', '#spSiteHeader'].forEach(sel => {
        const el = document.querySelector(sel);
        if (el) { bottom = Math.max(bottom, el.getBoundingClientRect().bottom); }
      });
      setFullScreenTop(Math.max(0, Math.round(bottom)));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [isFullScreen]);
  React.useEffect(() => {
    if (!isFullScreen) { return; }
    const onKey = (e: KeyboardEvent): void => { if (e.key === 'Escape') { setIsFullScreen(false); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFullScreen]);

  /* ---------------- derived data ---------------- */
  const itemHref = (it: IListItem): string => `${siteUrl}/Lists/${encodeURIComponent(props.listTitle)}/DispForm.aspx?ID=${it.Id}`;
  const iconOf = (it: IListItem, i: number): string => it.Icon || RING_ICONS[i % RING_ICONS.length];

  // the 8 navigation buttons around the ring → the 8 screens
  const ringNodes: IRingNode[] = React.useMemo(() => SCREENS.map((s, i) => ({
    key: s.key,
    icon: s.icon,
    caption: s.caption,
    label: s.label,
    active: view.kind === 'screen' && view.index === i,
    onClick: () => go({ kind: 'screen', index: i })
  })), [view, go]);

  const lastUpdate = React.useMemo(() => {
    const dates = list.items.map(i => i.Modified).concat(library.files.map(f => f.Modified)).filter(Boolean) as string[];
    if (dates.length === 0) { return undefined; }
    return dates.reduce((a, b) => (new Date(a) > new Date(b) ? a : b));
  }, [list.items, library.files]);

  const refresh = (): void => {
    list.refresh().catch(() => undefined);
    library.refresh().catch(() => undefined);
    setReloadToken(t => t + 1);
  };

  const nothingConfigured = !props.listTitle && !props.libraryTitle;
  const current: IListItem | undefined = view.kind === 'item' ? list.items.filter(i => i.Id === view.id)[0] : undefined;
  const currentIndex = current ? list.items.indexOf(current) : -1;

  /* ---------------- pieces ---------------- */

  const homeDisc = (
    <button type="button" className={styles.homeDisc} onClick={goHome} title={`Back to ${title}`} aria-label={`Back to ${title}`}>
      <NeuCircle icon="Home" size={48} small />
      <span className={`${neu.gradientText} ${styles.homeTitle}`}>{title}</span>
    </button>
  );

  const header = (
    <header className={styles.header}>
      <div className={styles.titleBlock}>
        {view.kind === 'home'
          ? (
            <>
              <h2 className={`${styles.title} ${neu.gradientText}`}>{title}</h2>
              {props.subtitle && <p className={styles.subtitle}>{props.subtitle}</p>}
            </>
          )
          : (
            <nav className={styles.crumbs} aria-label="Breadcrumb">
              {homeDisc}
              <Icon iconName="ChevronRight" className={styles.crumbSep} />
              <span className={styles.crumbCurrent}>
                {view.kind === 'screen' ? SCREENS[view.index].label
                  : view.kind === 'list' ? props.listTitle
                    : view.kind === 'files' ? props.libraryTitle
                      : current ? current.Title : 'Item'}
              </span>
            </nav>
          )}
      </div>
      <div className={styles.headerActions}>
        <NeuButton icon="Refresh" title="Refresh" onClick={refresh} disabled={loading} />
        {props.showThemeToggle && <ThemeToggle />}
        {props.showFullScreenButton && (
          <NeuButton
            icon={isFullScreen ? 'BackToWindow' : 'FullScreen'}
            title={isFullScreen ? 'Minimize (Esc)' : 'Full screen'}
            pressed={isFullScreen}
            onClick={() => setIsFullScreen(!isFullScreen)}
          />
        )}
      </div>
    </header>
  );

  const notices = (
    <>
      {nothingConfigured && (
        <div className={styles.section}>
          <NeuNotice kind={props.isEditMode ? 'warn' : 'info'}>
            {props.isEditMode ? 'Set a list title and / or a document library title in the property pane.' : 'Nothing to show yet.'}
          </NeuNotice>
        </div>
      )}
      {props.isEditMode && list.error && <div className={styles.section}><NeuNotice kind="warn">List &quot;{props.listTitle}&quot;: {list.error}</NeuNotice></div>}
      {props.isEditMode && library.error && <div className={styles.section}><NeuNotice kind="warn">Library &quot;{props.libraryTitle}&quot;: {library.error}</NeuNotice></div>}
    </>
  );

  const stat = (icon: string, value: React.ReactNode, label: string, onClick?: () => void, active?: boolean): JSX.Element => {
    const inner = (
      <>
        <NeuCircle icon={icon} size={54} small className={active ? styles.statActive : undefined} />
        <div className={styles.statText}>
          <span className={styles.statValue}>{value}</span>
          <span className={styles.statLabel}>{label}</span>
        </div>
        {onClick && <Icon iconName="ChevronRight" className={styles.statChevron} />}
      </>
    );
    return onClick
      ? <button key={label} type="button" className={`${neu.raised} ${styles.stat} ${styles.statButton}`} onClick={onClick} aria-pressed={active}>{inner}</button>
      : <div key={label} className={`${neu.raised} ${styles.stat}`}>{inner}</div>;
  };

  const stats = !nothingConfigured && (
    <div className={styles.stats}>
      {props.listTitle && stat('BulletedList', list.total, 'List items', props.showList ? () => go({ kind: 'list' }) : undefined, view.kind === 'list')}
      {props.libraryTitle && stat('DocumentSet', library.total, 'Files & folders', props.showFiles ? () => go({ kind: 'files' }) : undefined, view.kind === 'files')}
      {props.libraryTitle && stat('HardDriveGroup', formatBytes(library.bytes), `Size (latest ${library.files.length})`)}
      {stat('Clock', lastUpdate ? timeAgo(lastUpdate) : '—', 'Last update')}
    </div>
  );

  const listCard = props.listTitle && (
    <NeuCard title={props.listTitle} meta={list.total > list.items.length ? `${list.items.length} of ${list.total}` : `${list.items.length} item${list.items.length === 1 ? '' : 's'}`}>
      {list.items.length === 0 && !list.loading && <div className={styles.empty}>No items.</div>}
      <div className={styles.rows}>
        {list.items.map((it, i) => (
          <button key={it.Id} type="button" className={`${neu.pressedSm} ${styles.row} ${styles.rowButton}`} onClick={() => go({ kind: 'item', id: it.Id })}>
            <NeuCircle icon={iconOf(it, i)} size={40} small />
            <div className={styles.rowText}>
              <span className={styles.rowTitle}>{it.Title}</span>
              <span className={styles.rowMeta}>{it.Description || [it.AuthorName, it.Modified ? formatDate(it.Modified) : ''].filter(Boolean).join(' · ')}</span>
            </div>
            {it.Category && <span className={styles.chip}>{it.Category}</span>}
            <span className={styles.rowRight}>{it.Modified ? timeAgo(it.Modified) : ''}</span>
          </button>
        ))}
      </div>
      <div className={styles.footer}>
        <span>{list.columns.length > 0 ? `Extra columns: ${list.columns.join(', ')}` : 'Add Description / Icon / Category / SortOrder / Url / Content columns to enrich the view.'}</span>
        <a className={neu.link} href={`${siteUrl}/Lists/${encodeURIComponent(props.listTitle)}`} target="_blank" rel="noopener noreferrer">Open list <Icon iconName="OpenInNewWindow" /></a>
      </div>
    </NeuCard>
  );

  const filesCard = props.libraryTitle && (
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
  );

  /* ---------------- views ---------------- */

  const landing = (
    <>
      {props.showRing && (
        <div className={styles.section}>
          <NeuRing
            layout="circle"
            title={title}
            subtitle={props.subtitle}
            nodes={ringNodes}
            max={8}
            onCenterClick={goHome}
            centerTitle={`${title} — landing page`}
            centerIcon="Home"
          />
        </div>
      )}
      {loading && !nothingConfigured && list.items.length === 0 && library.files.length === 0 && <Spinner size={SpinnerSize.large} label="Loading…" />}
      {stats}
      {!props.showRing && (
        <div className={styles.columns}>
          {props.showList && listCard}
          {props.showFiles && filesCard}
        </div>
      )}
    </>
  );

  const itemView = current ? (
    <div className={styles.itemView}>
      <div className={`${neu.raised} ${styles.itemHero}`}>
        <NeuCircle icon={iconOf(current, Math.max(0, currentIndex))} size={96} />
        <div className={styles.itemHeroText}>
          {current.Category && <span className={styles.caption}>{current.Category}</span>}
          <h3 className={styles.itemTitle}>{current.Title}</h3>
          <span className={styles.itemMeta}>{[current.AuthorName, current.Modified ? `updated ${timeAgo(current.Modified)}` : ''].filter(Boolean).join(' · ')}</span>
          <div className={styles.itemActions}>
            {current.Url && <NeuButton icon="Link" text={current.UrlText || 'Open'} title={current.Url} href={current.Url} />}
            <NeuButton icon="EntryView" text="Open item" title="Open the list item in SharePoint" href={itemHref(current)} />
          </div>
        </div>
      </div>
      {current.Description && <NeuCard title="Summary"><p className={styles.prose}>{current.Description}</p></NeuCard>}
      {current.Content && (
        <NeuCard title="Content">
          <div className={styles.prose} dangerouslySetInnerHTML={{ __html: current.Content }} />
        </NeuCard>
      )}
      {!current.Description && !current.Content && !current.Url && (
        <NeuNotice>Add <strong>Description</strong>, <strong>Content</strong> (rich text) or <strong>Url</strong> (hyperlink) columns to the list to give this page a body and a destination.</NeuNotice>
      )}
      <div className={styles.pager}>
        <NeuButton icon="ChevronLeft" text="Previous" disabled={currentIndex <= 0} onClick={() => go({ kind: 'item', id: list.items[currentIndex - 1].Id })} />
        <NeuButton icon="Home" text="Landing page" onClick={goHome} />
        <NeuButton icon="ChevronRight" text="Next" disabled={currentIndex < 0 || currentIndex >= list.items.length - 1} onClick={() => go({ kind: 'item', id: list.items[currentIndex + 1].Id })} />
      </div>
    </div>
  ) : (
    <div className={styles.section}>
      {list.loading ? <Spinner size={SpinnerSize.large} label="Loading…" /> : <NeuNotice kind="warn">This item is no longer in the first {max} rows of the list. <button type="button" className={styles.linkButton} onClick={goHome}>Back to the landing page</button>.</NeuNotice>}
    </div>
  );

  const screenView = view.kind === 'screen' && (
    <div className={styles.itemView}>
      <ScreenContent
        index={view.index}
        siteUrl={siteUrl}
        dataSiteUrl={props.dataSiteUrl}
        libraryTitle={props.libraryTitle}
        accordionListTitle={props.accordionListTitle}
        accordionContentField={props.accordionContentField}
        accordionCategoryField={props.accordionCategoryField}
        accordionLayout={props.accordionLayout}
        isEditMode={props.isEditMode}
        reloadToken={reloadToken}
      />
      <div className={styles.pager}>
        <NeuButton icon="ChevronLeft" text={view.index > 0 ? SCREENS[view.index - 1].label : 'Previous'} disabled={view.index <= 0} onClick={() => go({ kind: 'screen', index: view.index - 1 })} />
        <NeuButton icon="Home" text="Landing page" onClick={goHome} />
        <NeuButton icon="ChevronRight" text={view.index < SCREENS.length - 1 ? SCREENS[view.index + 1].label : 'Next'} disabled={view.index >= SCREENS.length - 1} onClick={() => go({ kind: 'screen', index: view.index + 1 })} />
      </div>
    </div>
  );

  // every screen but the landing page: compact ring on the left, content on the right
  const shell = (content: React.ReactNode): JSX.Element => (
    <div className={styles.shell}>
      <aside className={styles.shellNav} aria-label="Navigation">
        <NeuRing
          compact
          title={title}
          nodes={ringNodes}
          max={8}
          onCenterClick={goHome}
          centerTitle={`Back to ${title}`}
          centerIcon="Home"
        />
      </aside>
      <div className={styles.shellContent}>{content}</div>
    </div>
  );

  return (
    <NeuRoot className={isFullScreen ? neu.fullScreenMode : undefined} style={isFullScreen ? { top: fullScreenTop } : undefined}>
      {header}
      {notices}
      {view.kind === 'home' && landing}
      {view.kind === 'screen' && shell(screenView)}
      {view.kind === 'item' && shell(itemView)}
      {view.kind === 'list' && shell(listCard)}
      {view.kind === 'files' && shell(filesCard)}
    </NeuRoot>
  );
};

const Infomatic: React.FC<IInfomaticProps> = (props) => (
  <ThemeProvider defaultMode={props.defaultTheme} allowUserChoice={props.showThemeToggle}>
    <InfomaticBody {...props} />
  </ThemeProvider>
);

export default Infomatic;
