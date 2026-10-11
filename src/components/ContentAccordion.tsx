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

export interface IContentAccordionProps {
  data: IUseContentSectionsResult;
  listTitle: string;
  contentField?: string;
  isEditMode: boolean;
  showSearch?: boolean;
  showFilter?: boolean;
  showExpandCollapse?: boolean;
  /** Open only one section at a time. */
  single?: boolean;
}

interface IGroup { category: string; items: IContentSection[] }

export const ContentAccordion: React.FC<IContentAccordionProps> = ({ data, listTitle, contentField, isEditMode, showSearch = true, showFilter = true, showExpandCollapse = true, single = false }) => {
  const { sections, loading, error, checked, contentMissing, hasCategory, missingOptional, hiddenByLimit } = data;
  const [query, setQuery] = React.useState<string>('');
  const [category, setCategory] = React.useState<string>('');
  const [open, setOpen] = React.useState<Set<number>>(new Set());

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
    if (query.trim()) { setOpen(new Set(filtered.map(s => s.Id))); }
  }, [query, filtered]);

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

  const toolbar = (showSearch || (showFilter && hasCategory && categories.length > 1) || (showExpandCollapse && !single)) && (
    <div className={styles.toolbar}>
      {showSearch && (
        <label className={`${neu.pressedSm} ${styles.search}`}>
          <Icon iconName="Search" className={styles.searchIcon} />
          <input type="search" className={styles.searchInput} placeholder="Search sections…" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search sections" />
          {query && <button type="button" className={styles.clear} onClick={() => setQuery('')} aria-label="Clear search"><Icon iconName="Cancel" /></button>}
        </label>
      )}
      {showExpandCollapse && !single && (
        <div className={styles.toolbarButtons}>
          <NeuButton icon="ExploreContent" title="Expand all" onClick={expandAll} />
          <NeuButton icon="CollapseContent" title="Collapse all" onClick={collapseAll} />
        </div>
      )}
      {showFilter && hasCategory && categories.length > 1 && (
        <div className={styles.chips} role="tablist" aria-label="Filter by category">
          <button type="button" role="tab" aria-selected={!category} className={`${!category ? neu.pressedSm : neu.raisedSm} ${styles.chip} ${!category ? styles.chipActive : ''}`} onClick={() => setCategory('')}>All</button>
          {categories.map(c => (
            <button key={c} type="button" role="tab" aria-selected={category === c} className={`${category === c ? neu.pressedSm : neu.raisedSm} ${styles.chip} ${category === c ? styles.chipActive : ''}`} onClick={() => setCategory(category === c ? '' : c)}>{c}</button>
          ))}
        </div>
      )}
    </div>
  );

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

      {groups.map(g => (
        <div key={g.category} className={styles.group}>
          {hasCategory && !category && <h4 className={`${neu.gradientText} ${styles.groupTitle}`}>{g.category}</h4>}
          {g.items.map(s => {
            const isOpen = open.has(s.Id);
            return (
              <div key={s.Id} className={`${neu.raisedSm} ${styles.item} ${isOpen ? styles.itemOpen : ''}`}>
                <button type="button" className={styles.head} onClick={() => toggle(s.Id)} aria-expanded={isOpen} aria-controls={`infomatic-section-${s.Id}`}>
                  <span className={styles.headTitle}>{s.Title}</span>
                  <span className={`${neu.circleSm} ${styles.chevron}`}><Icon iconName="ChevronDown" className={isOpen ? styles.chevronOpen : undefined} /></span>
                </button>
                <div id={`infomatic-section-${s.Id}`} className={styles.panel} role="region" aria-hidden={!isOpen}>
                  <div className={styles.panelInner}>
                    <div className={`${neu.pressedSm} ${styles.richText}`} dangerouslySetInnerHTML={{ __html: s.Content || '' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {!loading && !error && hiddenByLimit > 0 && (
        <p className={`${neu.muted} ${neu.small}`}>Showing the first {sections.length} sections; {hiddenByLimit} more {hiddenByLimit === 1 ? 'is' : 'are'} hidden by the section limit.</p>
      )}
    </div>
  );
};

export default ContentAccordion;
