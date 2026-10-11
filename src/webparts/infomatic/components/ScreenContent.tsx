/**
 * Renders the body of one of the 8 screens from its `content` declaration in
 * `screens.ts`. Each content type is a small self-contained component that owns
 * its data hook, so the same block can be used on any number of screens.
 */
import * as React from 'react';
import { NeuCard, NeuNotice } from '../../../components/neu';
import { DocumentViewer, DocumentViewerLayout } from '../../../components/DocumentViewer';
import { AccordionLayout, ContentAccordion } from '../../../components/ContentAccordion';
import { useLibraryFiles } from '../../../hooks/useLibraryFiles';
import { useContentSections } from '../../../hooks/useContentSections';
import { IScreenDef, SCREENS } from '../screens';

/** Web part settings the content blocks fall back to. */
export interface IScreenDataDefaults {
  /** Absolute URL of the data site (already resolved). */
  siteUrl: string;
  /** Site URL as configured (may be empty = current); passed to the hooks. */
  dataSiteUrl?: string;
  libraryTitle: string;
  accordionListTitle: string;
  accordionContentField: string;
  accordionCategoryField: string;
  accordionLayout: AccordionLayout;
  documentLayout: DocumentViewerLayout;
  /** File name for single-document screens (property pane "Single document"). */
  singleDocumentName: string;
  isEditMode: boolean;
  /** Bumped by the header Refresh button; blocks reload when it changes. */
  reloadToken: number;
}

export interface IScreenContentProps extends IScreenDataDefaults {
  index: number;
}

/* ---------- documents ---------- */

const DocumentsBlock: React.FC<{ def: IScreenDef; libraryTitle: string; layout: DocumentViewerLayout; single?: boolean; fileName?: string } & IScreenDataDefaults> = (p) => {
  // the viewer browses the whole library (newest 100), independent of "Items per source"
  const library = useLibraryFiles(p.libraryTitle, 100, p.dataSiteUrl);
  const first = React.useRef(true);
  React.useEffect(() => {
    if (first.current) { first.current = false; return; }
    library.refresh().catch(() => undefined);
  }, [p.reloadToken]);
  const n = library.files.length;
  const meta = p.single
    ? (p.fileName || (n > 0 ? 'newest file' : p.def.caption))
    : n > 0 ? `${n}${library.total > n ? ` of ${library.total}` : ''} file${n === 1 ? '' : 's'} · newest first` : p.def.caption;
  return (
    <NeuCard title={p.single ? p.def.label : (p.libraryTitle || p.def.label)} meta={meta}>
      <DocumentViewer files={library.files} siteUrl={p.siteUrl} libraryTitle={p.libraryTitle} loading={library.loading} error={library.error} isEditMode={p.isEditMode} layout={p.layout} single={p.single} fileName={p.fileName} />
    </NeuCard>
  );
};

/* ---------- accordion ---------- */

const AccordionBlock: React.FC<{ def: IScreenDef; content: Extract<IScreenDef['content'], { type: 'accordion' }> } & IScreenDataDefaults> = (p) => {
  const listTitle = p.content.listTitle || p.accordionListTitle;
  const contentField = p.content.contentField || p.accordionContentField;
  const categoryField = p.content.categoryField || p.accordionCategoryField;
  const data = useContentSections(listTitle, { contentField, categoryField, siteUrl: p.dataSiteUrl, max: 100 });
  const first = React.useRef(true);
  React.useEffect(() => {
    if (first.current) { first.current = false; return; }
    data.refresh().catch(() => undefined);
  }, [p.reloadToken]);
  const n = data.sections.length;
  return (
    <NeuCard title={p.def.label} meta={n > 0 ? `${n} section${n === 1 ? '' : 's'}${listTitle ? ` · ${listTitle}` : ''}` : p.def.caption}>
      <ContentAccordion
        data={data}
        listTitle={listTitle}
        contentField={contentField}
        isEditMode={p.isEditMode}
        layout={p.content.layout || p.accordionLayout}
        showSearch={p.content.showSearch}
        showFilter={p.content.showFilter}
        showExpandCollapse={p.content.showExpandCollapse}
        single={p.content.single}
      />
    </NeuCard>
  );
};

/* ---------- dispatcher ---------- */

export const ScreenContent: React.FC<IScreenContentProps> = (props) => {
  const def = SCREENS[props.index];
  const c = def.content;
  switch (c.type) {
    case 'documents':
      return (
        <DocumentsBlock key={def.key} def={def} {...props}
          libraryTitle={c.libraryTitle || props.libraryTitle}
          layout={c.layout || props.documentLayout}
          single={c.single}
          fileName={c.single ? (c.fileName || props.singleDocumentName) : undefined} />
      );
    case 'accordion':
      return <AccordionBlock key={def.key} def={def} content={c} {...props} />;
    default:
      return (
        <NeuCard title={def.label} meta={`Screen ${props.index + 1} of ${SCREENS.length}`}>
          <NeuNotice>Content for <strong>{def.label}</strong> will be added here.</NeuNotice>
        </NeuCard>
      );
  }
};

export default ScreenContent;
