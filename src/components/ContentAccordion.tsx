/**
 * FEATURE (ask: "for screen 3 add the content accordion solution on the right with
 * the same style of the current Infomatic look and feel … reusable for the other
 * screens"). Neumorphic port of the Showme Accordion: search, category chips,
 * expand / collapse all, sections grouped by category, rich text panels with a
 * smooth open / close. Pure presentation — data comes from `useContentSections`.
 */
import * as React from 'react';
import { Icon, Spinner, SpinnerSize } from '@fluentui/react';
import styles from './ContentAccordion.module.scss';
import { neu, NeuButton, NeuNotice } from './neu';
import { IContentSection, plainTextOf } from '../models/IContentSection';
import type { IUseContentSectionsResult } from '../hooks/useContentSections';

/**
 * FEATURE (ask: "add the setting for the Styling accordion Layout"):
 *   accordion    — every group stacked, sections expand in place
 *   sidebarLeft  — section titles form a menu on the left, one section shown in a panel
 *   sidebarRight — same, menu on the right
 *   tabs         — one tab per category (the chips), that category's sections as an accordion
 */
export type AccordionLayout = 'accordion' | 'sidebarLeft' | 'sidebarRight' | 'tabs';

export interface IContentAccordionProps {
  data: IUseContentSectionsResult;
  listTitle: string;
  contentField?: string;
  isEditMode: boolean;
  layout?: AccordionLayout;
  showSearch?: boolean;
  showFilter?: boolean;
  showExpandCollapse?: boolean;
  /** Open only one section at a time. */
  single?: boolean;
}

interface IGroup { category: string; items: IContentSection[] }

export const ContentAccordion: React.FC<IContentAccordionProps> = ({ data, listTitle, contentField, isEditMode, layout = 'accordion', showSearch = true, showFilter = true, showExpandCollapse = true, single = false }) => {
  const { sections, loading, error, checked, contentMissing, hasCategory, missingOptional, hiddenByLimit } = data;
  const isSidebar = layout === 'sidebarLeft' || layout === 'sidebarRight';
  // tabs need a category column; without one they fall back to the plain accordion
  const isTabs = layout === 'tabs' && hasCategory;
  const [query, setQuery] = React.useState<string>('');
  const [category, setCategory] = React.useState<string>('');
  const [open, setOpen] = React.useState<Set<number>>(new Set());
  const [selectedId, setSelectedId] = React.useState<number | undefined>(undefined);

  // sections marked Expanded start open — applied once per load
  const initRef = React.useRef<string>('');
  React.useEffect(() => {
    const sig = sections.map(s => s.Id).join(',');
    if (sections.length > 0 && initRef.current !== sig) {
      initRef.current = sig;
      setOpen(new Set(sections.filter(s => s.Expanded === true).map(s => s.Id)));
    }
  }, [sections]);

  const searchText = React.useMemo(() => {
    const m = new Map<number, string>();
    sections.forEach(s => m.set(s.Id, plainTextOf(s.Content).toLowerCase()));
    return m;
  }, [sections]);

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    sections.forEach(s => set.add(s.Category || 'General'));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [sections]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return sections.filter(s => {
      if (category && (s.Category || 'General') !== category) { return false; }
      if (!q) { return true; }
      return s.Title.toLowerCase().indexOf(q) >= 0 || (searchText.get(s.Id) || '').indexOf(q) >= 0 || (s.Category || '').toLowerCase().indexOf(q) >= 0;
    });
  }, [sections, query, category, searchText]);

  const groups: IGroup[] = React.useMemo(() => {
    const by = new Map<string, IContentSection[]>();
    filtered.forEach(s => {
      const c = s.Category || 'General';
      const b = by.get(c);
      if (b) { b.push(s); } else { by.set(c, [s]); }
    });
    return Array.from(by.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([cat, items]) => ({ category: cat, items }));
  }, [filtered]);

  // while searching, open every match so the found text is visible
  React.useEffect(() => {
    if (query.trim() && !isSidebar) { setOpen(new Set(filtered.map(s => s.Id))); }
  }, [query, filtered, isSidebar]);

  // tabs: keep a valid active tab (first category when none / filtered away)
  React.useEffect(() => {
    if (!isTabs) { return; }
    if (groups.length === 0) { setCategory(''); return; }
    if (!category || !groups.some(g => g.category === category)) { setCategory(groups[0].category); }
  }, [isTabs, groups, category]);

  // sidebar: keep a valid selection (first Expanded section, else the first visible one)
  React.useEffect(() => {
    if (!isSidebar) { return; }
    if (filtered.length === 0) { setSelectedId(undefined); return; }
    if (selectedId === undefined || !filtered.some(s => s.Id === selectedId)) {
      const preferred = filtered.filter(s => s.Expanded === true)[0] || filtered[0];
      setSelectedId(preferred.Id);
    }
  }, [isSidebar, filtered, selectedId]);
  const selected = selectedId === undefined ? undefined : sections.filter(s => s.Id === selectedId)[0];

  const toggle = (id: number): void => setOpen(prev => {
    const next = single ? new Set<number>() : new Set(prev);
    if (prev.has(id)) { next.delete(id); } else { next.add(id); }
    return next;
  });
  const expandAll = (): void => setOpen(new Set(filtered.map(s => s.Id)));
  const collapseAll = (): void => setOpen(new Set());

  if (!listTitle) {
    return <NeuNotice kind={isEditMode ? 'warn' : 'info'}>{isEditMode ? 'Set the accordion list title in the property pane.' : 'No content list configured.'}</NeuNotice>;
  }

  const chipCls = (active: boolean): string => `${active ? neu.pressedSm : neu.raisedSm} ${styles.chip} ${active ? styles.chipActive : ''}`;
  const showChips = isTabs ? groups.length > 0 : (showFilter && hasCategory && categories.length > 1);
  const showExpand = showExpandCollapse && !single && !isSidebar;

  const toolbar = (showSearch || showChips || showExpand) && (
    <div className={styles.toolbar}>
      {showSearch && (
        <label className={`${neu.pressedSm} ${styles.search}`}>
          <Icon iconName="Search" className={styles.searchIcon} />
          <input type="search" className={styles.searchInput} placeholder="Search sections…" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search sections" />
          {query && <button type="button" className={styles.clear} onClick={() => setQuery('')} aria-label="Clear search"><Icon iconName="Cancel" /></button>}
        </label>
      )}
      {showExpand && (
        <div className={styles.toolbarButtons}>
          <NeuButton icon="ExploreContent" title="Expand all" onClick={expandAll} />
          <NeuButton icon="CollapseContent" title="Collapse all" onClick={collapseAll} />
        </div>
      )}
      {showChips && (
        <div className={`${styles.chips} ${isTabs ? styles.tabs : ''}`} role="tablist" aria-label={isTabs ? 'Categories' : 'Filter by category'}>
          {!isTabs && <button type="button" role="tab" aria-selected={!category} className={chipCls(!category)} onClick={() => setCategory('')}>All</button>}
          {(isTabs ? groups.map(g => g.category) : categories).map(c => (
            <button key={c} type="button" role="tab" aria-selected={category === c} className={chipCls(category === c)} onClick={() => setCategory(isTabs || category !== c ? c : '')}>
              {c}
              {isTabs && <span className={styles.tabCount}>{groups.filter(g => g.category === c)[0].items.length}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const richText = (s: IContentSection): JSX.Element => (
    <div className={`${neu.pressedSm} ${styles.richText}`} dangerouslySetInnerHTML={{ __html: s.Content || '' }} />
  );

  const renderItems = (items: IContentSection[]): JSX.Element[] => items.map(s => {
    const isOpen = open.has(s.Id);
    return (
      <div key={s.Id} className={`${neu.raisedSm} ${styles.item} ${isOpen ? styles.itemOpen : ''}`}>
        <button type="button" className={styles.head} onClick={() => toggle(s.Id)} aria-expanded={isOpen} aria-controls={`infomatic-section-${s.Id}`}>
          <span className={styles.headTitle}>{s.Title}</span>
          <span className={`${neu.circleSm} ${styles.chevron}`}><Icon iconName="ChevronDown" className={isOpen ? styles.chevronOpen : undefined} /></span>
        </button>
        <div id={`infomatic-section-${s.Id}`} className={styles.panel} role="region" aria-hidden={!isOpen}>
          <div className={styles.panelInner}>{richText(s)}</div>
        </div>
      </div>
    );
  });

  const body = isSidebar
    ? (
      <div className={`${styles.sidebarWrap} ${layout === 'sidebarRight' ? styles.sidebarOnRight : ''}`}>
        <nav className={styles.sidebarNav} aria-label="Sections">
          {groups.map(g => (
            <div key={g.category} className={styles.sidebarGroup}>
              {hasCategory && <span className={`${neu.gradientText} ${styles.groupTitle}`}>{g.category}</span>}
              {g.items.map(s => {
                const active = s.Id === selectedId;
                return (
                  <button key={s.Id} type="button" className={`${active ? neu.pressedSm : neu.raisedSm} ${styles.sidebarItem} ${active ? styles.sidebarItemActive : ''}`} onClick={() => setSelectedId(s.Id)} aria-current={active ? 'true' : undefined}>
                    {s.Title}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <div className={styles.sidebarContent}>
          {selected
            ? (
              <>
                <h4 className={styles.sidebarTitle}>{selected.Title}</h4>
                {richText(selected)}
              </>
            )
            : !loading && filtered.length > 0 && <div className={styles.empty}>Select a section from the menu.</div>}
        </div>
      </div>
    )
    : isTabs
      ? (
        <div className={styles.group}>
          {renderItems((groups.filter(g => g.category === category)[0] || { items: [] }).items)}
        </div>
      )
      : groups.map(g => (
        <div key={g.category} className={styles.group}>
          {hasCategory && !category && <h4 className={`${neu.gradientText} ${styles.groupTitle}`}>{g.category}</h4>}
          {renderItems(g.items)}
        </div>
      ));

  return (
    <div className={styles.root}>
      {toolbar}

      {loading && sections.length === 0 && <Spinner size={SpinnerSize.large} label="Loading sections…" />}
      {isEditMode && error && <NeuNotice kind="warn">List &quot;{listTitle}&quot;: {error}</NeuNotice>}
      {!loading && !error && checked && contentMissing && (
        <NeuNotice kind="warn">
          The list &quot;{listTitle}&quot; has no column named &quot;{contentField || 'Content'}&quot;.
          {isEditMode ? ' Pick a text column as the content column in the property pane, or add that column to the list.' : ''}
        </NeuNotice>
      )}
      {isEditMode && !loading && !error && checked && !contentMissing && missingOptional.length > 0 && (
        <NeuNotice>Optional columns not on the list: {missingOptional.join(', ')} — their features are off (editors only see this).</NeuNotice>
      )}
      {!loading && !error && sections.length > 0 && filtered.length === 0 && <NeuNotice>No sections match your search or filter.</NeuNotice>}
      {!loading && !error && checked && !contentMissing && sections.length === 0 && <div className={styles.empty}>No sections to show.</div>}

      {body}

      {!loading && !error && hiddenByLimit > 0 && (
        <p className={`${neu.muted} ${neu.small}`}>Showing the first {sections.length} sections; {hiddenByLimit} more {hiddenByLimit === 1 ? 'is' : 'are'} hidden by the section limit.</p>
      )}
    </div>
  );
};

export default ContentAccordion;
